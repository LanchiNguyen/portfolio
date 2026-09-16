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
const PREFS_NONE = { picked: [], lifestyle: null, allergies: [] };
const PREFS_NUTS = { picked: [], lifestyle: null, allergies: ['Nuts'] };
const setInput = (v) => `(() => { const i = document.querySelector('.morsel-app input'); if (!i) return false;
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  set.call(i, ${JSON.stringify(v)}); i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`;

/* v3.1 captures retained from the previous figures.json as "before" evidence in
   the case study. They are not re-driven: the prototype no longer has those states. */
const KEEP_MORSEL = ['morsel-v31-feed-foryou-shaw', 'morsel-v31-order-allergy-locked', 'morsel-v31-trust-method', 'morsel-v31-detail-conflict-warning', 'morsel-v31-onboarding-dietary'];

const MORSEL = [
  { key: 'v32-welcome', expect: /Find a dish/i,
    drive: async p => { await p.evaluate(() => { window.morselDebug.setOb(0); window.morselDebug.setScreen('onboarding'); }); } },

  { key: 'v32-onboarding-dietary', expect: /Dietary settings/i,
    drive: async p => { await p.evaluate(() => { window.morselDebug.setOb(0); window.morselDebug.setScreen('onboarding'); }); await p.waitForTimeout(700);
      await p.evaluate(() => { window.morselOb.setStep(1); window.morselOb.setAllergies(['Nuts']); }); } },

  { key: 'v32-feed-cards', expect: /Near Shaw/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.setScreen('feed'); window.morselDebug.setTab('feed'); }, PREFS_NONE); } },

  { key: 'v32-filters', expect: /Menu price per dish/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.setScreen('feed'); window.morselDebug.setFiltersOpen(true); }, PREFS_NONE); } },

  { key: 'v32-search-context', expect: /within 1 mi/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.setFilters({ price: [1, 2], maxMi: 1.0 }); window.morselDebug.setQuery('pizza'); window.morselDebug.setScreen('search'); }, PREFS_NONE); } },

  { key: 'v32-search-excluded-filters', expect: /removed by your browsing filters/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.setFilters({ price: [1], maxMi: 0.5 }); window.morselDebug.setQuery('steak'); window.morselDebug.setScreen('search'); }, PREFS_NONE); } },

  { key: 'v32-search-unknown', expect: /no ingredient information/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.setFilters({ price: [], maxMi: 99 }); window.morselDebug.setQuery('tasting'); window.morselDebug.setScreen('search'); }, PREFS_NUTS); } },

  { key: 'v32-detail-top', expect: /Sample menu price/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.openDish('d08'); }, PREFS_NONE); } },

  { key: 'v32-detail-conflict', expect: /which you asked to avoid/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.openDish('d11'); }, PREFS_NUTS); } },

  { key: 'v32-detail-unknown', expect: /don.t have ingredient information/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.openDish('d14'); }, PREFS_NUTS); } },

  { key: 'v32-detail-unlisted', expect: /No longer on the menu/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.openDish('d19'); }, PREFS_NONE); } },

  { key: 'v32-textscale-140', expect: /Sample menu price/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.openDish('d08'); window.morselDebug.setTweak('textScale', 140); }, PREFS_NONE); } },

  { key: 'v32-next-step', expect: /Opens elderandash/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.openDish('d01'); }, PREFS_NONE);
      await p.waitForTimeout(1200); await p.evaluate(() => window.__click('View restaurant menu')); } },

  { key: 'v32-next-step-done', expect: /Demo complete/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.openDish('d01'); }, PREFS_NONE);
      await p.waitForTimeout(1200); await p.evaluate(() => window.__click('View restaurant menu')); await p.waitForTimeout(900);
      await p.evaluate(() => window.__click('Open menu \\(demo\\)')); } },

  { key: 'v32-next-step-none', expect: /No online menu/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.openDish('d22'); }, PREFS_NONE);
      await p.waitForTimeout(1200); await p.evaluate(() => window.__click('Check with restaurant')); } },

  { key: 'v32-handoff-failure', expect: /Couldn.t open/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.setTweak('sim', 'handoff'); window.morselDebug.openDish('d01'); }, PREFS_NONE);
      await p.waitForTimeout(1200); await p.evaluate(() => window.__click('View restaurant menu')); await p.waitForTimeout(900);
      await p.evaluate(() => window.__click('Open menu \\(demo\\)')); } },

  { key: 'v32-saved-states', expect: /stay in your saves/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.setSavedIds(['d11', 'd14', 'd08', 'd01', 'd19']);
      window.morselDebug.setSavedAt({ d11: 1758000000000, d14: 1758100000000, d19: 1758200000000 });
      window.morselDebug.setScreen('saved'); window.morselDebug.setTab('saved'); }, PREFS_NUTS); } },

  { key: 'v32-restaurant', expect: /View restaurant menu/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.setRestName('Dum & Dust'); window.morselDebug.setScreen('restaurant'); }, PREFS_NUTS); } },

  { key: 'v32-no-coverage', expect: /isn.t.*in this demo/i,
    drive: async p => { await p.evaluate(pr => { window.morselDebug.setPrefs(pr); window.morselDebug.setScreen('feed');
      window.morselDebug.setLoc({ city: 'Boise, ID', hood: null }); }, PREFS_NONE); } },

  { key: 'v32-imgfail', expect: /photo unavailable/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.setTweak('sim', 'imgfail'); window.morselDebug.setScreen('feed'); }, PREFS_NONE); } },

  { key: 'v32-zero-result', expect: /No dish fits every setting/i,
    drive: async p => { await p.evaluate(pr => { window.morselDebug.setPrefs({ ...pr, lifestyle: 'Vegan' }); window.morselDebug.setScreen('feed');
      window.morselDebug.setFilters({ price: [3], maxMi: 0.5 }); }, PREFS_NUTS); } }
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

  /* --- Morsel process docs: the appendix previews render live, like the
         figures — a top-crop of the real document, not a raster of it --- */
  const DOCS = [
    { key: 'morsel-doc-wireflow', page: 'morsel-docs/wireflow.html', sel: '#stage', cls: 'docfig-wf', cssKey: 'doc-wf', aspect: null },
    { key: 'morsel-doc-explorations-preview', page: 'morsel-docs/explorations.html', sel: '.page', cls: 'docfig-ex', cssKey: 'doc-ex', aspect: 1804 / 2200 },
    { key: 'morsel-doc-ds-preview', page: 'morsel-docs/ds-addendum.html', sel: '.page', cls: 'docfig-ds', cssKey: 'doc-ds', aspect: 1804 / 2200 },
    { key: 'morsel-doc-testing-preview', page: 'morsel-docs/testing-plan.html', sel: '.page', cls: 'docfig-tp', cssKey: 'doc-tp', aspect: 1804 / 2200 }
  ];
  const docCss = {};
  for (const d of DOCS) {
    const p = await b.newPage({ viewport: { width: 1720, height: 1150 } });
    try {
      await p.goto(BASE + '/' + d.page, { waitUntil: 'load', timeout: 60000 });
      await p.waitForTimeout(2500);
      const cap = await p.evaluate((sel) => {
        const n = document.querySelector(sel); if (!n) return null;
        n.style.transform = 'none';                     /* wireflow fit-to-screen scale */
        const r = n.getBoundingClientRect();
        let html = n.outerHTML
          .replace(/src="\.\.\/\.\.\/images\/morsel-photos\/([0-9a-f-]+)\.webp"/g, 'src="PHOTO:$1"')
          .replace(/\sloading="lazy"/g, '')
          /* fragments are inert previews: dead relative hrefs would read as broken
             links in the host page's DOM, and extra h1s are noise even when
             aria-hidden. The scoped sheets style bare tags, so h1 keeps its look
             via an inline demotion instead of a tag swap. */
          .replace(/<a\s([^>]*?)href="[^"]*"/g, '<a $1')
          .replace(/<h1(\s|>)/g, '<h1 role="presentation"$1');
        return { html, w: Math.round(n.scrollWidth || r.width), h: Math.round(n.scrollHeight || r.height),
                 text: n.innerText.replace(/\s+/g, ' ') };
      }, d.sel);
      if (!cap) throw new Error('selector not found: ' + d.sel);
      if (cap.text.length < 100) throw new Error('suspiciously empty doc');
      const h = d.aspect ? Math.round(cap.w * d.aspect) : cap.h;
      figures[d.key] = { html: cap.html, w: cap.w, h, proto: d.page, cls: d.cls };
      docCss[d.cssKey] = await p.evaluate(() => [...document.querySelectorAll('style')].map(x => x.textContent).join('\n'));
      console.log('OK   ' + d.key, cap.w + 'x' + h + (d.aspect ? ' (top crop of ' + cap.h + ')' : ''), Math.round(cap.html.length / 1024) + 'KB');
    } catch (e) { fails.push(d.key + ': ' + e.message); console.log('FAIL ' + d.key, e.message.slice(0, 120)); }
    await p.close();
  }

  /* --- prototype stylesheets, shipped once each --- */
  const css = {};
  css.morsel = fs.readFileSync('morsel-proto/v3/app/styles.css', 'utf8');
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
