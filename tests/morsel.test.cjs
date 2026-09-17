// Morsel visual-menu prototype: data contract, menu order, shortlist rules and
// state loading, run in a Node vm sandbox without a browser.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'morsel-proto/v4/app');
const plain = (v) => JSON.parse(JSON.stringify(v));

function bootData() {
  const window = {};
  const ctx = vm.createContext({ window });
  vm.runInContext(fs.readFileSync(path.join(APP, 'data.js'), 'utf8'), ctx, { filename: 'data.js' });
  return window.MorselData;
}

// Boot app.jsx far enough to reach loadMorselState: React is an inert proxy,
// the DOM and storage are stubs, and the JSX is compiled with the vendored Babel.
function bootApp(storageValue) {
  const Babel = require(path.join(ROOT, 'morsel-proto/vendor/babel.min.js'));
  const src = fs.readFileSync(path.join(APP, 'app.jsx'), 'utf8');
  const code = Babel.transform(src, { presets: ['react'] }).code;
  const inert = new Proxy(function () {}, { get: () => inert, apply: () => inert });
  const window = {};
  const ctx = vm.createContext({
    window, React: inert, ReactDOM: inert, useTweaks: inert, IOSDevice: inert, TweaksPanel: inert, TweakSection: inert, TweakSlider: inert, TweakButton: inert,
    EntryScreen: inert, NoMenuScreen: inert, MenuScreen: inert, DishScreen: inert, CompareScreen: inert,
    document: { addEventListener() {}, getElementById() { return {}; } },
    localStorage: { getItem: () => storageValue, setItem() {}, removeItem() {} },
    requestAnimationFrame() {}, cancelAnimationFrame() {}
  });
  vm.runInContext(fs.readFileSync(path.join(APP, 'data.js'), 'utf8'), ctx, { filename: 'data.js' });
  vm.runInContext(code + '\nwindow.__load = loadMorselState;', ctx, { filename: 'app.jsx' });
  return plain(window.__load());
}

test('one restaurant is modeled in full: four sections, twelve dishes, 8 of 12 photographed', () => {
  const D = bootData();
  const visual = D.restaurants.filter((r) => r.visual);
  assert.equal(visual.length, 1);
  assert.equal(visual[0].id, 'elder-ash');
  const menu = D.menu('elder-ash');
  assert.deepEqual(plain(menu.map((s) => s.name)), ['Starters', 'Wood-fired pizza', 'Mains', 'Desserts']);
  assert.equal(menu.reduce((n, s) => n + s.dishes.length, 0), 12);
  assert.deepEqual(plain(D.coverage('elder-ash')), { total: 12, photographed: 8 });
  for (const r of D.restaurants.filter((r) => !r.visual)) assert.equal(D.menu(r.id).length, 0, r.id + ' has no menu');
});

test('menu order is the restaurant\'s order; dishes without photos keep their place', () => {
  const D = bootData();
  const menu = D.menu('elder-ash');
  const ids = menu.flatMap((s) => s.dishes.map((d) => d.id));
  assert.deepEqual(plain(ids), plain(D.dishes.map((d) => d.id)), 'sections preserve catalog order');
  const nophoto = menu.flatMap((s) => s.dishes.map((d, i) => ({ id: d.id, i, n: d.photos.length, section: s.id }))).filter((x) => x.n === 0);
  assert.deepEqual(plain(nophoto.map((x) => x.id)), ['m02', 'm05', 'm10', 'm12']);
  assert.deepEqual(plain(nophoto.map((x) => x.i)), [1, 2, 4, 1], 'unphotographed dishes sit inside sections, not at the end');
});

test('every dish carries a description and a numeric price; every photo has a real file and a known source', () => {
  const D = bootData();
  const files = new Set(fs.readdirSync(path.join(ROOT, 'images/morsel-photos')));
  for (const d of D.dishes) {
    assert.ok(d.name && d.desc.length > 10, d.id + ' description');
    assert.equal(typeof d.price, 'number', d.id + ' price');
    assert.equal(D.price(d), '$' + d.price);
    assert.ok(Array.isArray(d.photos), d.id + ' photos array');
    for (const p of d.photos) {
      assert.ok(['restaurant', 'diner'].includes(p.source), d.id + ' photo source');
      assert.ok(files.has(p.img + '.webp'), d.id + ' photo file ' + p.img);
    }
  }
});

