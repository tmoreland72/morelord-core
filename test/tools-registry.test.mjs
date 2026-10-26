import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createToolsRegistry, mergeCoreApi } from "../scripts/ui/tools-registry.js";

function tool(id, overrides = {}) {
  return {
    id,
    title: overrides.title ?? id,
    icon: overrides.icon ?? "fa-solid fa-hammer",
    order: overrides.order ?? 0,
    visible: overrides.visible ?? (() => true),
    onClick: overrides.onClick ?? (() => {})
  };
}

test("registry orders tools, hides invisible ones, and replaces the same id", () => {
  const registry = createToolsRegistry();
  let craftworksVisible = true;
  registry.api.register(tool("morelord-downtime", { title: "Morelord Downtime", order: 40 }));
  registry.api.register(tool("morelord-journeys", { title: "Morelord Journeys", order: 10 }));
  registry.api.register(tool("morelord-encounters", { title: "Zebra", order: 20, visible: () => false }));
  registry.api.register(tool("morelord-craftworks", {
    title: "Later",
    order: 20,
    visible: () => craftworksVisible
  }));
  registry.api.register(tool("morelord-craftworks", { title: "Alpha", order: 20 }));
  registry.api.register(tool("morelord-beta", { title: "Beta", order: 20 }));
  assert.deepEqual(registry.api.list().map(entry => [entry.id, entry.title]), [
    ["morelord-craftworks", "Alpha"],
    ["morelord-beta", "Beta"],
    ["morelord-downtime", "Morelord Downtime"],
    ["morelord-journeys", "Morelord Journeys"]
  ]);
  craftworksVisible = false;
  registry.api.register(tool("morelord-craftworks", { title: "Alpha", order: 20, visible: () => craftworksVisible }));
  assert.deepEqual(registry.api.list().map(entry => entry.title), ["Beta", "Morelord Downtime", "Morelord Journeys"]);
  assert.equal(registry.api.unregister("morelord-downtime"), true);
  assert.deepEqual(registry.api.list().map(entry => entry.id), ["morelord-beta", "morelord-journeys"]);
  assert.equal(registry.api.unregister("missing"), false);
});

test("tool clicks call onClick, isolate errors, and leave the active control alone", async () => {
  const registry = createToolsRegistry();
  const errors = [];
  const activations = [];
  globalThis.ui = {
    notifications: { error(message) { errors.push(message); } },
    controls: { activate(options) { activations.push(options); } }
  };
  let ran = 0;
  registry.api.register(tool("bad-tool", { order: 2, onClick() { throw new Error("boom"); } }));
  registry.api.register(tool("good-tool", { order: 1, onClick(event) { ran += event?.detail ?? 1; } }));
  registry.api.register(tool("async-tool", { order: 3, onClick() { return Promise.reject(new Error("later")); } }));
  const control = registry.buildSceneControl({ tokens: {}, measure: {} });
  const event = { detail: 4 };
  assert.doesNotThrow(() => control.tools.badTool.onChange(event, true));
  control.tools.goodTool.onChange(event, true);
  control.tools.asyncTool.onChange(event, true);
  control.tools.morelordHome.onChange(event, true);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(ran, 4);
  assert.deepEqual(errors, ["boom", "later"]);
  assert.deepEqual(activations, []);
  delete globalThis.ui;
});

