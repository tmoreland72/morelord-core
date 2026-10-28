import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { readFileSync } from "node:fs";
import {
  CONFIGURE_SOURCES_CHANGED,
  filterAllowed,
  getAllowedPack,
  getAllowedPacks,
  installConfigureSourcesWatcher,
  isPackAllowed,
  isSourceAllowed,
  isUuidAllowed,
  onConfigureSourcesChanged
} from "../scripts/services/allowed-packs.js";
import { Dnd5eSourceFilterService, getAllowedPack as exportedGetAllowedPack, getAllowedPacks as exportedGetAllowedPacks, isSourceAllowed as exportedIsSourceAllowed, isUuidAllowed as exportedIsUuidAllowed } from "../scripts/services/dnd5e-source-filter-service.js";

function pack(collection, documentName, metadata = {}) {
  const [packageName, name] = collection.split(".");
  return {
    collection,
    documentName,
    metadata: { packageName, name, id: collection, ...metadata }
  };
}

function rulesPack(collection, documentName, rulesVersion) {
  return pack(collection, documentName, { flags: { dnd5e: { rulesVersion } } });
}

function world({ packs, configuration = {}, systemId = "dnd5e", rulesVersion = "modern", actors, scenes, fromUuidSync }) {
  const previous = {
    game: globalThis.game,
    fromUuidSync: globalThis.fromUuidSync,
    Hooks: globalThis.Hooks,
    dnd5e: globalThis.dnd5e
  };
  globalThis.game = {
    packs,
    system: { id: systemId, packs: packs.filter(entry => entry.metadata.packageName === "dnd5e").map(entry => ({ id: entry.collection, name: entry.metadata.name, type: entry.documentName })) },
    settings: {
      get(namespace, key) {
        if (namespace === "dnd5e" && key === "packSourceConfiguration") return configuration;
        if (namespace === "dnd5e" && key === "rulesVersion") return rulesVersion;
        throw new Error(`Unexpected setting ${namespace}.${key}`);
      }
    },
    actors: { get: id => actors?.get?.(id) ?? null },
    scenes: { get: id => scenes?.get?.(id) ?? null }
  };
  if (fromUuidSync) globalThis.fromUuidSync = fromUuidSync;
  return () => {
    globalThis.game = previous.game;
    globalThis.fromUuidSync = previous.fromUuidSync;
    globalThis.Hooks = previous.Hooks;
    globalThis.dnd5e = previous.dnd5e;
  };
}

const systemPacks = [
  pack("dnd5e.monsters", "Actor"),
  pack("dnd5e.actors24", "Actor"),
  pack("dnd5e.spells24", "Item"),
  pack("dnd5e.rules", "JournalEntry")
];
const otherPacks = [
  pack("world.heroes", "Actor", { packageType: "world" }),
  pack("world.gear", "Item", { packageType: "world" }),
  pack("kobold.monsters", "Actor", { packageType: "module" }),
  pack("notes.journal", "JournalEntry", { packageType: "module" })
];

