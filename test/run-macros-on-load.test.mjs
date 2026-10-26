import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  addRunOnLoadMenuEntries,
  isHotbarApplication,
  macroRunsForEveryone,
  macroRunsForUser,
  macrosToRunOnLoad,
  paintRunOnLoadIndicators,
  registerRunOnLoad,
  runMacrosOnLoad,
  toggleRunOnLoadForEveryone,
  toggleRunOnLoadForMe
} from "../scripts/ui/run-macros-on-load.js";

function flagStore(initial = {}) {
  const flags = structuredClone(initial);
  return {
    flags,
    getFlag(scope, key) {
      return flags[scope]?.[key];
    },
    async setFlag(scope, key, value) {
      flags[scope] ??= {};
      flags[scope][key] = structuredClone(value);
      return value;
    },
    async unsetFlag(scope, key) {
      if (flags[scope]) delete flags[scope][key];
    }
  };
}

function macro(id, overrides = {}) {
  const store = flagStore(overrides.flags ?? {});
  return {
    id,
    uuid: overrides.uuid ?? `Macro.${id}`,
    name: overrides.name ?? id,
    visible: overrides.visible ?? true,
    canExecute: overrides.canExecute ?? true,
    canUserExecute: overrides.canUserExecute,
    testUserPermission: overrides.testUserPermission,
    getFlag: store.getFlag,
    setFlag: store.setFlag,
    unsetFlag: store.unsetFlag,
    async execute() {
      if (typeof overrides.execute === "function") return overrides.execute.call(this);
      overrides.onExecute?.(this);
    }
  };
}

function world(macros, user) {
  const byId = new Map(macros.map(entry => [entry.id, entry]));
  globalThis.game = {
    user,
    macros: {
      get: id => byId.get(id) ?? null,
      contents: macros
    },
    i18n: {
      localize(key) {
        return key === "morelord-core.macros.runForMe" ? "Run on load for me" : key;
      }
    }
  };
  return { byId };
}

class Hotbar {}

function hotbarTarget(slot) {
  return { dataset: { slot: String(slot) }, closest() { return this; } };
}

function visibleLabels(entries, target) {
  return entries.filter(entry => entry.visible(target)).map(entry => entry.label);
}

class FakeElement {
  constructor() {
    this.dataset = {};
    this.children = [];
    this.parent = null;
    this.attributes = {};
    this.classList = {
      add: name => { this.classes.add(name); },
      remove: name => { this.classes.delete(name); },
      contains: name => this.classes.has(name)
    };
    this.classes = new Set();
    this.ownerDocument = this;
  }

  createElement() {
    const child = new FakeElement();
    child.ownerDocument = this.ownerDocument;
    return child;
  }

  set className(value) {
    this.classes = new Set(String(value).split(/\s+/).filter(Boolean));
  }

  get className() {
    return [...this.classes].join(" ");
  }

  append(child) {
    child.parent = this;
    this.children.push(child);
  }

  remove() {
    if (!this.parent) return;
    this.parent.children = this.parent.children.filter(child => child !== this);
    this.parent = null;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector) {
    if (selector === ":scope > .ml-core-hotbar-runs") {
      return this.children.filter(child => child.classes.has("ml-core-hotbar-runs"));
    }
    const found = [];
    const walk = node => {
      for (const child of node.children) {
        if (selector === "[data-slot]" && child.dataset.slot) found.push(child);
        walk(child);
      }
    };
    walk(this);
    return found;
  }
}

test("for me stores macro UUIDs on the user and the label follows the flag", async () => {
  const user = { ...flagStore(), isGM: false, hotbar: { 1: "alpha" }, id: "user-1" };
  const alpha = macro("alpha");
  world([alpha], user);
  const renders = [];
  globalThis.ui = { hotbar: { render() { renders.push(true); } } };
  const app = new Hotbar();
  globalThis.foundry = { applications: { ui: { Hotbar } } };
  try {
    assert.equal(await toggleRunOnLoadForMe(alpha, user), true);
    assert.deepEqual(user.getFlag("morelord-core", "runOnLoad"), ["Macro.alpha"]);
    assert.equal(macroRunsForUser(alpha, user), true);
    const entries = addRunOnLoadMenuEntries(app, []);
    assert.deepEqual(visibleLabels(entries, hotbarTarget(1)), ["Running on load for me"]);
    assert.equal(await toggleRunOnLoadForMe(alpha, user), false);
    assert.deepEqual(user.getFlag("morelord-core", "runOnLoad"), []);
    assert.deepEqual(visibleLabels(addRunOnLoadMenuEntries(app, []), hotbarTarget(1)), ["Run on load for me"]);
    assert.deepEqual(renders, [true, true]);
  } finally {
    delete globalThis.game;
    delete globalThis.ui;
    delete globalThis.foundry;
  }
});

