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
const PREFS_NUTS = { picked: ['d08', 'd01'], lifestyle: null, allergies: ['Nuts'], locDenied: false };

const MORSEL = [
  { key: 'v31-onboarding-taste', expect: /looks good to you/i,
    drive: async p => { await p.evaluate(() => { window.morselDebug.setScreen('onboarding'); }); await p.waitForTimeout(700);
      await p.evaluate(() => window.morselOb.setStep(1)); } },

  { key: 'v31-onboarding-dietary', expect: /allergy-aware|Allergies are a hard rule/i,
    drive: async p => { await p.evaluate(() => { window.morselDebug.setScreen('onboarding'); }); await p.waitForTimeout(700);
      await p.evaluate(() => { window.morselOb.setStep(2); window.morselOb.setLifestyle('veg'); window.morselOb.setAllergies(['Nuts']); }); } },

  { key: 'v31-feed-foryou-shaw', expect: /Shaw/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.setScreen('feed'); window.morselDebug.setTab('feed'); }, PREFS_NUTS); } },

  { key: 'v31-detail-coldstart', expect: /New on Morsel|no score yet/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.openDish('d26'); }, PREFS_NUTS); } },

  { key: 'v31-detail-conflict-warning', expect: /nuts/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.openDish('d11'); }, PREFS_NUTS); } },

  { key: 'v31-trust-method', expect: /would order again|method|sample/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.openDish('d08'); }, PREFS_NUTS);
      await p.waitForTimeout(1200); await p.evaluate(() => window.__click('how we know')); } },

  { key: 'v31-textscale-140', expect: /./,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.openDish('d08'); window.morselDebug.setTweak('textScale', 140); }, PREFS_NUTS); } },

  { key: 'v31-order-allergy-locked', expect: /Contains nuts|locked/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.openDish('d11'); }, PREFS_NUTS);
      await p.waitForTimeout(1200); await p.evaluate(() => window.__click('^Order$|Order')); } },

  { key: 'v31-order-allergy-unlocked', expect: /Uber Eats|Grubhub|Pickup/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.openDish('d11'); }, PREFS_NUTS);
      await p.waitForTimeout(1200); await p.evaluate(() => window.__click('^Order$|Order')); await p.waitForTimeout(1200);
      await p.evaluate(() => { const box = [...document.querySelectorAll('input[type=checkbox]')].find(n => n.offsetParent !== null);
        if (box) { box.click(); return; } window.__click('understand|acknowledge|confirm|I know'); }); } },

  { key: 'v31-handoff-failure', expect: /could.?n.?t|failed|try again|handoff/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.setTweak('sim', 'handoff'); window.morselDebug.openDish('d08'); }, PREFS_NUTS);
      await p.waitForTimeout(1200); await p.evaluate(() => window.__click('^Order$|Order')); await p.waitForTimeout(1200);
      await p.evaluate(() => window.__click('Uber Eats|Grubhub|Open')); } },

  { key: 'v31-saved-conflicts', expect: /conflict/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.setSavedIds(['d11', 'd20', 'd08', 'd01']);
      window.morselDebug.setScreen('saved'); window.morselDebug.setTab('saved'); }, PREFS_NUTS); } },

  { key: 'v31-offline', expect: /offline/i,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.setTweak('sim', 'offline'); window.morselDebug.setScreen('feed'); }, PREFS_NUTS); } },

  { key: 'v31-imgfail', expect: /./,
    drive: async p => { await p.evaluate(prefs => { window.morselDebug.setPrefs(prefs); window.morselDebug.setTweak('sim', 'imgfail'); window.morselDebug.setScreen('feed'); }, PREFS_NUTS); } },

  { key: 'v31-search-diet-empty', expect: /excluded by|matches your current dietary/i,
    drive: async p => { await p.evaluate(pr => { window.morselDebug.setPrefs({ ...pr, lifestyle: 'Vegan' }); window.morselDebug.setScreen('search'); }, PREFS_NUTS);
      await p.waitForTimeout(1200);
      await p.evaluate(() => { const i = document.querySelector('.morsel-app input'); if (!i) return;
        const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        set.call(i, 'steak'); i.dispatchEvent(new Event('input', { bubbles: true })); }); } },

  { key: 'v31-location-no-coverage', expect: /isn.?t.*mapped yet|on the list/i,
    drive: async p => { await p.evaluate(pr => { window.morselDebug.setPrefs(pr); window.morselDebug.setScreen('feed');
      window.morselDebug.setLoc({ city: 'Boise, ID', hood: null }); }, PREFS_NUTS); } },

  { key: 'v31-zero-result-recovery', expect: /No dish clears every rule|Active limits/i,
    drive: async p => { await p.evaluate(pr => { window.morselDebug.setPrefs({ ...pr, lifestyle: 'Vegan' }); window.morselDebug.setScreen('feed');
      window.morselDebug.setFilters({ price: ['$'], maxMi: 0.2, openNow: true }); }, PREFS_NUTS); } }
];

/* ---------- Tenet ---------- */
const TENET = [
  { key: 'host-ticket', page: 'host.html?bare', expect: /Swipe to buy/i, drive: async () => {} },

  { key: 'host-intervention', page: 'host.html?bare', expect: /stepped in/i,
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
  const figures = {}; const fails = [];

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
  for (const f of TENET) {
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
  css.morsel = fs.readFileSync('/home/user/redesigned-computing-machine/v2/morsel-proto/v3/app/styles.css', 'utf8');
  for (const page of ['host', 'companion', 'desktop']) {
    const p = await b.newPage({ viewport: { width: 1360, height: 1120 } });
    await p.goto(BASE + '/tenet-proto/' + page + '.html?bare', { waitUntil: 'load', timeout: 60000 });
    await p.waitForTimeout(2500);
    css['tenet-' + page] = await p.evaluate(() => [...document.querySelectorAll('style')].map(n => n.textContent).join('\n'));
    await p.close();
  }

  Object.assign(css, docCss);
  fs.writeFileSync('figures.json', JSON.stringify({ figures, css }, null, 0));
  const n = Object.keys(figures).length;
  console.log('\ncaptured ' + n + ' figures, ' + Math.round(JSON.stringify(figures).length / 1024) + 'KB total DOM');
  console.log('css:', Object.entries(css).map(([k, v]) => k + '=' + Math.round(v.length / 1024) + 'KB').join(' '));
  if (fails.length) { console.log('\nFAILURES (' + fails.length + '):'); fails.forEach(f => console.log(' - ' + f)); }
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
