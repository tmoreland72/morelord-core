import test from 'node:test';
import assert from 'node:assert/strict';
import { activateTabs } from '../scripts/ui/tabs.js';

test('Core tabs wrap, support Home/End/activation, skip disabled tabs and initialize once', () => {
  globalThis.CSS = { escape: value => value };
  let handler, registrations = 0, selected, focused;
  const tabs = ['sell', 'transfer', 'buy', 'wishlist'].map(id => ({ id, disabled: false,
    getAttribute() { return this.disabled ? 'true' : 'false'; },
    click() { selected = id; }, focus() { focused = id; }, closest() { return this; }
  }));
  const strip = { querySelectorAll: () => tabs, addEventListener: (_, callback) => { handler = callback; registrations++; } };
  const app = { element: { querySelectorAll: () => [strip], querySelector: selector => selector.includes('aria-disabled') ? null : tabs.find(tab => selector.includes(tab.id)) } };
  activateTabs(app); activateTabs(app); assert.equal(registrations, 1);
  for (const [index, key, expected] of [[0, 'ArrowRight', 'transfer'], [0, 'ArrowLeft', 'wishlist'], [1, 'Home', 'sell'], [0, 'End', 'wishlist'], [1, ' ', 'transfer'], [1, 'Enter', 'transfer']]) {
    let prevented = false;
    handler({ target: tabs[index], key, preventDefault() { prevented = true; } });
    assert.equal(selected, expected); assert.ok(prevented);
    activateTabs(app); assert.equal(focused, expected);
  }
  tabs[1].disabled = true;
  handler({ target: tabs[0], key: 'ArrowRight', preventDefault() {} }); assert.equal(selected, 'buy');
  handler({ target: tabs[1], key: 'Enter', preventDefault() { assert.fail('Disabled tab consumed input'); } }); assert.equal(selected, 'buy');
});
