// Run from the repository root: node --test tests/tenet-new.test.cjs
// Exercise the scripts shipped in the prototypes. No copied state-machine code,
// browser, broker connection, or third-party test dependencies are required.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadPrototype(name) {
  const filename = path.join(__dirname, '..', 'tenet-proto', name + '.html');
  const html = readFileSync(filename, 'utf8');
  const script = html.match(/<script\b[^>]*\bdata-dc-script\b[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(script, filename + ' must contain the actual Component script');
  const storage = new Map();
  class DCLogic {
    props = {};
    setState(patch) { this.state = { ...this.state, ...patch }; }
  }
  const context = vm.createContext({
    DCLogic,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
    },
    // Animation/focus timers are irrelevant here. Advance the real trading
    // timer through Component.tick() explicitly instead of waiting in tests.
    setTimeout: () => 0, clearTimeout() {},
    setInterval: () => 0, clearInterval() {},
    window: { addEventListener() {}, removeEventListener() {} },
    location: { search: '' },
  });
  const Component = new vm.Script(script[1] + '\nComponent;', { filename }).runInContext(context);
  return { component: new Component(), html };
}

function enterMonday(component, quantity) {
  if (quantity !== undefined) component.renderVals().monQtyChange({ target: { value: String(quantity) } });
  component.complete();
  assert.equal(component.state.monPhase, 'stepped');
  assert.equal(component.state.sent, null);
}

function finishCooldown(component) {
  // The demo serves six seconds per tick: 90 ticks covers nine minutes.
  for (let i = 0; i < 90; i++) component.tick();
  assert.equal(component.state.monPhase, 'review');
  assert.equal(component.state.monRemaining, 0);
  assert.equal(component.state.sent, null, 'elapsed time must never send an order');
}

for (const cap of [5, 2]) {
  test(`oversized Monday order reduces to current cap ${cap} and starts the wait together`, () => {
    const { component: c } = loadPrototype('host-new');
    c.put({ cap, capPending: cap + 3 });
    const initialEvents = c.sh().events.length;
    enterMonday(c); // Use the real default staged quantity, 12.
    assert.equal(c.state.monQty, 12);
    assert.equal(c.renderVals().monShowReduce, true);
    assert.equal(c.renderVals().monShowHold, false, 'do not offer wait as an alternative to resolving the size rule');

    c.renderVals().monReduce();
    assert.equal(c.state.monQty, cap, 'a pending looser cap must not apply today');
    assert.equal(c.state.monPhase, 'cooling', 'one action must both reduce and start the wait');
    assert.equal(c.state.monRemaining, 540);
    assert.equal(c.state.sent, null);
    assert.equal(c.sh().events.length, initialEvents, 'no completed trade may be recorded before confirmation');
    finishCooldown(c);
    for (let i = 0; i < 10; i++) c.tick();
    assert.equal(c.state.sent, null, 'review must continue waiting for an explicit send');
    c.complete();
    assert.ok(c.state.sent);
    assert.equal(c.sh().events.length, initialEvents + 1);
    assert.equal(c.sh().events[0].size, cap + '× 602P');
    assert.equal(c.sh().events[0].result, 'sent @ $1.36');
  });
}

test('within-cap Monday order keeps its size and exposes the wait-only path', () => {
  const { component: c } = loadPrototype('host-new');
  enterMonday(c, 3);
  assert.equal(c.renderVals().monShowReduce, false);
  assert.equal(c.renderVals().monShowHold, true);
  c.renderVals().holdKey({ key: 'Enter', preventDefault() {} });
  assert.equal(c.state.monQty, 3);
  assert.equal(c.state.monPhase, 'cooling');
  finishCooldown(c);
  c.complete();
  assert.equal(c.sh().events[0].size, '3× 602P');
});

for (const phase of ['stepped', 'cooling', 'review']) {
  test(`cancelling Monday at ${phase} leaves no order scheduled to send`, () => {
    const { component: c } = loadPrototype('host-new');
    const initialEvents = c.sh().events.length;
    enterMonday(c);
    if (phase !== 'stepped') c.renderVals().monReduce();
    if (phase === 'review') finishCooldown(c);
    const values = c.renderVals();
    (phase === 'cooling' ? values.monCancelCooldown : values.monCancel)();
    for (let i = 0; i < 100; i++) c.tick();
    assert.equal(c.state.sent, null);
    assert.equal(c.state.monPhase, 'live');
    assert.equal(c.sh().events.length, initialEvents + 1);
    assert.equal(c.sh().events[0].result, 'nothing sent');
    assert.match(c.sh().events[0].what, /cancelled/);
  });
}

