import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createToolsRegistry } from "../scripts/ui/tools-registry.js";
import {
  MORELORD_DISCORD_INVITE,
  MORELORD_MODULE_CATALOG,
  MORELORD_MODULES_APP,
  MORELORD_WEBSITE,
  MORELORD_YOUTUBE,
  bindMorelordModulesButton,
  morelordModuleRows,
  morelordModulesContext,
  openMorelordModules
} from "../scripts/ui/morelord-modules.js";

const lang = JSON.parse(readFileSync(new URL("../lang/en.json", import.meta.url), "utf8"));
const template = readFileSync(new URL("../templates/modules.hbs", import.meta.url), "utf8");

function installed(states) {
  return { get(id) { return states[id]; } };
}

test("Morelord Modules lists every module with live status and a link only when missing", () => {
  const rows = morelordModuleRows(installed({
    "morelord-core": { active: true },
    "morelord-journeys": { active: false }
  }), { localize: key => lang[key] ?? key, format: (key, data) => lang[key]?.replace("{title}", data.title) });
  assert.deepEqual(rows.map(row => row.id), MORELORD_MODULE_CATALOG.map(entry => entry.id));
  assert.deepEqual(rows.map(row => [row.id, row.state, row.statusLabel, row.tone]), [
    ["morelord-core", "active", "Active", "success"],
    ["morelord-journeys", "inactive", "Installed but inactive", "warning"],
    ["morelord-encounters", "missing", "Not installed", "info"],
    ["morelord-character-export", "missing", "Not installed", "info"],
    ["morelord-craftworks", "missing", "Not installed", "info"],
    ["morelord-marketplace", "missing", "Not installed", "info"],
    ["morelord-downtime", "missing", "Not installed", "info"],
    ["morelord-game-master", "missing", "Not installed", "info"]
  ]);
  assert.equal(rows[0].url, "");
  assert.equal(rows[1].url, "");
  for (const row of rows.filter(entry => entry.state === "missing")) {
    const url = new URL(row.url);
    const catalog = MORELORD_MODULE_CATALOG.find(entry => entry.id === row.id);
    assert.equal(`${url.origin}${url.pathname}`, catalog.url);
    assert.equal(url.searchParams.get("utm_source"), "foundry");
    assert.equal(url.searchParams.get("utm_medium"), "morelord_tools");
    assert.equal(url.searchParams.get("utm_campaign"), row.id);
    assert.equal(row.learnMore, "Learn more");
    assert.equal(row.learnMoreLabel, `Learn more about ${row.title}`);
  }
  assert.equal(rows.find(row => row.id === "morelord-game-master").url.startsWith("https://github.com/tmoreland72/morelord-game-master?"), true);
  assert.equal(rows.find(row => row.id === "morelord-encounters").description, lang["morelord-core.modules.morelord-encounters.description"]);
  for (const entry of MORELORD_MODULE_CATALOG) {
    assert.equal(lang[`morelord-core.modules.${entry.id}.title`], entry.title);
    assert.equal(lang[`morelord-core.modules.${entry.id}.description`], entry.description);
    const row = rows.find(item => item.id === entry.id);
    assert.equal(row.icon, entry.icon);
    if (entry.docs) {
      const docs = new URL(row.documentationUrl);
      assert.equal(`${docs.origin}${docs.pathname}`, entry.docs);
      assert.equal(docs.searchParams.get("utm_source"), "foundry");
      assert.equal(docs.searchParams.get("utm_medium"), "morelord_tools");
      assert.equal(docs.searchParams.get("utm_campaign"), entry.id);
      assert.equal(row.documentation, "Documentation");
      assert.equal(row.documentationLabel, `Documentation for ${row.title}`);
    } else {
      assert.equal(row.documentationUrl, "");
    }
  }
  assert.equal(rows.find(row => row.id === "morelord-core").documentationUrl.includes("/docs/morelord-core"), true);
  assert.equal(rows.find(row => row.id === "morelord-journeys").documentationUrl.includes("/docs/morelord-journeys"), true);
});

