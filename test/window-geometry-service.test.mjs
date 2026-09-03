import assert from "node:assert/strict";
import test from "node:test";
import { WindowGeometryService } from "../scripts/services/window-geometry-service.js";

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