test("palette titles sort alphabetically regardless of registered order", () => {
  const registry = createToolsRegistry();
  globalThis.game = {
    i18n: {
      lang: "en",
      localize(key) { return key === "TOOL.Shops" ? "Manage Shops" : key; }
    }
  };
  try {
    for (const [id, title, order] of [
      ["morelord-marketplace", "Marketplace", 1],
      ["morelord-craftworks", "Craftworks", 90],
      ["morelord-journeys", "Journeys", 2],
      ["morelord-shops", "TOOL.Shops", 3],
      ["morelord-encounters", "encounters", 80],
      ["morelord-downtime", "Downtime", 70],
      ["zeta-same", "Same", 1],
      ["alpha-same", "same", 100]
    ]) registry.api.register(tool(id, { title, order }));
    const control = registry.buildSceneControl({});
    const buttons = Object.values(control.tools).filter(entry => entry.button).sort((a, b) => a.order - b.order);
    assert.deepEqual(buttons.map(entry => entry.title), [
      "Craftworks", "Downtime", "encounters", "Journeys", "TOOL.Shops", "Marketplace", "same", "Same"
    ]);
    assert.deepEqual(buttons.map(entry => entry.order), [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.deepEqual(registry.api.list().map(entry => entry.id), [
      "morelord-craftworks", "morelord-downtime", "morelord-encounters", "morelord-journeys",
      "morelord-shops", "morelord-marketplace", "alpha-same", "zeta-same"
    ]);
    assert.equal(control.activeTool, "morelordHome");
    assert.equal(control.tools.morelordHome.order, 0);
    assert.equal(control.tools.morelordHome.button, undefined);
    assert.equal(control.tools.morelordHome.visible, true);
  } finally {
    delete globalThis.game;
  }
});

test("scene control is built from visible tools and keeps a non-button active tool", () => {
  const registry = createToolsRegistry();
  registry.api.register(tool("morelord-craftworks", { title: "Morelord Craftworks", icon: "fa-solid fa-hammer", order: 30 }));
  registry.api.register(tool("morelord-marketplace-shops", { title: "Manage Marketplace Shops", icon: "fa-solid fa-shop", order: 51, visible: () => false }));
  const controls = { tokens: {}, measure: {}, tiles: {} };
  const control = registry.buildSceneControl(controls);
  assert.equal(control.name, "morelord");
  assert.equal(control.title, "Morelord Tools");
  assert.equal(control.icon, "fa-sharp fa-solid fa-user-crown");
  assert.equal(control.order, 3);
  assert.equal(control.visible, true);
  assert.equal(control.activeTool, "morelordHome");
  assert.equal(control.tools.morelordHome.name, "morelordHome");
  assert.equal(control.tools.morelordHome.title, "morelord-core.modules.title");
  assert.equal(control.tools.morelordHome.button, undefined);
  assert.equal(control.tools.morelordHome.visible, true);
  assert.equal(control.tools.morelordCraftworks.name, "morelordCraftworks");
  assert.equal(control.tools.morelordCraftworks.button, true);
  assert.equal(control.tools.morelordCraftworks.visible, true);
  assert.equal(control.tools.morelordCraftworks.icon, "fa-solid fa-hammer");
  assert.equal(control.tools.morelordMarketplaceShops, undefined);
  const empty = createToolsRegistry().buildSceneControl(controls);
  assert.equal(empty.visible, false);
  assert.equal(empty.activeTool, "morelordHome");
  assert.equal(Object.keys(empty.tools).join(","), "morelordHome");
});

test("a failing visibility check does not break the control", () => {
  const registry = createToolsRegistry();
  const errors = [];
  globalThis.ui = { notifications: { error(message) { errors.push(message); } } };
  registry.api.register(tool("broken", { visible() { throw new Error("hidden"); } }));
  registry.api.register(tool("shown", { title: "Shown" }));
  const control = registry.buildSceneControl({});
  assert.equal(control.visible, true);
  assert.equal(control.tools.broken, undefined);
  assert.equal(control.tools.shown.button, true);
  assert.deepEqual(errors, ["hidden"]);
  delete globalThis.ui;
});

test("refresh rebuilds rendered controls once", async () => {
  const registry = createToolsRegistry();
  const renders = [];
  globalThis.ui = { controls: { rendered: false, render(options) { renders.push(options); } } };
  registry.api.register(tool("early"));
  await new Promise(resolve => setTimeout(resolve, 70));
  assert.deepEqual(renders, []);
  globalThis.ui.controls.rendered = true;
  registry.api.register(tool("one"));
  registry.api.register(tool("two"));
  registry.api.refresh();
  assert.deepEqual(renders, []);
  await new Promise(resolve => setTimeout(resolve, 70));
  assert.deepEqual(renders, [{ controls: true, reset: true }]);
  delete globalThis.ui;
});

test("ready merges the full api into the init object and keeps its tools", () => {
  const earlyTools = { register() {} };
  const early = { tools: earlyTools, extra: true };
  const replacement = { register() { throw new Error("replaced"); } };
  const merged = mergeCoreApi(early, { open() { return "window"; }, tools: replacement, designSystemVersion: "1.1.0" });
  assert.equal(merged, early);
  assert.equal(merged.tools, earlyTools);
  assert.equal(merged.extra, true);
  assert.equal(merged.open(), "window");
  const created = {};
  mergeCoreApi(created, { tools: replacement });
  assert.equal(created.tools, replacement);
});

test("init publishes tools and ready merges them into that same api object", () => {
  const main = readFileSync(new URL("../scripts/main.js", import.meta.url), "utf8");
  assert.match(main, /api\.tools \?\?= toolsRegistry\.api/);
  assert.match(main, /globalThis\.MorelordCore = api/);
  assert.match(main, /Hooks\.callAll\("morelord-core\.registerTools", tools\)/);
  assert.match(main, /controls\.morelord = toolsRegistry\.buildSceneControl\(controls\)/);
  assert.match(main, /renderSceneControls", \(application, element\) => bindMorelordModulesButton\(application, element\)/);
  assert.match(main, /mergeCoreApi\(api, \{/);
  assert.doesNotMatch(main, /const api = \{/);
});

test("reserved and blank tool ids are rejected", () => {
  const registry = createToolsRegistry();
  assert.throws(() => registry.api.register({ id: " " }), /requires an id/);
  assert.throws(() => registry.api.register({ id: "morelord-home" }), /morelordHome is reserved/);
});