test("missing translations fall back to the module.json copy for players and GMs", () => {
  const context = morelordModulesContext(installed({}), { localize: key => key });
  assert.equal(context.title, "Morelord Modules");
  assert.equal(context.intro, lang["morelord-core.modules.intro"]);
  assert.equal(context.modules.length, 8);
  assert.equal(context.modules[0].statusLabel, "Not installed");
  assert.equal(context.modules[0].description, MORELORD_MODULE_CATALOG[0].description);
  assert.equal(context.supportHeading, "Support");
  assert.deepEqual(context.links.map(link => link.label), ["Get support", "Morelord Gaming", "YouTube"]);
  const [support, website, youtube] = context.links.map(link => new URL(link.url));
  assert.equal(`${support.origin}${support.pathname}`, MORELORD_DISCORD_INVITE);
  assert.equal(support.searchParams.get("utm_campaign"), "support");
  assert.equal(`${website.origin}${website.pathname}`, `${MORELORD_WEBSITE}/`);
  assert.equal(website.searchParams.get("utm_campaign"), "website");
  assert.equal(decodeURIComponent(`${youtube.origin}${youtube.pathname}`), MORELORD_YOUTUBE);
  assert.equal(youtube.searchParams.get("utm_campaign"), "youtube");
  for (const url of [support, website, youtube]) {
    assert.equal(url.searchParams.get("utm_source"), "foundry");
    assert.equal(url.searchParams.get("utm_medium"), "morelord_tools");
  }
  assert.match(template, /class="ml-app ml-app-shell ml-stack"/);
  assert.match(template, /\{\{supportHeading\}\}/);
  assert.match(template, /\{\{documentation\}\}/);
  assert.match(template, /class="ml-card ml-item-row"/);
  assert.match(template, /class="ml-status" data-tone="\{\{tone\}\}"/);
  assert.match(template, /target="_blank" rel="noopener noreferrer"/);
});

test("the info tool stays selected and opens Morelord Modules only when clicked", async () => {
  const registry = createToolsRegistry();
  registry.api.register({ id: "morelord-craftworks", title: "Craftworks", icon: "fa-solid fa-hammer", onClick() {} });
  const control = registry.buildSceneControl({});
  const renders = [];
  const instances = new Map();
  class ApplicationV2 {
    render(options) {
      instances.set(this.constructor.DEFAULT_OPTIONS.id, this);
      renders.push(this);
      this.options = options;
      return this;
    }
  }
  globalThis.foundry = {
    applications: {
      api: { ApplicationV2, HandlebarsApplicationMixin: Base => class extends Base {} },
      instances
    }
  };
  globalThis.game = {
    user: { isGM: false },
    modules: installed({ "morelord-core": { active: true } }),
    i18n: { localize: key => lang[key] ?? key, format: (key, data) => lang[key].replace("{title}", data.title) }
  };
  try {
    control.tools.morelordHome.onChange({}, true);
    control.tools.morelordCraftworks.onChange({}, true);
    assert.equal(renders.length, 0);
    assert.equal(control.activeTool, "morelordHome");
    assert.equal(control.tools.morelordHome.button, undefined);
    const listeners = [];
    const button = { dataset: {}, addEventListener(_type, fn) { listeners.push(fn); } };
    const element = { querySelector: selector => selector === 'button[data-tool="morelordHome"]' ? button : null };
    bindMorelordModulesButton(null, element);
    bindMorelordModulesButton(null, element);
    assert.equal(listeners.length, 1);
    await listeners[0]();
    await listeners[0]();
    assert.equal(renders.length, 2);
    assert.equal(renders[0], renders[1]);
    assert.deepEqual(renders[0].options, { force: true });
    assert.deepEqual(renders[0].constructor.DEFAULT_OPTIONS.classes, ["ml-window"]);
    assert.equal(renders[0].constructor.DEFAULT_OPTIONS.window.title, MORELORD_MODULES_APP.window.title);
    assert.equal(renders[0].constructor.PARTS.content.template, MORELORD_MODULES_APP.template);
    const context = await renders[0]._prepareContext();
    assert.equal(context.title, "Morelord Modules");
    assert.equal(context.modules.find(row => row.id === "morelord-core").state, "active");
    assert.equal(context.modules.find(row => row.id === "morelord-downtime").state, "missing");
    await openMorelordModules();
    assert.equal(renders.length, 3);
  } finally {
    delete globalThis.foundry;
    delete globalThis.game;
  }
});
