/* Swap the raster figures in the case studies for live prototype figures.
 *
 * Only images whose figure key was actually captured are swapped; anything
 * without a captured counterpart (v1 comparisons, contact sheets, doc previews)
 * keeps its raster and is reported, so nothing is silently dropped.
 *
 * The <img alt> becomes the accessible name of the replacement container. The
 * injected prototype markup is aria-hidden, so assistive tech reads one
 * description instead of the raw interface text.
 */
import { readFileSync, writeFileSync } from 'fs';

const figs = JSON.parse(readFileSync('v2/figures.js', 'utf8')
  .match(/window\.__FIGS = ([\s\S]*?);\n\(function/)[1]);
const HAVE = new Set(Object.keys(figs));

/* images/<proj>/<name>.webp -> "<proj>-<name>", minus the capture-density suffix */
const keyFor = (proj, name) => proj + '-' + name.replace(/-2x$/, '');

/* attribute order varies between the two pages; match on src, keep class/style */
const IMG = /<img\b([^>]*?)src="\.\.\/images\/(tenet|morsel)\/([a-z0-9-]+)\.webp"([^>]*?)\/?>/g;

let swapped = 0; const kept = [];

for (const page of ['v2/tenet.html', 'v2/morsel.html']) {
  let html = readFileSync(page, 'utf8');

  html = html.replace(IMG, (m, pre, proj, name, post) => {
    const key = keyFor(proj, name);
    if (!HAVE.has(key)) { kept.push(page.split('/')[1] + ': ' + proj + '/' + name); return m; }
    const attrs = pre + post;
    const alt = (/alt="([^"]*)"/.exec(attrs) || [, ''])[1];
    const cls = (/class="([^"]*)"/.exec(attrs) || [, ''])[1];
    const style = (/style="([^"]*)"/.exec(attrs) || [, ''])[1];
    swapped++;
    return '<div class="' + ('fig-live ' + cls).trim() + '" data-fig="' + key + '"'
      + ' role="img" aria-label="' + alt + '"' + (style ? ' style="' + style + '"' : '') + '></div>';
  });

  if (!html.includes('figures.css')) {
    html = html.replace('<link rel="stylesheet" href="styles.css" />',
      '<link rel="stylesheet" href="styles.css" />\n  <link rel="stylesheet" href="figures-fonts.css" />\n  <link rel="stylesheet" href="figures.css" />');
    html = html.replace('<script src="script.js"></script>',
      '<script src="figures.js"></script>\n<script src="script.js"></script>');
  }
  writeFileSync(page, html);
}

console.log('swapped to live figures:', swapped);
console.log('captured but unused:', [...HAVE].filter(k => {
  const t = readFileSync('v2/tenet.html', 'utf8') + readFileSync('v2/morsel.html', 'utf8');
  return !t.includes('data-fig="' + k + '"');
}).join(', ') || '(none)');
console.log('still raster (no capture exists):');
kept.forEach(k => console.log('  -', k));