describe("Configure Sources allow-list", { concurrency: 1 }, () => {

test("Configure Sources is exclusion-based and does not guess short names", () => {
  const restore = world({
    packs: [...systemPacks, ...otherPacks],
    configuration: { "dnd5e.monsters": false, "dnd5e.actors24": true, "other.monsters": false, monsters: false }
  });
  try {
    assert.equal(isPackAllowed("dnd5e.monsters"), false);
    assert.equal(isPackAllowed("dnd5e.actors24"), true);
    assert.equal(isPackAllowed(pack("kobold.monsters", "Actor")), true);
    assert.equal(isPackAllowed(""), false);
    assert.equal(isPackAllowed(null), false);
    assert.deepEqual(
      getAllowedPacks({ documentName: "Actor" }).map(entry => entry.collection),
      ["dnd5e.actors24", "world.heroes", "kobold.monsters"]
    );
  } finally {
    restore();
  }
});

test("unchecking the System package excludes every system compendium and adds no SRD fallback", () => {
  const configuration = Object.fromEntries(systemPacks.map(entry => [entry.collection, false]));
  const restore = world({ packs: [...systemPacks, ...otherPacks], configuration });
  try {
    const allowed = getAllowedPacks().map(entry => entry.collection);
    assert.deepEqual(allowed, ["world.heroes", "world.gear", "kobold.monsters", "notes.journal"]);
    for (const id of ["dnd5e.monsters", "dnd5e.actors24", "dnd5e.spells24", "dnd5e.rules"]) {
      assert.equal(allowed.includes(id), false);
      assert.equal(isPackAllowed(id), false);
    }
    assert.equal(isUuidAllowed("Compendium.dnd5e.monsters.Actor.goblin"), false);
    assert.equal(isUuidAllowed("Compendium.dnd5e.monsters.goblin"), false);
    assert.equal(isUuidAllowed("Compendium.dnd5e.monsters.Actor.goblin.Item.scimitar"), false);
    assert.equal(isUuidAllowed("Compendium.kobold.monsters.Actor.dragon"), true);
    assert.deepEqual(getAllowedPacks({ documentName: "JournalEntry" }).map(entry => entry.collection), ["notes.journal"]);
  } finally {
    restore();
  }
});

test("a module picker can only narrow the allowed set", () => {
  const restore = world({
    packs: [...systemPacks, ...otherPacks],
    configuration: { "dnd5e.monsters": false }
  });
  try {
    const selected = ["dnd5e.monsters", "dnd5e.actors24", "kobold.monsters", "missing.pack"];
    const allowed = new Set(getAllowedPacks({ documentName: "Actor" }).map(entry => entry.collection));
    assert.deepEqual(selected.filter(id => allowed.has(id)), ["dnd5e.actors24", "kobold.monsters"]);
  } finally {
    restore();
  }
});

test("an unset Configure Sources entry follows the pack rulesVersion flag", () => {
  const packs = [
    rulesPack("dnd5e.monsters", "Actor", "legacy"),
    rulesPack("dnd5e.actors24", "Actor", "modern"),
    rulesPack("dnd5e.spells", "Item", "legacy"),
    pack("kobold.monsters", "Actor"),
    pack("notes.journal", "JournalEntry")
  ];
  const restore = world({ packs, rulesVersion: "modern" });
  try {
    assert.equal(isSourceAllowed("dnd5e.monsters"), false);
    assert.equal(isSourceAllowed(packs[1]), true);
    assert.equal(getAllowedPack("dnd5e.monsters"), null);
    assert.equal(getAllowedPack("dnd5e.actors24"), packs[1]);
    assert.deepEqual(getAllowedPacks({ documentName: "Actor" }).map(entry => entry.collection), ["dnd5e.actors24", "kobold.monsters"]);
    assert.deepEqual(getAllowedPacks({ documentName: "Item" }).map(entry => entry.collection), []);
    assert.deepEqual(getAllowedPacks({ documentName: "JournalEntry" }).map(entry => entry.collection), ["notes.journal"]);
    assert.equal(isUuidAllowed("Compendium.dnd5e.monsters.Actor.goblin"), false);
    assert.equal(isUuidAllowed("Compendium.dnd5e.actors24.Actor.wolf"), true);
    assert.equal(isUuidAllowed("Actor.worldHero"), true);
  } finally {
    restore();
  }

  const legacyWorld = world({ packs, rulesVersion: "legacy" });
  try {
    assert.equal(isSourceAllowed("dnd5e.monsters"), true);
    assert.equal(isSourceAllowed("dnd5e.actors24"), false);
    assert.equal(getAllowedPack("missing.pack"), null);
  } finally {
    legacyWorld();
  }
});

test("an explicit Configure Sources boolean overrides rulesVersion", () => {
  const monsters = rulesPack("dnd5e.monsters", "Actor", "legacy");
  const modern = rulesPack("dnd5e.actors24", "Actor", "modern");
  const restore = world({
    packs: [monsters, modern],
    configuration: { "dnd5e.monsters": true, "dnd5e.actors24": false },
    rulesVersion: "modern"
  });
  try {
    assert.equal(isSourceAllowed(monsters), true);
    assert.equal(isSourceAllowed(modern), false);
    assert.deepEqual(getAllowedPacks().map(entry => entry.collection), ["dnd5e.monsters"]);
  } finally {
    restore();
  }
});

test("uses dnd5e CompendiumBrowserSettingsConfig.isSourceEnabled when that method exists", () => {
  const legacy = rulesPack("dnd5e.monsters", "Actor", "legacy");
  const seen = [];
  const restore = world({ packs: [legacy], rulesVersion: "modern" });
  globalThis.dnd5e = {
    applications: {
      settings: {
        CompendiumBrowserSettingsConfig: {
          isSourceEnabled(candidate) {
            seen.push(candidate);
            return true;
          }
        }
      }
    }
  };
  try {
    assert.equal(isSourceAllowed(legacy), true);
    assert.equal(seen[0], legacy);
    assert.equal(new Dnd5eSourceFilterService().isPackEnabled(legacy), true);
  } finally {
    restore();
  }
});

test("compendium UUIDs follow the pack and other UUIDs stay allowed", () => {
  const actors = new Map();
  const referenced = {
    documentName: "Actor",
    uuid: "Compendium.dnd5e.monsters.Actor.goblin",
    name: "Goblin"
  };
  const imported = {
    documentName: "Actor",
    uuid: "Actor.imported",
    _stats: { compendiumSource: "Compendium.dnd5e.actors24.Actor.wolf" }
  };
  const flagged = {
    documentName: "Actor",
    uuid: "Actor.flagged",
    flags: { core: { sourceId: "Compendium.dnd5e.monsters.Actor.hobgoblin" } }
  };
  const granted = {
    documentName: "Actor",
    uuid: "Actor.granted",
    getFlag: (scope, key) => scope === "dnd5e" && key === "sourceId" ? "Compendium.dnd5e.spells24.Item.firebolt" : null
  };
  const native = { documentName: "Actor", uuid: "Actor.native", _stats: {}, name: "Hero" };
  const clone = {
    documentName: "Actor",
    uuid: "Actor.clone",
    _stats: { duplicateSource: "Actor.imported" }
  };
  const sword = { documentName: "Item", uuid: "Actor.imported.Item.sword", parent: imported };
  actors.set("imported", imported);
  actors.set("native", native);
  const token = {
    documentName: "Token",
    uuid: "Scene.scene.Token.token",
    actorId: "imported"
  };
  const restore = world({
    packs: systemPacks,
    configuration: {
      "dnd5e.monsters": false,
      "dnd5e.actors24": false,
      "dnd5e.spells24": false
    },
    actors,
    fromUuidSync: uuid => ({
      "Actor.ref": referenced,
      "Actor.imported": imported,
      "Actor.flagged": flagged,
      "Actor.granted": granted,
      "Actor.native": native,
      "Actor.clone": clone,
      "Actor.imported.Item.sword": sword,
      "Scene.scene.Token.token": token
    })[uuid] ?? null
  });
  try {
    assert.equal(isUuidAllowed("Actor.ref"), true);
    assert.equal(isUuidAllowed("Actor.imported"), true);
    assert.equal(isUuidAllowed("Actor.flagged"), true);
    assert.equal(isUuidAllowed("Actor.granted"), true);
    assert.equal(isUuidAllowed("Actor.clone"), true);
    assert.equal(isUuidAllowed("Actor.imported.Item.sword"), true);
    assert.equal(isUuidAllowed("Scene.scene.Token.token"), true);
    assert.equal(isUuidAllowed("Actor.native"), true);
    assert.equal(isUuidAllowed("Actor.missing"), true);
    assert.equal(isUuidAllowed("Compendium.dnd5e.monsters.Actor.goblin"), false);
    assert.equal(isUuidAllowed(""), false);
  } finally {
    restore();
  }
});

test("allows a world actor whose compendium reference is still enabled", () => {
  const restore = world({
    packs: systemPacks,
    configuration: { "dnd5e.monsters": false, "dnd5e.actors24": true },
    fromUuidSync: uuid => uuid === "Actor.wolf" ? {
      documentName: "Actor",
      uuid,
      _stats: { compendiumSource: "Compendium.dnd5e.actors24.Actor.wolf" }
    } : null
  });
  try {
    assert.equal(isUuidAllowed("Actor.wolf"), true);
  } finally {
    restore();
  }
});

test("filterAllowed keeps only entries whose pack and document identities are enabled", () => {
  const rows = [
    "dnd5e.actors24",
    "dnd5e.monsters",
    "Compendium.dnd5e.monsters.Actor.goblin",
    "Compendium.kobold.monsters.Actor.dragon",
    { uuid: "Actor.native", name: "Hero" },
    { uuid: "Actor.imported", sourceId: "dnd5e.actors24" },
    { uuid: "Compendium.kobold.monsters.Actor.dragon", packId: "dnd5e.monsters" },
    { collection: "notes.journal", documentName: "JournalEntry" },
    { name: "No source" }
  ];
  const before = rows.map(entry => entry);
  const restore = world({
    packs: [...systemPacks, ...otherPacks],
    configuration: { "dnd5e.monsters": false },
    fromUuidSync: uuid => {
      if (uuid === "Actor.native") return { documentName: "Actor", uuid, _stats: {} };
      if (uuid === "Actor.imported") return { documentName: "Actor", uuid, _stats: { compendiumSource: "Compendium.dnd5e.actors24.Actor.wolf" } };
      return null;
    }
  });
  try {
    assert.deepEqual(filterAllowed(rows), [
      "dnd5e.actors24",
      "Compendium.kobold.monsters.Actor.dragon",
      rows[4],
      rows[5],
      rows[7]
    ]);
    assert.deepEqual(rows, before);
    assert.deepEqual(filterAllowed("dnd5e.actors24"), []);
    assert.deepEqual(filterAllowed(null), []);
  } finally {
    restore();
  }
});

test("reads the live setting again when Configure Sources changes", () => {
  const configuration = { "dnd5e.monsters": false };
  const calls = [];
  const hooks = {
    on(event, callback) { this.handlers.push({ event, callback }); },
    callAll(event) { calls.push(event); },
    handlers: []
  };
  const restore = world({ packs: systemPacks, configuration });
  globalThis.Hooks = hooks;
  const stop = onConfigureSourcesChanged(() => calls.push("listener"));
  installConfigureSourcesWatcher(hooks);
  installConfigureSourcesWatcher(hooks);
  try {
    assert.equal(isPackAllowed("dnd5e.monsters"), false);
    hooks.handlers[0].callback({ key: "dnd5e.metricWeightUnits" });
    assert.deepEqual(calls, []);
    hooks.handlers[0].callback({ key: "dnd5e.rulesVersion" });
    assert.deepEqual(calls, ["listener", CONFIGURE_SOURCES_CHANGED]);
    calls.length = 0;
    configuration["dnd5e.monsters"] = true;
    hooks.handlers[0].callback({ key: "dnd5e.packSourceConfiguration" });
    assert.equal(isPackAllowed("dnd5e.monsters"), true);
    assert.deepEqual(getAllowedPacks({ documentName: "Actor" }).map(entry => entry.collection), ["dnd5e.monsters", "dnd5e.actors24"]);
    assert.deepEqual(calls, ["listener", CONFIGURE_SOURCES_CHANGED]);
    assert.equal(hooks.handlers.length, 1);
    stop();
    hooks.handlers[0].callback({ namespace: "dnd5e", key: "packSourceConfiguration" });
    assert.deepEqual(calls, ["listener", CONFIGURE_SOURCES_CHANGED, CONFIGURE_SOURCES_CHANGED]);
  } finally {
    stop();
    restore();
  }
});

test("does not apply Configure Sources outside dnd5e or when the setting cannot be read", () => {
  const restore = world({
    packs: [pack("dnd5e.monsters", "Actor")],
    configuration: { "dnd5e.monsters": false },
    systemId: "pf2e"
  });
  try {
    assert.equal(isPackAllowed("dnd5e.monsters"), true);
    assert.deepEqual(getAllowedPacks().map(entry => entry.collection), ["dnd5e.monsters"]);
  } finally {
    restore();
  }

  globalThis.game = {
    system: { id: "dnd5e" },
    packs: [pack("dnd5e.actors24", "Actor")],
    settings: { get() { throw new Error("not ready"); } }
  };
  try {
    assert.equal(isPackAllowed("dnd5e.actors24"), true);
    assert.deepEqual(getAllowedPacks(), [globalThis.game.packs[0]]);
    globalThis.game.packs = null;
    assert.deepEqual(getAllowedPacks(), []);
  } finally {
    delete globalThis.game;
  }
});

test("the existing source filter uses the same Configure Sources rule", () => {
  const packs = [
    pack("dnd5e.spells24", "Item", { label: "Spells" }),
    pack("world.copied-spells", "Item", { packageType: "world", label: "Spells" }),
    pack("kobold.monsters", "Actor", { label: "Bestiary" })
  ];
  const restore = world({ packs, configuration: { "dnd5e.spells24": false, "dnd5e.monsters": false } });
  const filter = new Dnd5eSourceFilterService();
  try {
    assert.equal(filter.isPackEnabled("dnd5e.spells24"), false);
    assert.equal(filter.isPackEnabled(packs[2]), true);
    assert.deepEqual(filter.configuration, { "dnd5e.spells24": false, "dnd5e.monsters": false });
    assert.deepEqual(filter.enabledPacks({ documentName: "Item" }).map(entry => entry.collection), ["world.copied-spells"]);
    assert.deepEqual(filter.enabledPacks({ documentName: "Item", includeWorld: false }), []);
    assert.equal(filter.isSourceEnabled("SRD 5.2", { itemType: "spell" }), false);
    assert.equal(filter.isSourceEnabled("Monster Manual"), true);
  } finally {
    restore();
  }
});

test("Core publishes the allowed-pack helpers", () => {
  const main = readFileSync(new URL("../scripts/main.js", import.meta.url), "utf8");
  for (const name of ["getAllowedPacks", "getAllowedPack", "isSourceAllowed", "isUuidAllowed", "filterAllowed", "onConfigureSourcesChanged", "configureSourcesChanged: CONFIGURE_SOURCES_CHANGED"]) {
    assert.equal(main.includes(name), true, name);
  }
  assert.equal(main.includes("installConfigureSourcesWatcher()"), true);
  assert.equal(CONFIGURE_SOURCES_CHANGED, "morelordCoreConfigureSourcesChanged");
  assert.equal(typeof exportedGetAllowedPacks, "function");
  assert.equal(typeof exportedGetAllowedPack, "function");
  assert.equal(typeof exportedIsSourceAllowed, "function");
  assert.equal(typeof exportedIsUuidAllowed, "function");
});

});
