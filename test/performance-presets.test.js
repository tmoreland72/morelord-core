import {test} from 'node:test';
import assert from 'node:assert/strict';
import {presetSettings, applyPerformancePreset} from '../scripts/services/performance-presets.js';

const modes = {LOW: 0, MED: 1, HIGH: 2, MAX: 3};
function fixture() {
  const values = {performanceMode: 2, maxFPS: 60, pixelRatioResolutionScaling: true, photosensitiveMode: false, mipmap: true, visionAnimation: true, lightAnimation: true};
  const calls = [];
  return {values, calls, settings: {
    settings: new Map(Object.keys(values).map(key => [`core.${key}`, {scope: 'client'}])),
    get: (_, key) => values[key],
    set: async (namespace, key, value) => {calls.push([namespace, key, value]); values[key] = value;}
  }};
}
test('presets use native mode constants and deliberate FPS/resolution tradeoffs', () => {
  assert.deepEqual(presetSettings('low', modes), {performanceMode: 0, maxFPS: 10, pixelRatioResolutionScaling: false, photosensitiveMode: true, mipmap: false, visionAnimation: false, lightAnimation: false});
  assert.deepEqual(presetSettings('balanced', modes), {performanceMode: 1, maxFPS: 30, pixelRatioResolutionScaling: true, photosensitiveMode: false, mipmap: true, visionAnimation: true, lightAnimation: true});
  assert.deepEqual(presetSettings('high', modes), {performanceMode: 3, maxFPS: 60, pixelRatioResolutionScaling: true, photosensitiveMode: false, mipmap: true, visionAnimation: true, lightAnimation: true});
  for (const bad of ['', 'constructor', null, 0]) assert.throws(() => presetSettings(bad, modes));
});
test('the original seven personal settings are applied without changing other namespaces', async () => {
  const {settings, calls, values} = fixture();
  await applyPerformancePreset('balanced', settings, modes);
  assert.deepEqual(values, presetSettings('balanced', modes));
  assert.equal(calls.length, 7);
  assert(calls.every(([namespace]) => namespace === 'core'));
});
test('missing or world-scoped setting rejects before any write', async () => {
  for (const definition of [undefined, {scope: 'world'}]) {
    const {settings, calls} = fixture();
    settings.settings.set('core.maxFPS', definition);
    await assert.rejects(applyPerformancePreset('low', settings, modes));
    assert.equal(calls.length, 0);
  }
});

test('optional Dice So Nice visibility matches all three presets', async () => {
  const calls = [];
  const dice = {setVisibility: async value => calls.push(value)};
  for (const value of ['low', 'balanced', 'high']) await applyPerformancePreset(value, fixture().settings, modes, dice);
  assert.deepEqual(calls, ['none', 'mine', 'all']);
  await applyPerformancePreset('low', fixture().settings, modes, null);
  assert.equal(calls.length, 3);
  const {settings, calls: writes} = fixture();
  await assert.rejects(applyPerformancePreset('low', settings, modes, {}), /Update Dice So Nice/);
  assert.equal(writes.length, 0);
});

test('a Dice So Nice failure rolls back the core settings and prior dice visibility', async () => {
  const {settings, values} = fixture();
  const previous = {...values}, calls = [];
  const dice = {setVisibility: async value => {calls.push(value); if (value === 'none') throw Error('Dice update failed');}};
  await assert.rejects(applyPerformancePreset('low', settings, modes, dice), /Dice update failed/);
  assert.deepEqual(values, previous);
  assert.deepEqual(calls, ['none', 'all']);
});
test('failed update restores previous settings, including the failed setter', async () => {
  const {settings, values} = fixture();
  const previous = {...values}, set = settings.set;
  let failed = false;
  settings.set = async (...args) => {
    await set(...args);
    if (args[1] === 'maxFPS' && !failed) { failed = true; throw Error('Failed draw'); }
  };
  await assert.rejects(applyPerformancePreset('low', settings, modes), /Failed draw/);
  assert.deepEqual(values, previous);
});

test('personal menu stays available while world opt-out and remembered dismissal suppress offers', async () => {
  let renders = 0;
  globalThis.foundry = {applications: {api: {
    ApplicationV2: class {render() {renders++;} async _onClose() {}},
    HandlebarsApplicationMixin: Base => Base
  }}};
  const {registerPerformanceSettings, offerPerformanceSetup, PerformanceApp} = await import('../scripts/ui/performance-app.js');
  const definitions = new Map(), values = new Map(), menus = new Map();
  globalThis.game = {settings: {
    register: (_, key, definition) => {definitions.set(key, definition); values.set(key, definition.default);},
    registerMenu: (_, key, definition) => menus.set(key, definition),
    get: (_, key) => values.get(key),
    set: async (_, key, value) => values.set(key, value)
  }};
  registerPerformanceSettings();
  assert.equal(definitions.get('promptPerformance').scope, 'world');
  assert.equal(definitions.get('promptPerformance').restricted, true);
  assert.equal(menus.get('performance').restricted, false);
  offerPerformanceSetup();
  assert.equal(renders, 1);
  await PerformanceApp.prototype._onClose.call({}, {});
  assert.equal(values.get('performancePromptSeen'), true);
  offerPerformanceSetup();
  assert.equal(renders, 1);
  values.set('performancePromptSeen', false);
  values.set('promptPerformance', false);
  offerPerformanceSetup();
  assert.equal(renders, 1);
  assert.equal(values.get('performancePreset'), '');
  let opened;
  game.modules = new Map([['morelord-core', {api: {ui: {documentation: {open: (...args) => {opened = args;}}}}}]]);
  PerformanceApp.openDocumentation();
  assert.deepEqual(opened, ['morelord-core', 'personal-performance']);
});