test('source labels and photo notes: one label per source, counts when there are several', () => {
  const D = bootData();
  assert.equal(D.sourceLabel('restaurant'), 'Restaurant photo');
  assert.equal(D.sourceLabel('diner'), 'Diner photo');
  const burger = D.dish('m06');
  assert.equal(burger.photos.length, 3);
  assert.deepEqual(plain(burger.photos.map((p) => p.source)), ['restaurant', 'diner', 'diner']);
  assert.equal(D.photoNote(burger), '3 photos · 2 from diners');
  assert.equal(D.photoNote(D.dish('m08')), 'Diner photo');
  assert.equal(D.photoNote(D.dish('m01')), 'Restaurant photo');
  assert.equal(D.photoNote(D.dish('m05')), 'No photo yet');
});

test('ingredient lines keep missing information visibly missing', () => {
  const D = bootData();
  assert.equal(D.ingredientsLine(D.dish('m10')), "Ingredients aren't listed on the menu.");
  assert.equal(D.ingredientsLine(D.dish('m07')), 'The menu lists none of nuts, gluten, dairy or shellfish.');
  assert.equal(D.ingredientsLine(D.dish('m09')), 'The menu lists gluten, shellfish.');
});

test('shortlist holds at most three dishes and never a dish that does not exist', () => {
  const D = bootData();
  assert.equal(D.compareMax, 3);
  let r = D.shortlistAdd([], 'm06'); assert.deepEqual(plain(r), { list: ['m06'], ok: true, reason: 'added' });
  r = D.shortlistAdd(r.list, 'm06'); assert.equal(r.reason, 'already'); assert.deepEqual(plain(r.list), ['m06']);
  r = D.shortlistAdd(r.list, 'm07'); r = D.shortlistAdd(r.list, 'm05');
  assert.deepEqual(plain(r.list), ['m06', 'm07', 'm05']);
  const full = D.shortlistAdd(r.list, 'm01');
  assert.equal(full.ok, false); assert.equal(full.reason, 'full'); assert.deepEqual(plain(full.list), ['m06', 'm07', 'm05']);
  const bogus = D.shortlistAdd([], 'nope'); assert.equal(bogus.ok, false); assert.equal(bogus.reason, 'unknown');
  const t = D.shortlistToggle(r.list, 'm07'); assert.equal(t.reason, 'removed'); assert.deepEqual(plain(t.list), ['m06', 'm05']);
  assert.deepEqual(plain(D.shortlistRemove(['m06'], 'm06')), []);
});

test('saved state loads defensively: corrupt or stale storage starts at the restaurant picker', () => {
  assert.equal(bootApp('{not json').screen, 'entry');
  assert.equal(bootApp(null).screen, 'entry');
  assert.equal(bootApp('42').screen, 'entry');
  const s = bootApp(JSON.stringify({ screen: 'dish', restId: 'elder-ash', dishId: 'gone', shortlist: ['m06', 'm06', 'zz', 'm07', 'm05', 'm01'], view: 'weird' }));
  assert.equal(s.screen, 'menu', 'a dish that no longer exists falls back to the menu');
  assert.deepEqual(s.shortlist, ['m06', 'm07', 'm05'], 'duplicates and unknown ids pruned, capped at three');
  assert.equal(s.view, 'menu');
  assert.equal(bootApp(JSON.stringify({ screen: 'menu' })).screen, 'entry', 'menu without a restaurant returns to the picker');
  assert.equal(bootApp(JSON.stringify({ screen: 'compare', restId: 'elder-ash', shortlist: ['m03'] })).screen, 'compare');
  assert.equal(bootApp(JSON.stringify({ screen: 'nowhere', restId: 'elder-ash' })).screen, 'entry');
});
