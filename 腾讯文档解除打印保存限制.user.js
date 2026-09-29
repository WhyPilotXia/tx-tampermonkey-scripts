// ==UserScript==
// @name         腾讯文档允许复制、打印与保存网页
// @namespace    local
// @version      1.1.0
// @description  恢复腾讯文档的复制、打印与保存网页，并在保存前固化 Canvas 正文
// @match        https://docs.qq.com/*
// @match        https://*.docs.qq.com/*
// @match        https://doc.weixin.qq.com/*
// @match        https://docs.wecom.work/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  'use strict';

  const nativePrint = window.print.bind(window);

  function isBrowserShortcut(event) {
    if (!event.metaKey && !event.ctrlKey) return false;
    const key = String(event.key || '').toLowerCase();
    return key === 's' || key === 'p' || key === 'c';
  }

  function preserveBrowserShortcut(event) {
    if (!isBrowserShortcut(event)) return;

    const key = String(event.key || '').toLowerCase();
    if (event.type === 'keydown' && key === 's') {
      createCanvasSnapshots();
    }

    // 阻止网页继续收到快捷键，但不调用 preventDefault，保留浏览器原生行为。
    event.stopImmediatePropagation();
  }

  window.addEventListener('keydown', preserveBrowserShortcut, true);
  window.addEventListener('keypress', preserveBrowserShortcut, true);
  window.addEventListener('keyup', preserveBrowserShortcut, true);

  const style = `
    #print-disable-cover {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
    }

    #toolbar-button-print {
      pointer-events: auto !important;
      cursor: pointer !important;
      opacity: 1 !important;
    }

    #snap-shot-page #content-container,
    #snap-shot-page .melo-doc-view,
    #snap-shot-page .melo-page-view,
    #snap-shot-page .melo-page-render-view,
    #snap-shot-page .melo-page-front-view {
      -webkit-user-select: text !important;
      user-select: text !important;
    }

    .tencent-docs-canvas-snapshot {
      pointer-events: none !important;
    }

    @media print {
      html,
      body,
      #padbody,
      #snap-shot-page,
      #content-container {
        visibility: visible !important;
        opacity: 1 !important;
      }

      #print-disable-cover {
        display: none !important;
      }
    }
  `;

  if (typeof GM_addStyle === 'function') {
    GM_addStyle(style);
  } else {
    const styleElement = document.createElement('style');
    styleElement.id = 'tencent-docs-enable-print-save-style';
    styleElement.textContent = style;
    (document.head || document.documentElement).appendChild(styleElement);
  }

  function enablePrintButton() {
    const button = document.getElementById('toolbar-button-print');
    if (!button || button.dataset.printSaveEnabled === '1') return;

    button.dataset.printSaveEnabled = '1';
    button.setAttribute('aria-disabled', 'false');
    button.setAttribute('tabindex', '0');

    let element = button.parentElement;
    while (element && element.id !== 'print') {
      for (const className of Array.from(element.classList)) {
        if (className.includes('toolbar-button_disabled')) {
          element.classList.remove(className);
        }
      }
      element = element.parentElement;
    }

    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      nativePrint();
    }, true);
  }

  function createCanvasSnapshots() {
    for (const oldSnapshot of document.querySelectorAll('.tencent-docs-canvas-snapshot')) {
      oldSnapshot.remove();
    }

    const canvases = document.querySelectorAll('canvas.melo-page-main-view');
    for (const canvas of canvases) {
      const style = getComputedStyle(canvas);
      if (canvas.width <= 1 || canvas.height <= 1 || style.visibility === 'hidden') {
        continue;
      }

      try {
        const image = document.createElement('img');
        image.className = `${canvas.className} tencent-docs-canvas-snapshot`;
        image.alt = '腾讯文档页面快照';
        image.src = canvas.toDataURL('image/png');
        image.style.cssText = canvas.style.cssText;
        image.style.visibility = 'visible';
        canvas.insertAdjacentElement('afterend', image);
      } catch (error) {
        console.warn('[腾讯文档打印保存] Canvas 快照生成失败', error);
      }
    }
  }

  function extractDocumentText() {
    const pageViews = document.querySelectorAll('#snap-shot-page .melo-page-view');
    const pages = pageViews.length
      ? pageViews
      : document.querySelectorAll('#snap-shot-page .melo-doc-view');
    const parts = [];

    for (const page of pages) {
      const text = String(page.innerText || page.textContent || '')
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      if (text && !parts.includes(text)) {
        parts.push(text);
      }
    }

    return parts.join('\n\n');
  }

  function copyDocumentText() {
    const selectedText = String(window.getSelection ? window.getSelection() : '').trim();
    const text = selectedText || extractDocumentText();

    if (!text) {
      window.alert('当前页面没有可从 DOM 提取的文本；可能尚未完成渲染。');
      return;
    }

    GM_setClipboard(text, 'text');
    window.alert(selectedText ? '已复制选中的文本。' : '已复制当前已渲染的文档文本。');
  }

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('复制文档纯文本', copyDocumentText);
    GM_registerMenuCommand('为保存网页生成 Canvas 快照', createCanvasSnapshots);
  }

  function start() {
    enablePrintButton();

    const observer = new MutationObserver(enablePrintButton);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  if (document.documentElement) {
    start();
  } else {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  }
})();
