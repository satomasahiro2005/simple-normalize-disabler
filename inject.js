// YouTube は <video>.volume に「本人の音量 × 下げ幅」を入れてノーマライズしている。
// その代入を横取りして本人の音量（player.getVolume()）だけを入れる。
// 測ったラウドネス（cont.）は書き換えないので、Stats for nerds には本当の値が出る。
// Normalized の % だけは実際に鳴っている音量に合わせて直す。
(() => {
  'use strict';

  const desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'volume');

  function playerOf(el) {
    const p = el.closest && el.closest('.html5-video-player');
    return p && typeof p.getVolume === 'function' ? p : null;
  }

  Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
    configurable: true,
    enumerable: desc.enumerable,
    get() { return desc.get.call(this); },
    set(v) {
      const p = playerOf(this);
      if (p) {
        const user = p.getVolume();
        if (typeof user === 'number' && user >= 0 && user <= 100) v = user / 100;
      }
      desc.set.call(this, v);
    },
  });

  // "100%/52% (cont.-8.3dB tgt.-14.0dB)" → "100%/100% (cont.-8.3dB tgt.-14.0dB)"
  const fixVolumeText = (s) => s.replace(/^(\s*(\d+)%\s*\/\s*)\d+%/, '$1$2%');

  // 画面の行: "Volume / Normalized  100%/52% (cont.-8.3dB tgt.-14.0dB)" → "Volume  100% (cont.-8.3dB)"
  const PANEL_RE = /^(\s*)(\d+)%\s*\/\s*\d+%(\s*DRC)?\s*(?:\(cont\.(-?[\d.]+)dB[^)]*\))?/;
  function panelVolumeText(s) {
    const m = s.match(PANEL_RE);
    if (!m) return null;
    const [all, sp, user, drc, cont] = m;
    return `${sp}${user}%${drc || ''}${cont ? ` (cont.${cont}dB)` : ''}${s.slice(all.length)}`;
  }

  function fixPanel(panel) {
    for (const row of panel.querySelectorAll('.html5-video-info-panel-content > div')) {
      const label = row.firstElementChild;
      const span = row.querySelector(':scope > span');
      if (!label || !span) continue;
      if (!row.dataset.ytnnVolume) {
        if (label.textContent.trim() !== 'Volume / Normalized') continue;
        row.dataset.ytnnVolume = '1';
        label.textContent = 'Volume';
      }
      const text = panelVolumeText(span.textContent);
      if (text !== null && text !== span.textContent) span.textContent = text;
    }
  }

  function hookPlayer(p) {
    if (p.__ytnnHooked || typeof p.getStatsForNerds !== 'function') return;
    p.__ytnnHooked = true;
    const orig = p.getStatsForNerds;
    p.getStatsForNerds = function () {
      const s = orig.apply(this, arguments);
      if (s && typeof s.volume === 'string') s.volume = fixVolumeText(s.volume);
      return s;
    };
  }

  new MutationObserver((records) => {
    for (const r of records) {
      const node = r.target.nodeType === 1 ? r.target : r.target.parentElement;
      const panel = node && node.closest('.html5-video-info-panel');
      if (panel) fixPanel(panel);
    }
    for (const p of document.querySelectorAll('.html5-video-player')) hookPlayer(p);
  }).observe(document, { subtree: true, childList: true, characterData: true });
})();
