/* Capture the canonical Tenet and Morsel prototypes as live DOM fragments.
 *
 * Each figure is produced by driving the real prototype to the state its caption
 * describes, then serialising the rendered subtree. Nothing is redrawn: the markup
 * is the prototype's own output. Photos are carried as PHOTO:<id> sentinels and
 * rehydrated in the page from the shared canonical photo map.
 *
 * Every recipe carries an `expect` assertion; a figure that does not reach its
 * state fails the build instead of silently shipping the wrong screen.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = 'http://127.0.0.1:8897';

/* ---------- shared helpers, injected into the page ---------- */
const HELPERS = `
window.__hit = (rx, scope) => [...(scope || document).querySelectorAll('button,[role="button"],[role="tab"],a,input,label,summary')]
  .filter(n => n.offsetParent !== null)
  .find(n => new RegExp(rx, 'i').test(n.innerText || n.getAttribute('aria-label') || n.value || ''));
window.__click = (rx, scope) => { const n = window.__hit(rx, scope); if (n) { n.click(); return (n.innerText || '').trim().slice(0, 40) || true; } return null; };
`;

/* ---------- Morsel ---------- */
const setInput = (v) => `(() => { const i = document.querySelector('.morsel-app input'); if (!i) return false;
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  set.call(i, ${JSON.stringify(v)}); i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`;

/* One earlier-exploration capture is retained from the previous figures.json: the
   nearby-dish feed the case study shows beside the restaurant menu. It is not
   re-driven: the prototype no longer has that screen. */
const KEEP_MORSEL = ['morsel-v32-feed-cards'];

const atMenu = (extra) => `(() => { window.morselDebug.setShortlist(${JSON.stringify(extra && extra.shortlist || [])}); window.morselDebug.setView(${JSON.stringify(extra && extra.view || 'menu')}); window.morselDebug.pick('elder-ash'); })()`;
const atDish = (id, extra) => `(() => { window.morselDebug.setRestId('elder-ash'); window.morselDebug.setShortlist(${JSON.stringify(extra && extra.shortlist || [])}); window.morselDebug.openDish(${JSON.stringify(id)}); })()`;

const MORSEL = [
  { key: 'vm-entry', expect: /Which restaurant are you at/i,
    drive: async p => { await p.evaluate(() => window.morselDebug.setScreen('entry')); } },

  { key: 'vm-entry-filter', expect: /8 of 12 dishes photographed/i,
    drive: async p => { await p.evaluate(() => window.morselDebug.setScreen('entry')); await p.waitForTimeout(500); await p.evaluate(setInput('sh')); } },

  { key: 'vm-nomenu', expect: /No menu photos for Sumi yet/i,
    drive: async p => { await p.evaluate(() => window.morselDebug.pick('sumi')); } },

  { key: 'vm-menu', expect: /8 of 12 dishes have photos/i,
    drive: async p => { await p.evaluate(atMenu()); } },

  { key: 'vm-menu-shortlist', expect: /2 of 3 to compare/i,
    drive: async p => { await p.evaluate(atMenu({ shortlist: ['m06', 'm03'] })); } },

  { key: 'vm-menu-mains', expect: /Half Roast Chicken/i,
    drive: async p => { await p.evaluate(atMenu({ shortlist: ['m06'] })); await p.waitForTimeout(700);
      await p.evaluate(() => { const s = document.querySelector('.morsel-app .m-scroll'); const el = s.querySelector('[data-section="mains"]'); s.scrollTop = el.offsetTop - 8; }); } },

  { key: 'vm-photos-view', expect: /only in the menu view/i,
    drive: async p => { await p.evaluate(atMenu({ view: 'photos' })); } },

  { key: 'vm-dish-photos', expect: /1 of 3/i,
    drive: async p => { await p.evaluate(atDish('m06')); } },

  { key: 'vm-dish-diner', expect: /2 of 3/i,
    drive: async p => { await p.evaluate(atDish('m06')); await p.waitForTimeout(900); await p.evaluate(() => window.__click('Next photo')); } },

  { key: 'vm-dish-nophoto', expect: /No photo yet/i,
    drive: async p => { await p.evaluate(atDish('m05')); } },

  { key: 'vm-dish-facts', expect: /The menu lists gluten, shellfish/i,
    drive: async p => { await p.evaluate(atDish('m09', { shortlist: ['m06', 'm07'] })); await p.waitForTimeout(900);
      await p.evaluate(() => { document.querySelector('.morsel-app .m-scroll').scrollTop = 330; }); } },

  { key: 'vm-compare-3', expect: /3 of 3 dishes/i,
    drive: async p => { await p.evaluate(() => { window.morselDebug.setRestId('elder-ash'); window.morselDebug.setShortlist(['m06', 'm07', 'm05']); window.morselDebug.setScreen('compare'); }); } },

  { key: 'vm-compare-2', expect: /Add another from the menu/i,
    drive: async p => { await p.evaluate(() => { window.morselDebug.setRestId('elder-ash'); window.morselDebug.setShortlist(['m03', 'm04']); window.morselDebug.setScreen('compare'); }); } },

  { key: 'vm-menu-140', expect: /8 of 12 dishes have photos/i,
    drive: async p => { await p.evaluate(atMenu()); await p.evaluate(() => window.morselDebug.setTweak('textScale', 140)); } }
];

