import test from "node:test";
import assert from "node:assert/strict";
import { activateCollapsibleSections } from "../scripts/ui/collapsible-section.js";

test("sections remember both states across renders and isolate section and user preferences", () => {
  const stored = new Map();
  globalThis.localStorage = { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) };
  globalThis.game = { world: { id: "world" }, user: { id: "gm" } };
  const create = (key = "journeys.steps") => {
    const section = { dataset: { mlSectionKey: key }, open: false, addEventListener: (_, listener) => { section.toggle = listener; } };
    const app = { element: { querySelectorAll: () => [section] } };
    activateCollapsibleSections(app);
    return { section, app };
  };
  try {
    const { section, app } = create();
    assert.equal(section.open, true);
    section.toggle();
    assert.equal(stored.size, 0);
    section.open = false;
    section.toggle();
    activateCollapsibleSections(app);
    assert.equal(section.open, false);
    const reopened = create().section;
    assert.equal(reopened.open, false);
    assert.equal(create("another.section").section.open, true);
    game.user.id = "player";
    assert.equal(create().section.open, true);
    game.user.id = "gm";
    reopened.open = true;
    reopened.toggle();
    assert.equal(create().section.open, true);
    localStorage.getItem = () => { throw new Error("Storage blocked"); };
    localStorage.setItem = () => { throw new Error("Storage blocked"); };
    const unavailable = create().section;
    assert.equal(unavailable.open, true);
    unavailable.open = false;
    assert.doesNotThrow(() => unavailable.toggle());
  } finally {
    delete globalThis.localStorage;
    delete globalThis.game;
  }
});
