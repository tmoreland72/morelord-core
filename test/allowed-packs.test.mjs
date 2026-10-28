import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { readFileSync } from "node:fs";
import {
  CONFIGURE_SOURCES_CHANGED,
  filterAllowed,
  getAllowedPacks,
  installConfigureSourcesWatcher,
  isPackAllowed,
  isUuidAllowed,
  onConfigureSourcesChanged
} from "../scripts/services/allowed-packs.js";
import { Dnd5eSourceFilterService } from "../scripts/services/dnd5e-source-filter-service.js";

function pack(collection, documentName, metadata = {}) {
  const [packageName, name] = collection.split(".");
  return {
    collection,
    documentName,
    metadata: { packageName, name, id: collection, ...metadata }
  };
}

function world({ packs, configuration = {}, systemId = "dnd5e", actors, scenes, fromUuidSync }) {
  const previous = {
    game: globalThis.game,
    fromUuidSync: globalThis.fromUuidSync,
    Hooks: globalThis.Hooks
  };
  globalThis.game = {
    packs,
    system: { id: systemId, packs: packs.filter(entry => entry.metadata.packageName === "dnd5e").map(entry => ({ id: entry.collection, name: entry.metadata.name, type: entry.documentName })) },
    settings: {
      get(namespace, key) {
        if (namespace === "dnd5e" && key === "packSourceConfiguration") return configuration;
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

test("rejects compendium references carried by world actors, items, and tokens", () => {
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
    assert.equal(isUuidAllowed("Actor.ref"), false);
    assert.equal(isUuidAllowed("Actor.imported"), false);
    assert.equal(isUuidAllowed("Actor.flagged"), false);
    assert.equal(isUuidAllowed("Actor.granted"), false);
    assert.equal(isUuidAllowed("Actor.clone"), false);
    assert.equal(isUuidAllowed("Actor.imported.Item.sword"), false);
    assert.equal(isUuidAllowed("Scene.scene.Token.token"), false);
    assert.equal(isUuidAllowed("Actor.native"), true);
    assert.equal(isUuidAllowed("Actor.missing"), false);
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
    hooks.handlers[0].callback({ key: "dnd5e.rulesVersion" });
    assert.deepEqual(calls, []);
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
  for (const name of ["getAllowedPacks", "isPackAllowed", "isUuidAllowed", "filterAllowed", "onConfigureSourcesChanged", "configureSourcesChanged: CONFIGURE_SOURCES_CHANGED"]) {
    assert.equal(main.includes(name), true, name);
  }
  assert.equal(main.includes("installConfigureSourcesWatcher()"), true);
  assert.equal(CONFIGURE_SOURCES_CHANGED, "morelordCoreConfigureSourcesChanged");
});

});
