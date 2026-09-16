/* Behavioral checks for the Morsel v3.2 prototype that do not need a browser.
 *
 * The JSX is compiled with the same vendored Babel the production build uses and
 * evaluated in a sandbox with a stub DOM, so the checks run against the real
 * data model, the real classifier, the real filter semantics and the real
 * saved-state migration — not against a copy of the prose.
 *
 *   node --test tests/morsel.test.cjs
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const P = path.join(ROOT, 'morsel-proto');
const Babel = require(path.join(P, 'vendor', 'babel.min.js'));

const html = fs.readFileSync(path.join(P, 'index.html'), 'utf8');
const order = [...html.matchAll(/<script type="text\/babel" src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const source = ['v3/app/data.js', ...order].map((f) => fs.readFileSync(path.join(P, f), 'utf8')).join('\n;\n');
const code = Babel.transform(source, { filename: 'morsel-app.jsx', sourceType: 'script', presets: ['react'] }).code;

// Boot the whole prototype bundle in a sandbox. Nothing renders: React is a proxy
// that returns inert functions, so only module-level definitions and the state
// loader run. `storage` seeds localStorage so migrations can be exercised.
function boot(storage) {
  const store = new Map(Object.entries(storage || {}).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]));
  const noop = () => {};
  const inert = new Proxy(function () {}, { get: () => inert, apply: () => null });
  const ctx = {
    console, setTimeout, clearTimeout, Date, Math, JSON, Object, Array, Set, Map, Number, String, RegExp, Error, Proxy, Promise,
    localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
    document: { addEventListener: noop, removeEventListener: noop, getElementById: () => ({}), querySelector: () => null, querySelectorAll: () => [] },
    React: inert, ReactDOM: { createRoot: () => ({ render: noop }) },
    matchMedia: () => ({ matches: false }), requestAnimationFrame: noop, cancelAnimationFrame: noop,
    addEventListener: noop, removeEventListener: noop, postMessage: noop, location: { search: '', hash: '' }, navigator: { userAgent: 'test' }
  };
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx; ctx.parent = ctx; ctx.top = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'morsel-bundle.js' });
  return ctx;
}

// Values cross the sandbox boundary with foreign prototypes; compare their JSON shape.
const plain = (v) => JSON.parse(JSON.stringify(v));

const app = boot();
const D = app.MorselData;
const NUTS = { picked: [], lifestyle: null, allergies: ['Nuts'] };

test('production script inventory is the fifteen files the compiler expects', () => {
  assert.equal(order.length, 15);
});

test('every dish honours the v3.2 field contract', () => {
  for (const d of D.dishes) {
    assert.ok(d.price === null || (typeof d.price === 'number' && d.price > 0), d.id + ' price');
    assert.ok(typeof d.mi === 'number' && d.mi > 0, d.id + ' miles');
    assert.ok(d.allergens === null || Array.isArray(d.allergens), d.id + ' allergens');
    assert.ok(typeof d.desc === 'string' && d.desc.length > 10, d.id + ' description');
    assert.ok(!('pct' in d) && !('reviews' in d) && !('walk' in d), d.id + ' carries no score, quotes or walk time');
    assert.ok(D.destinations[d.rest], d.rest + ' has a destination model');
  }
  assert.ok(D.dishes.some((d) => d.allergens === null), 'an unknown-ingredient fixture exists');
  assert.ok(D.dishes.some((d) => d.price === null), 'an unpriced fixture exists');
  assert.ok(D.dishes.some((d) => d.listed === false), 'an off-the-menu fixture exists');
});

test('the classifier separates match, conflict, unknown and lifestyle', () => {
  const byId = (id) => D.dishes.find((d) => d.id === id);
  assert.equal(D.dietState(byId('d11'), NUTS).state, 'conflict');
  assert.deepEqual(plain(D.dietState(byId('d11'), NUTS).conflicts), ['Nuts']);
  assert.equal(D.dietState(byId('d14'), NUTS).state, 'unknown', 'a null allergen list is unknown, not a match');
  assert.equal(D.dietState(byId('d09'), NUTS).state, 'match', 'an empty allergen list is a match');
  assert.equal(D.dietState(byId('d14'), null).state, 'match', 'no settings means nothing to conflict with');
  assert.equal(D.dietState(byId('d14'), { allergies: [] }).state, 'match', 'unknown only matters when an allergy is set');
  assert.equal(D.dietState(byId('d09'), { lifestyle: 'Vegan', allergies: [] }).state, 'lifestyle');
});

test('recommendation surfaces never see a conflict, and unknowns are not counted as matches', () => {
  const part = D.partition(D.dishes, NUTS);
  assert.equal(part.conflict.length, 4);
  assert.equal(part.unknown.length, 2);
  assert.equal(part.match.length, D.dishes.length - 6);
  assert.ok(!part.match.some((d) => (d.allergens || []).includes('nuts')));
  assert.ok(!part.match.some((d) => d.allergens === null));
  assert.deepEqual(plain(D.applyDietPrefs(D.dishes, NUTS).map((d) => d.id)), plain(part.match.map((d) => d.id)));
});

test('browsing filters use numeric price and miles, and set unpriced dishes aside', () => {
  const f = { price: [1], maxMi: 99 };
  const out = app.applyMorselFilters(D.dishes, f);
  assert.ok(out.every((d) => d.price < 15));
  assert.ok(!out.some((d) => d.price === null), 'an unpriced dish cannot be confirmed inside a budget');
  assert.equal(app.morselUnpriced(D.dishes, f).length, 1);
  assert.equal(app.morselUnpriced(D.dishes, { price: [], maxMi: 99 }).length, 0, 'nothing is set aside without a price filter');
  assert.ok(app.applyMorselFilters(D.dishes, { price: [], maxMi: 99 }).some((d) => d.price === null), 'unpriced dishes show when no budget is set');
  assert.ok(app.applyMorselFilters(D.dishes, { price: [], maxMi: 0.5 }).every((d) => d.mi <= 0.5));
  assert.deepEqual(plain(app.morselFilterChips({ price: [2, 1], maxMi: 1 }).map((c) => c.t)), ['Under $15 · $15–24', 'within 1 mi']);
  assert.equal(app.morselFilterCount(app.MORSEL_FILTER_DEFAULTS), 0);
});

test('the next-step label is chosen from the destination, never from a template', () => {
  assert.equal(D.nextStepLabel('Sumi'), 'View dish on menu');
  assert.equal(D.nextStepLabel('Elder & Ash'), 'View restaurant menu');
  assert.equal(D.nextStepLabel('Hollis'), 'Check with restaurant');
  assert.equal(D.destination('Nowhere').kind, 'none');
  assert.equal(D.price({ price: null }), null);
  assert.equal(D.price({ price: 19 }), '$19');
});

test('v3.1 saved state migrates without dropping a save', () => {
  const legacy = {
    screen: 'saved', tab: 'saved',
    saved: ['d01', 'd11', 'not-a-dish'],
    collections: [{ id: 'c1', name: 'Date night', dishes: ['d14', 'd22'] }],
    prefs: { picked: ['d08'], lifestyle: null, allergies: ['Nuts'], locDenied: true },
    filters: { price: ['$'], maxMi: 0.2, openNow: true },
    loc: { city: null, hood: null }, locDenied: true
  };
  const s = plain(boot({ morsel3_state: legacy }).loadMorselState());
  assert.deepEqual(s.filters, { price: [], maxMi: 0.2 }, 'string buckets and openNow are dropped, distance kept');
  assert.equal(s.loc, null, 'a location with no city becomes the demo area');
  assert.deepEqual(s.prefs, { picked: ['d08'], lifestyle: null, allergies: ['Nuts'] });
  assert.deepEqual(s.saved, ['d01', 'd11', 'not-a-dish'], 'unknown ids are filtered later by the app, not lost here');
  assert.deepEqual(s.savedAt, {}, 'legacy saves get no invented timestamp');
  assert.equal(s.query, '');
});

test('corrupt or missing storage boots to a clean first run', () => {
  for (const raw of [undefined, 'null', '{', '[]', '"x"', '{"screen":"bogus","filters":"no","saved":"no"}']) {
    const s = plain(boot(raw === undefined ? {} : { morsel3_state: raw }).loadMorselState());
    assert.deepEqual(s.filters, { price: [], maxMi: 99 });
    assert.equal(s.loc, null);
    assert.equal(s.screen, undefined);
    assert.ok(s.saved === null || s.saved === undefined || Array.isArray(s.saved));
  }
});
