// ==UserScript==
// @name         WOA 网页去水印
// @namespace    local.shushu
// @version      1.6.7
// @description  隐藏 KM、8000/iWiki、OTD、RCTS、Learn、QLive、WWITIL 和 Bole 页面动态渲染的水印层
// @match        https://km.woa.com/*
// @match        https://8000.woa.com/*
// @match        https://iwiki.woa.com/*
// @match        https://otd.woa.com/*
// @match        https://rcts.woa.com/*
// @match        https://portal.learn.woa.com/*
// @match        https://qlive.woa.com/*
// @match        https://wwitil.woa.com/*
// @match        https://*.wwitil.woa.com/*
// @match        https://bole.woa.com/*
// @match        https://zhaopin.woa.com/*
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

const baseStyle = `
.article-content-wrapper.watermarked > .watermark,
.article-content-wrapper > .watermark {
  display: none !important;
  background-image: none !important;
}

[class~="fixed"][class~="inset-0"][class~="z-[9999999]"][class~="select-none"][class~="pointer-events-none"][class~="bg-repeat"] {
  display: none !important;
  background-image: none !important;
}

#pageLoader > div[style*="position: absolute"][style*="z-index: 9999"][style*="pointer-events: none"][style*="background-image: url"] {
  display: none !important;
  background-image: none !important;
}

#water-mark {
  display: none !important;
  background-image: none !important;
}

.custom-simple-watermark {
  display: none !important;
  background: none !important;
  background-image: none !important;
}

[id^="video-component_watermark_"],
[id^="article-mode-content_watermark_"] {
  display: none !important;
  background-image: none !important;
}

/* 新增：zhaopin 简历页面 */
.watermark-container {
  display: none !important;
  background: none !important;
  background-image: none !important;
}
`;

const qliveStyle = `
    /* QLive/Q-Learning 直播页：只命中已确认的整页水印 ID 族；保留 DOM，不 display:none，不改尺寸/定位 */
    #watermark-wrapper_watermark_xx512,
    #water-mark-drak001,
    [id^="watermark-wrapper_watermark_"],
    [id^="water-mark-"] {
      pointer-events: none !important;
      background-color: transparent !important;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E") !important;
      background-repeat: repeat !important;
    }
  `;

  const wwitilStyle = `
    [id*="watermark" i],
    [id*="water-mark" i],
    [class*="watermark" i],
    [class*="water-mark" i],
    [style*="pointer-events: none"][style*="background-image: url"],
    [style*="pointer-events:none"][style*="background-image:url"],
    body > div[style*="pointer-events: none"][style*="position: fixed"][style*="z-index: 100000"][style*="background: url"],
    body > div[style*="pointer-events:none"][style*="position:fixed"][style*="z-index:100000"][style*="background:url"] {
      display: none !important;
      background-image: none !important;
    }
  `;

  const host = location.hostname;
  const style = baseStyle + (
    host === 'qlive.woa.com'
      ? qliveStyle
      : ''
  ) + (
    host === 'wwitil.woa.com' || host.endsWith('.wwitil.woa.com')
      ? wwitilStyle
      : ''
  );

  if (typeof GM_addStyle === 'function') {
    GM_addStyle(style);
    return;
  }

  const element = document.createElement('style');
  element.id = 'woa-remove-watermark-style';
  element.textContent = style;
  (document.head || document.documentElement).appendChild(element);
})();
