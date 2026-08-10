/* Give every editable element a stable id in the SOURCE html.
 *
 * The page editor needs to map "this paragraph on screen" back to "this span of
 * bytes in the file". Matching on text does not survive entity differences
 * (&mdash; in source is — in the DOM), and matching on position does not
 * survive the elements that JavaScript adds at runtime. A stamped attribute
 * survives both, so the editor can rewrite a file surgically instead of
 * re-serialising it and reformatting everything it touches.
 *
 * data-ed stays in the source and in the preview build; build-site.sh strips it
 * from the production build.
 *
 * Idempotent: run it as often as you like. Ids are positional, so they change
 * when content is added above — which is fine, because the editor reads them
 * fresh on every page load.
 *
 * Usage: node stamp-editable.mjs [--check]
 *        --check exits 1 if any file would change (for CI or a pre-commit hook)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const SKIP_FILES = new Set(['capture-harness.html']);

// Text-bearing elements, by tag.
const TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'li', 'figcaption', 'blockquote']);
// ...and by class, for the spans this site uses as typographic slots.
const CLASSES = new Set(['v', 'k', 'd', 't', 'm', 'l', 'r', 'no', 'metric', 'lead',
  'eyebrow', 'always', 'pill-metric', 'proj-lede']);
// Containers whose children can be reordered, and the children themselves.
const STRUCTURAL = new Set(['flagships', 'tins', 'flag', 'tin-wrap']);
// Never descend into these; their contents are code or runtime-generated.
const OPAQUE = new Set(['script', 'style', 'svg', 'noscript']);
const VOID = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'area', 'col']);

/* Walk the raw text, quote-aware, and yield every tag. No DOM, no reserialise. */
function* tags(src) {
  let i = 0;
  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt === -1) return;
    if (src.startsWith('<!--', lt)) { i = src.indexOf('-->', lt) + 3 || src.length; continue; }
    if (src.startsWith('<!', lt)) { i = src.indexOf('>', lt) + 1 || src.length; continue; }
    let j = lt + 1, q = null;
    while (j < src.length) {
      const c = src[j];
      if (q) { if (c === q) q = null; }
      else if (c === '"' || c === "'") q = c;
      else if (c === '>') break;
      j++;
    }
    const raw = src.slice(lt, j + 1);
    const m = /^<(\/?)([a-zA-Z][a-zA-Z0-9-]*)/.exec(raw);
    if (m) yield { start: lt, end: j + 1, raw, close: m[1] === '/', name: m[2].toLowerCase() };
    i = j + 1;
  }
}

function classesOf(raw) {
  const m = /\sclass\s*=\s*"([^"]*)"/.exec(raw) || /\sclass\s*=\s*'([^']*)'/.exec(raw);
  return m ? m[1].trim().split(/\s+/) : [];
}

function isEditable(t) {
  if (t.close) return false;
  if (TAGS.has(t.name)) return true;
  if (t.name === 'img') return true;                 // alt text and photo swap
  const cls = classesOf(t.raw);
  if (t.name === 'span' && cls.some(c => CLASSES.has(c))) return true;
  if (cls.some(c => STRUCTURAL.has(c))) return true; // reorder containers/items
  return false;
}

export function stamp(src) {
  const out = [];
  let last = 0, n = 0, opaque = 0;
  for (const t of tags(src)) {
    if (OPAQUE.has(t.name)) { opaque += t.close ? -1 : 1; if (opaque < 0) opaque = 0; continue; }
    if (opaque > 0 || !isEditable(t)) continue;
    // rewrite this one tag: drop any previous stamp, add the current one
    let raw = t.raw.replace(/\s+data-ed="[^"]*"/g, '');
    const selfClose = /\/>$/.test(raw);
    const head = raw.slice(0, raw.length - (selfClose ? 2 : 1)).replace(/\s+$/, '');
    raw = head + ` data-ed="${n}"` + (selfClose ? ' />' : '>');
    out.push(src.slice(last, t.start), raw);
    last = t.end;
    n++;
  }
  out.push(src.slice(last));
  return { text: out.join(''), count: n };
}

const check = process.argv.includes('--check');
let changed = 0, total = 0;
for (const f of globSync('*.html').sort()) {
  if (SKIP_FILES.has(f)) continue;
  const src = readFileSync(f, 'utf8');
  const { text, count } = stamp(src);
  total += count;
  if (text !== src) {
    changed++;
    if (!check) writeFileSync(f, text);
    console.log(`${check ? 'would stamp' : 'stamped'} ${f} (${count} elements)`);
  } else {
    console.log(`unchanged  ${f} (${count} elements)`);
  }
}
console.log(`${total} editable elements across the site`);
if (check && changed) { console.error(`${changed} file(s) need stamping — run: node stamp-editable.mjs`); process.exit(1); }
