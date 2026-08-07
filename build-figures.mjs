/* Turn captured prototype DOM into the live figure assets the pages consume.
 *
 * Input : figures.json (from the capture pass) — each figure is the canonical
 *         prototype's own rendered markup at the state its caption describes.
 * Output: v2/figures.css + v2/figures.js
 *
 * Figures render as real DOM, so they stay sharp at any zoom or pixel ratio.
 * Photographs inside them travel as ids and rehydrate from the one shared
 * canonical photo map rather than being duplicated per figure.
 */
import { readFileSync, writeFileSync } from 'fs';

const S = process.env.S || '.';
const store = JSON.parse(readFileSync(S + '/figures.json', 'utf8'));

/* ---- scope a stylesheet so it cannot leak into the host page ----
   A brace-aware walk, because a regex cannot tell a selector list from a
   @keyframes stop list. `html`/`body`/`:root` collapse onto the scope element
   itself (including compounds like `html.streaming`); everything else nests
   under it. @keyframes / @font-face bodies pass through verbatim. */
function scopeSafely(css, sel) {
  const one = s => {
    s = s.trim();
    if (!s) return '';
    if (s === '*') return sel + ',' + sel + ' *';
    const lead = /^(?:html|body|:root)((?:[.#:\[][^\s>+~]*)*)(\s[\s\S]*)?$/i.exec(s);
    if (lead) return sel + (lead[1] || '') + (lead[2] || '');
    return sel + ' ' + s;
  };
  const span = (from) => {                       // index just past the matching }
    let depth = 0, j = from;
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') { depth--; if (!depth) return j; }
    }
    return css.length - 1;
  };

  let out = '', i = 0;
  while (i < css.length) {
    if (css.startsWith('/*', i)) { const e = css.indexOf('*/', i); const j = e < 0 ? css.length : e + 2; out += css.slice(i, j); i = j; continue; }
    const brace = css.indexOf('{', i);
    if (brace < 0) { out += css.slice(i); break; }
    const header = css.slice(i, brace), trimmed = header.trim();
    const close = span(brace);

    if (/^@(?:-webkit-)?(?:keyframes|font-face|import|charset|page|counter-style|property)/i.test(trimmed)) {
      out += css.slice(i, close + 1);                                  // verbatim
    } else if (/^@(?:media|supports|layer|container)/i.test(trimmed)) {
      out += header + '{' + scopeSafely(css.slice(brace + 1, close), sel) + '}';   // recurse
    } else {
      out += header.replace(trimmed, trimmed.split(',').map(one).filter(Boolean).join(',')) + css.slice(brace, close + 1);
    }
    i = close + 1;
  }
  return out;
}

const PX = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/* Photos travel as ids; one shared map hydrates them all.
   loading="lazy" is dropped: the figure is scaled with a transform, and Chromium
   judges laziness on the pre-transform layout box, so images low in a fragment
   never load even though the whole figure is on screen. The figure itself is
   already mounted lazily, so nothing is gained by keeping it. */
function deref(html) {
  return html
    .replace(/src="PHOTO:([^"]+)"/g, (m, id) => 'src="' + PX + '" data-mp="' + id + '"')
    .replace(/\sloading="lazy"/g, '');
}

const figs = {};
for (const [key, f] of Object.entries(store.figures)) {
  const cls = f.cls || (/^tenet-/.test(key) ? 'tfig' : null);
  figs[key] = { h: deref(f.html), w: f.w, y: f.h, ...(cls ? { c: cls } : {}) };
}

/* ---- CSS ---- */
const css = [
  '/* live prototype figures — real DOM, sharp at any pixel ratio */',
  '.fig-live{position:relative;display:block;width:100%;overflow:hidden}',
  '.fig-live::before{content:"";display:block;padding-top:calc(var(--fh)/var(--fw)*100%)}',
  '.fig-live>.fig-scale{position:absolute;top:0;left:0;transform-origin:top left;will-change:transform}',
  '.fig-live[data-ready="0"]{background:rgba(0,0,0,.05)}',
  '/* the fragments carry their own layout; nothing here may inherit from the page */',
  '.fig-live .fig-scale{font-size:16px;line-height:normal;text-align:left;letter-spacing:normal}',
  '/* styles.css frames these figures with a tag selector, which no longer matches */',
  '.phone-grid .fig-live{border-radius:18px;border:1px solid rgba(74,59,44,0.14);box-shadow:0 10px 22px rgba(30,18,8,0.10)}',
  '.fig-duo.phones .figure .fig-live,.fig-center .fig-live{margin-left:auto;margin-right:auto}',
  store.css.morsel,
  scopeSafely(store.css['tenet-host'], '.tfig'),
  scopeSafely(store.css['tenet-desktop'], '.tfig'),
  scopeSafely(store.css['doc-wf'] || '', '.docfig-wf'),
  scopeSafely(store.css['doc-ex'] || '', '.docfig-ex'),
  scopeSafely(store.css['doc-ds'] || '', '.docfig-ds'),
  scopeSafely(store.css['doc-tp'] || '', '.docfig-tp')
].join('\n');
/* @keyframes pass through scoping verbatim; a duplicated name across sheets
   would silently redefine an animation for every figure */
{
  const blocks = css.match(/@(?:-webkit-)?keyframes\s+[a-zA-Z0-9_-]+\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g) || [];
  const byName = {};
  for (const b of blocks) {
    const name = /keyframes\s+([a-zA-Z0-9_-]+)/.exec(b)[1];
    const body = b.replace(/\s+/g, '');
    if (byName[name] && byName[name] !== body) throw new Error('conflicting @keyframes definitions for "' + name + '"');
    byName[name] = body;
  }
}
/* companion shares the host sheet byte-for-byte; shipping it twice is waste */
if (store.css['tenet-companion'] !== store.css['tenet-host']) {
  throw new Error('companion CSS diverged from host — ship it separately');
}

/* ---- runtime ---- */
const js = `/* live figure hydration — see build-figures.mjs */
window.__FIGS = ${JSON.stringify(figs)};
(function () {
  var F = window.__FIGS;
  function photoSrc(id) {
    if (window.__MORSEL_PHOTOS && window.__MORSEL_PHOTOS[id]) return window.__MORSEL_PHOTOS[id];
    return (window.__FIG_PHOTO_BASE || '../images/morsel-photos/') + id + '.webp';
  }
  function fit(box) {
    var inner = box.firstElementChild; if (!inner) return;
    var w = box.clientWidth; if (!w) return;
    inner.style.transform = 'scale(' + (w / +box.getAttribute('data-fw')) + ')';
  }
  function mount(box) {
    if (box.getAttribute('data-ready') === '1') return;
    var f = F[box.getAttribute('data-fig')]; if (!f) return;
    box.setAttribute('data-fw', f.w);
    box.style.setProperty('--fw', f.w); box.style.setProperty('--fh', f.y);
    var inner = document.createElement('div');
    inner.className = 'fig-scale' + (f.c ? ' ' + f.c : '');
    inner.style.width = f.w + 'px'; inner.style.height = f.y + 'px';
    inner.setAttribute('aria-hidden', 'true');   /* the caption on .fig-live is the accessible name */
    inner.inert = true;   /* the fragments contain real <button>s; without inert they are dead tab stops */
    inner.innerHTML = f.h;
    inner.querySelectorAll('[data-mp]').forEach(function (n) { n.src = photoSrc(n.getAttribute('data-mp')); });
    box.appendChild(inner);
    box.setAttribute('data-ready', '1');
    fit(box);
  }
  function boxes() { return [].slice.call(document.querySelectorAll('.fig-live[data-fig]')); }
  function init() {
    var all = boxes();
    all.forEach(function (b) { if (!b.hasAttribute('data-ready')) b.setAttribute('data-ready', '0'); });
    if (!('IntersectionObserver' in window)) { all.forEach(mount); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { mount(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '600px 0px' });
    all.forEach(function (b) { io.observe(b); });
  }
  window.addEventListener('resize', function () { boxes().forEach(fit); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.__figMountAll = function () { boxes().forEach(mount); };
})();
`;

/* ---- typefaces ----
   The prototypes name faces the portfolio itself never loads (Plus Jakarta Sans,
   Hanken Grotesk, Lora...). Without them the figures fall back to the page serif
   and stop looking like the product. Shipped as a separate sheet because the
   artifact build already ships these faces through its own keepUsedFaces pass;
   only the standalone site pages need this file. */
const allFaces = readFileSync(S + '/proto-fonts-inline.css', 'utf8');
const corpus = JSON.stringify(figs) + css;
const faces = (allFaces.match(/@font-face\{[^}]*\}/g) || []).filter(b => {
  const m = /font-family:\s*'([^']+)'/.exec(b);
  return m && corpus.includes(m[1]);
});
const seen = new Set();
const fontCss = faces.filter(b => {
  const key = (/font-family:\s*'([^']+)'/.exec(b) || [, ''])[1]
    + '|' + (/font-weight:\s*(\d+)/.exec(b) || [, '400'])[1]
    + '|' + (/font-style:\s*([a-z]+)/.exec(b) || [, 'normal'])[1];
  if (seen.has(key)) return false;
  seen.add(key); return true;
}).join('\n');

writeFileSync('v2/figures.css', css);
writeFileSync('v2/figures-fonts.css', fontCss);
writeFileSync('v2/figures.js', js);
console.log('figures:', Object.keys(figs).length);
console.log('figures.css      ', Math.round(css.length / 1024) + 'KB');
console.log('figures-fonts.css', Math.round(fontCss.length / 1024) + 'KB', '(' + seen.size + ' faces)');
console.log('figures.js       ', Math.round(js.length / 1024) + 'KB');
