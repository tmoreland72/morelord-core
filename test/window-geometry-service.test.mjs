import assert from "node:assert/strict";
import test from "node:test";
import { WindowGeometryService } from "../scripts/services/window-geometry-service.js";

const SAVED_GEOMETRY = { left: 40, top: 48, width: 640, height: 480 };

function installGeometryGlobals(t) {
  const values = new Map();
  const frames = [];
  const previousFrame = globalThis.requestAnimationFrame;
  const previousWindow = globalThis.window;
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  globalThis.game = { world: { id: "test-world" }, user: { id: "player-user" } };
  globalThis.foundry = { utils: { deepClone: value => structuredClone(value) } };
  globalThis.window = { innerWidth: 1280, innerHeight: 720 };
  globalThis.requestAnimationFrame = callback => {
    frames.push(callback);
    return frames.length;
  };
  t.after(() => {
    delete globalThis.localStorage;
    delete globalThis.game;
    delete globalThis.foundry;
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousFrame === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = previousFrame;
  });
  return { values, frames };
}

function serviceWithSavedGeometry(values) {
  const service = new WindowGeometryService({ moduleId: "morelord-core", settingKey: "windowGeometry" });
  values.set(service.storageKey, JSON.stringify({ "morelord-test-window": SAVED_GEOMETRY }));
  return service;
}

function flushFrames(frames) {
  const pending = frames.splice(0);
  for (const callback of pending) callback();
  if (frames.length) flushFrames(frames);
}

test("window geometry is stored locally without updating a Foundry Setting", async () => {
  const values = new Map();
  let settingWrites = 0;
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  globalThis.game = {
    world: { id: "test-world" },
    user: { id: "player-user", isGM: false },
    settings: {
      get: () => ({}),
      set: async () => { settingWrites += 1; }
    }
  };
  globalThis.foundry = { utils: { deepClone: value => structuredClone(value) } };

  try {
    const service = new WindowGeometryService({ moduleId: "morelord-core", settingKey: "windowGeometry" });
    await service.remember({
      options: { id: "morelord-test-window" },
      element: { getBoundingClientRect: () => ({ left: 20, top: 30, width: 640, height: 480 }) },
      position: { left: 20, top: 30, width: 640, height: 480 }
    });

    assert.equal(settingWrites, 0);
    assert.deepEqual(service.all()["morelord-test-window"], { left: 20, top: 30, width: 640, height: 480 });
    assert.equal(values.has("morelord-core.windowGeometry.test-world.player-user"), true);
  } finally {
    delete globalThis.localStorage;
    delete globalThis.game;
    delete globalThis.foundry;
  }
});

test("window geometry never falls back to a Foundry Setting when local storage is unavailable", async () => {
  let settingReads = 0;
  let settingWrites = 0;
  globalThis.game = {
    world: { id: "test-world" },
    user: { id: "player-user", isGM: false },
    settings: {
      get: () => { settingReads += 1; return {}; },
      set: async () => { settingWrites += 1; }
    }
  };
  globalThis.foundry = { utils: { deepClone: value => structuredClone(value) } };

  try {
    const service = new WindowGeometryService({ moduleId: "morelord-core", settingKey: "windowGeometry" });
    await service.remember({
      options: { id: "morelord-test-window" },
      element: { getBoundingClientRect: () => ({ left: 20, top: 30, width: 640, height: 480 }) },
      position: { left: 20, top: 30, width: 640, height: 480 }
    });

    assert.deepEqual(service.all(), {});
    assert.equal(settingReads, 0);
    assert.equal(settingWrites, 0);
  } finally {
    delete globalThis.game;
    delete globalThis.foundry;
  }
});

test("restore does not call setPosition when the app element is null before the frame", t => {
  const { values, frames } = installGeometryGlobals(t);
  const service = serviceWithSavedGeometry(values);
  let calls = 0;
  const application = {
    options: { id: "morelord-test-window" },
    rendered: true,
    element: { isConnected: true, offsetWidth: 640 },
    setPosition() {
      calls += 1;
      // DialogV2._updatePosition reads the live element. A closed dialog's element is null.
      void this.element.offsetWidth;
    }
  };

  service.restore(application);
  application.element = null;
  assert.equal(frames.length, 1);
  assert.doesNotThrow(() => flushFrames(frames));
  assert.equal(calls, 0);
  assert.equal(service.restoring.has(application), false);
});

test("restore does not call setPosition when the app is no longer rendered before the frame", t => {
  const { values, frames } = installGeometryGlobals(t);
  const service = serviceWithSavedGeometry(values);
  let calls = 0;
  const application = {
    options: { id: "morelord-test-window" },
    rendered: true,
    element: { isConnected: true, offsetWidth: 640 },
    setPosition() { calls += 1; }
  };

  service.restore(application);
  application.rendered = false;
  assert.doesNotThrow(() => flushFrames(frames));
  assert.equal(calls, 0);
  assert.equal(service.restoring.has(application), false);
});

test("restore does not call setPosition when the app element is no longer connected", t => {
  const { values, frames } = installGeometryGlobals(t);
  const service = serviceWithSavedGeometry(values);
  let calls = 0;
  const application = {
    options: { id: "morelord-test-window" },
    rendered: true,
    element: { isConnected: true, offsetWidth: 640 },
    setPosition() { calls += 1; }
  };

  service.restore(application);
  application.element = { isConnected: false, offsetWidth: 0 };
  assert.doesNotThrow(() => flushFrames(frames));
  assert.equal(calls, 0);
  assert.equal(service.restoring.has(application), false);
});

test("restore still positions a window that is rendered and connected on the frame", t => {
  const { values, frames } = installGeometryGlobals(t);
  const service = serviceWithSavedGeometry(values);
  const positions = [];
  let restoringDuringSet = null;
  const application = {
    options: { id: "morelord-test-window" },
    rendered: true,
    element: { isConnected: true, offsetWidth: 640 },
    setPosition(geometry) {
      positions.push(geometry);
      restoringDuringSet = service.restoring.has(application);
    }
  };

  service.restore(application);
  assert.equal(frames.length, 1);
  frames.shift()();
  assert.deepEqual(positions, [SAVED_GEOMETRY]);
  assert.equal(restoringDuringSet, true);
  assert.equal(frames.length, 1);
  frames.shift()();
  assert.equal(service.restoring.has(application), false);
});