test("for everyone is a GM-only macro flag and players do not see that entry", async () => {
  const player = { ...flagStore(), isGM: false, hotbar: { 3: "beta" }, id: "player" };
  const gm = { ...flagStore(), isGM: true, hotbar: { 3: "beta" }, id: "gm" };
  const beta = macro("beta");
  world([beta], player);
  globalThis.ui = { hotbar: { render() {} } };
  const app = new Hotbar();
  globalThis.foundry = { applications: { ui: { Hotbar } } };
  try {
    assert.equal(await toggleRunOnLoadForEveryone(beta, player), false);
    assert.equal(macroRunsForEveryone(beta), false);
    const playerEntries = addRunOnLoadMenuEntries(app, []);
    assert.deepEqual(visibleLabels(playerEntries, hotbarTarget(3)), ["Run on load for me"]);
    globalThis.game.user = gm;
    assert.equal(await toggleRunOnLoadForEveryone(beta, gm), true);
    assert.equal(beta.getFlag("morelord-core", "runOnLoad"), true);
    assert.deepEqual(visibleLabels(addRunOnLoadMenuEntries(app, []), hotbarTarget(3)), [
      "Run on load for me",
      "Running on load for everyone"
    ]);
    assert.equal(await toggleRunOnLoadForEveryone(beta, gm), false);
    assert.equal(beta.getFlag("morelord-core", "runOnLoad"), undefined);
  } finally {
    delete globalThis.game;
    delete globalThis.ui;
    delete globalThis.foundry;
  }
});

test("the hotbar menu ignores other applications, empty slots, and a second registration", () => {
  globalThis.foundry = { applications: { ui: { Hotbar } } };
  const user = { ...flagStore(), isGM: true, hotbar: { 1: "alpha" } };
  world([macro("alpha")], user);
  try {
    assert.equal(isHotbarApplication(new Hotbar()), true);
    assert.equal(isHotbarApplication({ id: "macros" }), false);
    assert.deepEqual(addRunOnLoadMenuEntries({ id: "macros" }, [{ label: "Edit" }]).map(entry => entry.label), ["Edit"]);
    const entries = addRunOnLoadMenuEntries(new Hotbar(), []);
    addRunOnLoadMenuEntries(new Hotbar(), entries);
    assert.equal(entries.filter(entry => entry.classes === "ml-core-run-on-load").length, 4);
    assert.deepEqual(visibleLabels(entries, hotbarTarget(9)), []);
    delete globalThis.foundry;
    assert.equal(isHotbarApplication({ id: "hotbar" }), true);
    assert.equal(isHotbarApplication({ id: "hotbar-popout" }), false);
  } finally {
    delete globalThis.game;
    delete globalThis.foundry;
  }
});

test("ready runs each macro once, skips hidden or unexecutable macros, and continues after errors", async () => {
  const calls = [];
  const errors = [];
  const user = {
    ...flagStore({ "morelord-core": { runOnLoad: ["Macro.mine", "Macro.shared", "Macro.hidden", "Macro.locked", "Macro.missing"] } }),
    isGM: false,
    id: "user-1"
  };
  const mine = macro("mine", { onExecute() { calls.push("mine"); } });
  const shared = macro("shared", {
    flags: { "morelord-core": { runOnLoad: true } },
    onExecute() { calls.push("shared"); }
  });
  user.getFlag = user.getFlag;
  const boom = macro("boom", {
    flags: { "morelord-core": { runOnLoad: true } },
    async execute() { throw new Error("boom"); }
  });
  const later = macro("later", {
    flags: { "morelord-core": { runOnLoad: true } },
    execute() { return Promise.reject(new Error("later")); }
  });
  const hidden = macro("hidden", { visible: false, onExecute() { calls.push("hidden"); } });
  const locked = macro("locked", { canExecute: false, onExecute() { calls.push("locked"); } });
  const denied = macro("denied", {
    flags: { "morelord-core": { runOnLoad: true } },
    canUserExecute: () => false,
    onExecute() { calls.push("denied"); }
  });
  world([mine, shared, boom, later, hidden, locked, denied], user);
  try {
    const ran = await runMacrosOnLoad({
      user,
      macros: globalThis.game.macros,
      logger: { error(message) { errors.push(message); } }
    });
    assert.deepEqual(calls, ["mine", "shared"]);
    assert.deepEqual(ran, ["Macro.mine", "Macro.shared"]);
    assert.equal(errors.length, 2);
    assert.match(errors[0], /boom/);
    assert.match(errors[1], /later/);
  } finally {
    delete globalThis.game;
  }
});