test('Monday override requires a reason and a separate final confirmation', () => {
  const { component: c } = loadPrototype('host-new');
  const initialEvents = c.sh().events.length;
  enterMonday(c);
  c.renderVals().openSheetMon();
  c.renderVals().sheetContinue();
  assert.equal(c.state.monPhase, 'stepped');
  assert.equal(c.state.sheetFor, 'mon');
  assert.equal(c.state.sent, null);

  c.renderVals().sheetReasons[0].onClick();
  c.renderVals().sheetContinue();
  assert.equal(c.state.monPhase, 'overridden');
  assert.equal(c.state.sent, null);
  assert.equal(c.sh().events.length, initialEvents);
  c.complete();
  const event = c.sh().events[0];
  assert.equal(event.kind, 'over');
  assert.equal(event.rule, 'LOSS COOLDOWN + SIZE CAP');
  assert.equal(event.size, '12× 602P');
  assert.equal(event.reason, 'This setup was planned before the losses');
});

test('wind-down reaches zero at 3:55 and cannot send a new order', () => {
  const { component: c } = loadPrototype('host-new');
  c.resetScenario('wed');
  const initialEvents = c.sh().events.length;
  for (const allowance of [5, 2, 1, 0]) {
    c.renderVals().advanceClock();
    c.renderVals().wedQtyChange({ target: { value: '12' } });
    assert.equal(c.state.wedQty, allowance);
  }
  assert.equal(c.renderVals().wedFlat, true);
  assert.equal(c.renderVals().wedOpen, false);
  c.renderVals().wedPlus();
  c.renderVals().wedMaxFill();
  assert.equal(c.state.wedQty, 0);
  c.renderVals().railKey({ key: 'Enter', preventDefault() {} });
  assert.equal(c.state.sent, null);
  assert.equal(c.sh().events.length, initialEvents);
});

test('desktop override and cooldown preserve explicit review and cancellation', () => {
  const { component: c } = loadPrototype('desktop-new');
  c.doSell();
  c.renderVals().openReason();
  c.renderVals().reasonContinue();
  assert.equal(c.state.mode, 'reason');
  c.renderVals().reasons[0].onClick();
  c.renderVals().reasonContinue();
  assert.equal(c.state.mode, 'overridden');
  assert.equal(c.renderVals().cancelAtReview, true);
  assert.equal(c.state.pos, null);
  c.renderVals().cancelOrder();
  assert.equal(c.state.mode, 'cancelled');
  assert.equal(c.state.pos, null);

  c.renderVals().newOrder();
  c.doSell();
  c.renderVals().startCooldown();
  c.renderVals().skip();
  assert.equal(c.state.mode, 'review');
  assert.equal(c.state.pos, null);
  c.renderVals().editOrder();
  c.renderVals().qtyChange({ target: { value: '700' } });
  c.doSell();
  assert.equal(c.state.mode, 'sent');
  assert.equal(c.state.pos.qty, 700);
});

// This structural check guards the original scroll-discovery regression.
// It does not claim to replace browser checks of dimensions or visibility.
function divContents(html, className) {
  const start = html.indexOf('<div class="' + className + '"');
  assert.notEqual(start, -1, 'missing ' + className);
  const tags = /<\/?div\b[^>]*>/g;
  tags.lastIndex = start;
  let depth = 0;
  for (let match; (match = tags.exec(html));) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return html.slice(start, tags.lastIndex);
  }
  assert.fail('unclosed ' + className);
}

test('desktop decisions and final confirmation stay outside the scrolling details', () => {
  const { html } = loadPrototype('desktop-new');
  const details = divContents(html, 'ticket-details');
  const actions = divContents(html, 'ticket-actions');
  for (const handler of ['startCooldown', 'openReason', 'cancelOrder', 'cancelCooldown',
    'reasonContinue', 'reasonCancel', 'editOrder', 'newOrder', 'sell']) {
    const binding = 'onClick="{{ ' + handler + ' }}"';
    assert.ok(actions.includes(binding), handler + ' must remain in the persistent action region');
    assert.ok(!details.includes(binding), handler + ' must not require scrolling the detail region');
  }
});