/* ---------- Tenet ---------- */
const TENET = [
  { key: 'host-ticket', page: 'host.html?bare', expect: /Swipe to buy/i, drive: async () => {} },

  { key: 'host-intervention', page: 'host.html?bare', expect: /stepped in/i,
    drive: async p => { await p.evaluate(() => { const r = window.__hit('swipe to buy'); if (r) { r.focus(); r.click(); } });
      await p.keyboard.press('Enter'); } },

  { key: 'host2-intervention', page: 'host-new.html?bare', expect: /stepped in/i,
    drive: async p => { await p.evaluate(() => { const r = window.__hit('swipe to buy'); if (r) { r.focus(); r.click(); } });
      await p.keyboard.press('Enter'); } },

  { key: 'host-cooldown', page: 'host.html?bare', expect: /cooldown/i,
    drive: async p => { await p.evaluate(() => { const r = window.__hit('swipe to buy'); if (r) { r.focus(); r.click(); } });
      await p.keyboard.press('Enter'); await p.waitForTimeout(2000);
      const hold = await p.evaluateHandle(() => window.__hit('Hold to start'));
      const el = hold.asElement();
      if (el) { const box = await el.boundingBox(); if (box) { await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.mouse.down(); await p.waitForTimeout(2600); await p.mouse.up(); } } } },

  { key: 'companion-home', page: 'companion.html?bare', expect: /What your rules did/i, drive: async () => {} },

  { key: 'companion-rules', page: 'companion.html?bare', expect: /rule/i,
    drive: async p => { await p.evaluate(() => window.__click('^Rules$|Rules')); } },

  { key: 'companion-record', page: 'companion.html?bare', expect: /record|overrode|waited/i,
    drive: async p => { await p.evaluate(() => window.__click('^Record$|Record')); } },

  { key: 'meridian-stepped', page: 'desktop.html?bare', expect: /cooldown|stepped in/i, flat: true,
    drive: async p => { await p.evaluate(() => { const r = window.__hit('SELL SHORT'); if (r) { r.focus(); r.click(); } }); } }
];

/* ---------- capture ---------- */
const grabMorsel = p => p.evaluate(() => {
  let n = document.querySelector('.morsel-app');
  while (n && getComputedStyle(n).borderRadius !== '48px') n = n.parentElement;
  if (!n) return null;
  n.querySelectorAll('.m-scroll').forEach(s => { if (s.scrollTop > 0) s.setAttribute('data-scrolltop', Math.round(s.scrollTop)); else s.removeAttribute('data-scrolltop'); });
  const r = n.getBoundingClientRect();
  return { html: n.outerHTML, w: Math.round(r.width), h: Math.round(r.height), text: n.innerText.replace(/\s+/g, ' ') };
});

const grabTenet = (p, flat) => p.evaluate((flat) => {
  /* the prototype surface: the largest rounded panel the runtime mounted */
  const cands = [...document.querySelectorAll('div')].filter(n => {
    const r = n.getBoundingClientRect(), cs = getComputedStyle(n);
    return r.width > 260 && r.height > 380 && parseFloat(cs.borderRadius) >= 10 && cs.backgroundColor !== 'rgba(0, 0, 0, 0)';
  });
  if (!cands.length) return null;
  const n = flat ? cands[0]
    : cands.sort((a, b) => (b.getBoundingClientRect().width * b.getBoundingClientRect().height) - (a.getBoundingClientRect().width * a.getBoundingClientRect().height))[0];
  const r = n.getBoundingClientRect();
  return { html: n.outerHTML, w: Math.round(r.width), h: Math.round(r.height), text: n.innerText.replace(/\s+/g, ' ') };
}, flat);