test("slot markers use different icons, colors, and tooltips and clear when the flags are off", () => {
  const user = {
    ...flagStore({ "morelord-core": { runOnLoad: ["Macro.mine", "Macro.both"] } }),
    hotbar: { 1: "mine", 2: "shared", 3: "both" }
  };
  const mine = macro("mine");
  const shared = macro("shared", { flags: { "morelord-core": { runOnLoad: true } } });
  const both = macro("both", { flags: { "morelord-core": { runOnLoad: true } } });
  world([mine, shared, both], user);
  const root = new FakeElement();
  for (const [slot, id] of [["1", "mine"], ["2", "shared"], ["3", "both"]]) {
    const slotElement = root.createElement();
    slotElement.dataset.slot = slot;
    slotElement.dataset.macro = id;
    root.append(slotElement);
  }
  try {
    paintRunOnLoadIndicators(root, user, globalThis.game.macros);
    const slots = root.querySelectorAll("[data-slot]");
    const mineMark = slots[0].children[0].children[0];
    const sharedMark = slots[1].children[0].children[0];
    const bothMarks = slots[2].children[0].children;
    assert.equal(mineMark.dataset.scope, "user");
    assert.equal(mineMark.className, "ml-core-hotbar-run fa-solid fa-user");
    assert.equal(mineMark.dataset.tooltip, "Runs on load for you");
    assert.equal(sharedMark.dataset.scope, "world");
    assert.equal(sharedMark.className, "ml-core-hotbar-run fa-solid fa-users");
    assert.equal(sharedMark.dataset.tooltip, "Runs on load for everyone");
    assert.deepEqual(bothMarks.map(mark => mark.dataset.scope), ["user", "world"]);
    assert.equal(slots[0].classList.contains("ml-core-hotbar-marked"), true);
    user.flags["morelord-core"].runOnLoad = [];
    paintRunOnLoadIndicators(root, user, globalThis.game.macros);
    assert.equal(slots[0].children.length, 0);
    assert.equal(slots[0].classList.contains("ml-core-hotbar-marked"), false);
    assert.equal(slots[1].children.length, 1);
  } finally {
    delete globalThis.game;
  }
});

test("registration listens for the hotbar menu and render hooks", () => {
  const hooks = [];
  const hooksApi = { on(name) { hooks.push(name); } };
  registerRunOnLoad(hooksApi);
  assert.deepEqual(hooks, ["getMacroContextOptions", "getHotbarContextOptions", "renderHotbar"]);
  const source = readFileSync(new URL("../scripts/main.js", import.meta.url), "utf8");
  assert.match(source, /registerRunOnLoad\(\)/);
  assert.match(source, /await runMacrosOnLoad\(\)/);
  const guide = readFileSync(new URL("../CORE-GM-PRODUCT-GUIDE.md", import.meta.url), "utf8");
  for (const label of [
    "Run on load for me",
    "Running on load for me",
    "Run on load for everyone",
    "Running on load for everyone",
    "Runs on load for you",
    "Runs on load for everyone"
  ]) {
    assert.match(guide, new RegExp(label.replaceAll(" ", "\\s+")));
  }
});

test("a compendium uuid and a permission-only visible macro still resolve once", async () => {
  const packMacro = macro("packed", {
    uuid: "Compendium.world.macros.Macro.packed",
    visible: undefined,
    canExecute: undefined,
    testUserPermission: () => true,
    canUserExecute: () => true
  });
  const user = { ...flagStore({ "morelord-core": { runOnLoad: [packMacro.uuid] } }), id: "user-1" };
  const calls = [];
  packMacro.execute = async () => { calls.push(packMacro.uuid); };
  globalThis.fromUuidSync = uuid => uuid === packMacro.uuid ? packMacro : null;
  world([], user);
  try {
    const selected = macrosToRunOnLoad({ user, macros: globalThis.game.macros });
    assert.deepEqual(selected.map(entry => entry.uuid), [packMacro.uuid]);
    assert.deepEqual(await runMacrosOnLoad({ user, macros: globalThis.game.macros, logger: console }), [packMacro.uuid]);
    assert.deepEqual(calls, [packMacro.uuid]);
  } finally {
    delete globalThis.fromUuidSync;
    delete globalThis.game;
  }
});