(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--proxy-bypass-list=<-loopback>'] });
  const prev = fs.existsSync('figures.json') ? JSON.parse(fs.readFileSync('figures.json', 'utf8')) : { figures: {}, css: {} };
  const ONLY = process.env.ONLY || '';           /* ONLY=morsel skips the Tenet drive and keeps its previous captures */
  const figures = {}; const fails = [];
  for (const k of KEEP_MORSEL) { if (prev.figures[k]) figures[k] = prev.figures[k]; else fails.push(k + ': missing from previous figures.json'); }
  if (ONLY === 'morsel') for (const [k, v] of Object.entries(prev.figures)) { if (/^tenet-/.test(k)) figures[k] = v; }

  /* --- Morsel: one fresh page per figure so no state leaks between captures --- */
  for (const f of MORSEL) {
    const p = await b.newPage({ viewport: { width: 520, height: 1000 } });
    try {
      await p.goto(BASE + '/capture-harness.html', { waitUntil: 'load', timeout: 60000 });
      await p.waitForTimeout(2600);
      await p.evaluate(HELPERS);
      await f.drive(p);
      await p.waitForTimeout(2200);
      const cap = await grabMorsel(p);
      if (!cap) throw new Error('no bezel found');
      if (!f.expect.test(cap.text)) throw new Error('assertion failed: ' + f.expect + ' not in "' + cap.text.slice(0, 160) + '"');
      figures['morsel-' + f.key] = { html: cap.html, w: cap.w, h: cap.h, proto: 'morsel' };
      console.log('OK   morsel-' + f.key, cap.w + 'x' + cap.h, Math.round(cap.html.length / 1024) + 'KB');
    } catch (e) { fails.push('morsel-' + f.key + ': ' + e.message); console.log('FAIL morsel-' + f.key, e.message.slice(0, 120)); }
    await p.close();
  }

  /* --- Tenet --- */
  for (const f of (ONLY === 'morsel' ? [] : TENET)) {
    const p = await b.newPage({ viewport: { width: 1360, height: 1120 } });
    try {
      await p.goto(BASE + '/tenet-proto/' + f.page, { waitUntil: 'load', timeout: 60000 });
      await p.waitForTimeout(3200);
      await p.evaluate(HELPERS);
      await f.drive(p);
      await p.waitForTimeout(2400);
      const cap = await grabTenet(p, !!f.flat);
      if (!cap) throw new Error('no surface found');
      if (!f.expect.test(cap.text)) throw new Error('assertion failed: ' + f.expect + ' not in "' + cap.text.slice(0, 160) + '"');
      figures['tenet-' + f.key] = { html: cap.html, w: cap.w, h: cap.h, proto: 'tenet-' + f.page.split('.')[0] };
      console.log('OK   tenet-' + f.key, cap.w + 'x' + cap.h, Math.round(cap.html.length / 1024) + 'KB');
    } catch (e) { fails.push('tenet-' + f.key + ': ' + e.message); console.log('FAIL tenet-' + f.key, e.message.slice(0, 120)); }
    await p.close();
  }

  const docCss = {};

  /* --- prototype stylesheets, shipped once each --- */
  const css = {};
  css.morsel = fs.readFileSync('morsel-proto/v4/app/styles.css', 'utf8');
  for (const page of (ONLY === 'morsel' ? [] : ['host', 'companion', 'desktop'])) {
    const p = await b.newPage({ viewport: { width: 1360, height: 1120 } });
    await p.goto(BASE + '/tenet-proto/' + page + '.html?bare', { waitUntil: 'load', timeout: 60000 });
    await p.waitForTimeout(2500);
    css['tenet-' + page] = await p.evaluate(() => [...document.querySelectorAll('style')].map(n => n.textContent).join('\n'));
    await p.close();
  }

  if (ONLY === 'morsel') for (const [k, v] of Object.entries(prev.css)) { if (/^tenet-/.test(k)) css[k] = v; }
  Object.assign(css, docCss);
  fs.writeFileSync('figures.json', JSON.stringify({ figures, css }, null, 0));
  const n = Object.keys(figures).length;
  console.log('\ncaptured ' + n + ' figures, ' + Math.round(JSON.stringify(figures).length / 1024) + 'KB total DOM');
  console.log('css:', Object.entries(css).map(([k, v]) => k + '=' + Math.round(v.length / 1024) + 'KB').join(' '));
  if (fails.length) { console.log('\nFAILURES (' + fails.length + '):'); fails.forEach(f => console.log(' - ' + f)); }
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
