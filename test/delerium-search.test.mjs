import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { deleriumSearch } from "../scripts/services/delerium-search.js";
import {
  DeleriumSearchResultsApp,
  openMorelordEncounters
} from "../scripts/ui/delerium-search-results-app.js";

const root = new URL("../", import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}

function restoreGlobals(keys) {
  const previous = new Map(keys.map(key => [key, globalThis[key]]));
  return () => {
    for (const [key, value] of previous) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  };
}

function modules(activeIds = []) {
  const active = new Set(activeIds);
  return { get: id => ({ id, active: active.has(id) }) };
}

function item(id, name, collection, img = `${id}.webp`) {
  const document = {
    _id: id,
    uuid: `Compendium.${collection}.Item.${id}`,
    name,
    img,
    system: { rarity: "rare" },
    toObject() {
      return { _id: this._id, name: this.name, img: this.img, system: { ...this.system }, flags: {} };
    }
  };
  return document;
}

function compendium(collection, documents, { packageName, calls } = {}) {
  const [fallbackPackage] = collection.split(".");
  return {
    collection,
    documentName: "Item",
    metadata: { packageName: packageName ?? fallbackPackage, id: collection },
    async getIndex() {
      calls?.push(collection);
      return documents.map(entry => ({ _id: entry._id, uuid: entry.uuid, name: entry.indexName ?? entry.name, img: entry.img }));
    },
    async getDocument(id) {
      return documents.find(entry => entry._id === id) ?? null;
    }
  };
}

describe("Delerium Search", { concurrency: 1 }, () => {
  test("available follows only the three Drakkenheim modules", () => {
    assert.equal(deleriumSearch.available({ modules: modules([]) }), false);
    assert.equal(deleriumSearch.available({ modules: modules(["morelord-craftworks"]) }), false);
    assert.equal(deleriumSearch.available({ modules: modules(["monsters-of-drakkenheim"]) }), false);
    assert.equal(deleriumSearch.available({ modules: modules(["drakkenheim-core"]) }), true);
    assert.equal(deleriumSearch.available({ modules: modules(["drakkenheim-monsters"]) }), true);
    assert.equal(deleriumSearch.available({ modules: modules(["drakkenheim-scgd"]) }), true);
    assert.equal(deleriumSearch.available({ modules: { get: () => ({ active: false }) } }), false);
    assert.equal(deleriumSearch.available({}), false);
  });

  test("zones and skills are copies of the 2024 search data", () => {
    const zones = deleriumSearch.getZones();
    const skills = deleriumSearch.getSkillOptions();
    assert.deepEqual(zones, [
      { id: "outer", name: "Outer City", dc: 15 },
      { id: "inner", name: "Inner City", dc: 20 }
    ]);
    assert.deepEqual(skills, [
      { id: "arc", label: "Arcana" },
      { id: "inv", label: "Investigation" },
      { id: "sur", label: "Survival" }
    ]);
    zones[0].dc = 1;
    skills[0].label = "Changed";
    assert.equal(deleriumSearch.getZones()[0].dc, 15);
    assert.equal(deleriumSearch.getSkillOptions()[0].label, "Arcana");
    assert.equal(Object.isFrozen(deleriumSearch), true);
  });

  test("start requires a Drakkenheim module, a known zone, and a scene", () => {
    const restore = restoreGlobals(["game", "canvas", "foundry"]);
    try {
      globalThis.canvas = { scene: { id: "scene-canvas", name: "Canvas Scene" } };
      globalThis.game = { user: { id: "gm-1" }, modules: modules([]) };
      assert.throws(() => deleriumSearch.start("outer"), { message: "Enable a Drakkenheim content module to search for delerium." });
      globalThis.game.modules = modules(["drakkenheim-core"]);
      assert.throws(() => deleriumSearch.start("deep"), { message: "Choose the Outer City or Inner City." });
      assert.throws(() => deleriumSearch.start("outer", { scene: null }), { message: "Delerium searching requires an active scene." });
      globalThis.foundry = { utils: { randomID: () => "generated-id" } };
      const supplied = deleriumSearch.start("inner", { scene: { id: "scene-inner", name: "Inner Gate" }, id: "fixed-id" });
      assert.equal(supplied.id, "fixed-id");
      assert.equal(supplied.sceneId, "scene-inner");
      assert.equal(supplied.zone.dc, 20);
      const session = deleriumSearch.start("outer");
      assert.equal(session.id, "generated-id");
      assert.equal(session.type, "delerium-search");
      assert.equal(session.status, "open");
      assert.equal(typeof session.createdAt, "number");
      assert.equal(session.gmUserId, "gm-1");
      assert.equal(session.sceneId, "scene-canvas");
      assert.equal(session.sceneName, "Canvas Scene");
      assert.deepEqual(session.zone, { id: "outer", name: "Outer City", dc: 15 });
      assert.equal(session.durationHours, 1);
      assert.equal(session.distanceMiles, 0.25);
      assert.deepEqual(session.participants, {});
      assert.equal(session.successes, 0);
      assert.equal(session.failures, 0);
      assert.deepEqual(session.results, []);
      assert.deepEqual(session.selectedCharacterUuids, []);
      assert.equal(session.messageMode, null);
      session.zone.dc = 1;
      assert.equal(deleriumSearch.getZones()[0].dc, 15);
    } finally {
      restore();
    }
  });

  test("attempt scores a natural 20, a margin of 5, a normal pass, and a failure; decline adds none", () => {
    const restore = restoreGlobals(["game", "canvas"]);
    try {
      globalThis.game = { user: { id: "gm-1" }, modules: modules(["drakkenheim-monsters"]) };
      globalThis.canvas = { scene: { id: "scene", name: "Ruins" } };
      const inner = deleriumSearch.start("inner", { id: "inner" });
      const natural = deleriumSearch.attempt(inner, { userId: "a", actorUuid: "Actor.a", skillId: "arc", total: 8, naturalD20: 20 });
      assert.deepEqual(natural, {
        userId: "a", actorUuid: "Actor.a", skillId: "arc", total: 8, naturalD20: 20, successes: 2, status: "succeeded"
      });
      assert.equal(inner.successes, 2);
      assert.equal(inner.failures, 0);
      const margin = deleriumSearch.attempt(inner, { userId: "b", actorUuid: "Actor.b", skillId: "inv", total: 25, naturalD20: 11 });
      assert.equal(margin.successes, 2);
      assert.equal(margin.naturalD20, null);
      const normal = deleriumSearch.attempt(inner, { userId: "c", actorUuid: "Actor.c", skillId: "sur", total: 20, naturalD20: 15 });
      assert.equal(normal.successes, 1);
      assert.equal(inner.successes, 5);
      const missed = deleriumSearch.attempt(inner, { userId: "d", actorUuid: "Actor.d", skillId: "arc", total: 19, naturalD20: 19 });
      assert.equal(missed.successes, 0);
      assert.equal(missed.status, "failed");
      assert.equal(inner.failures, 1);
      const declined = deleriumSearch.decline(inner, { userId: "e", actorUuid: "Actor.e" });
      assert.deepEqual(declined, { userId: "e", actorUuid: "Actor.e", status: "declined", successes: 0 });
      assert.equal(inner.failures, 1);
      assert.equal(inner.successes, 5);
      assert.throws(() => deleriumSearch.attempt(inner, { userId: "a", actorUuid: "Actor.a", skillId: "arc", total: 30, naturalD20: 20 }), { message: "That player's search check is already resolved." });
      assert.throws(() => deleriumSearch.decline(inner, { userId: "e", actorUuid: "Actor.e" }), { message: "That player's search check is already resolved." });
      assert.throws(() => deleriumSearch.attempt(inner, { userId: "f", skillId: "prc", total: 30, naturalD20: 18 }), { message: "Choose Arcana, Investigation, or Survival." });
      const boolFace = deleriumSearch.attempt(inner, { userId: "g", actorUuid: "Actor.g", skillId: "inv", total: 10, naturalD20: true });
      assert.equal(boolFace.successes, 0);
      assert.equal(boolFace.naturalD20, null);
      assert.equal(inner.failures, 2);
      const outer = deleriumSearch.start("outer", { id: "outer" });
      assert.equal(deleriumSearch.attempt(outer, { userId: "edge", skillId: "sur", total: 19, naturalD20: 12 }).successes, 1);
      assert.equal(deleriumSearch.attempt(outer, { userId: "beat", skillId: "sur", total: 20, naturalD20: 12 }).successes, 2);
      assert.throws(() => deleriumSearch.attempt(null, { userId: "a", skillId: "arc", total: 20 }), { message: "Delerium search session not found." });
      outer.status = "complete";
      assert.throws(() => deleriumSearch.decline(outer, { userId: "z" }), { message: "This delerium search is no longer open." });
    } finally {
      restore();
    }
  });

  test("rewards are cumulative, encounters do not cancel them, and blind mode reaches the roll and the card", async () => {
    const chip = item("Chip", "Delerium Chip", "drakkenheim-monsters.items");
    const fragment = item("Fragment", "Delerium Fragment", "drakkenheim-monsters.items");
    const shard = item("Shard", "Delerium Shard", "drakkenheim-monsters.items");
    const documents = [chip, fragment, shard];
    const official = compendium("drakkenheim-monsters.items", documents);
    const decoyCalls = [];
    const decoy = compendium("dnd5e.equipment", documents.map(entry => ({ ...entry, _id: `decoy-${entry._id}` })), { packageName: "dnd5e", calls: decoyCalls });
    decoy.getDocument = async () => { throw new Error("Wrong source module"); };
    const character = {
      uuid: "Actor.character", type: "character", name: "A&B <C>",
      async createEmbeddedDocuments(_type, [data]) {
        deliveries.push(data);
        return [{ uuid: `Actor.character.Item.${data.name}` }];
      }
    };
    const group = { uuid: "Actor.party", type: "group", name: "Party", async createEmbeddedDocuments() { return [{ uuid: "Actor.party.Item.reward" }]; } };
    const lookup = new Map([[character.uuid, character], [group.uuid, group], ...documents.map(entry => [entry.uuid, entry])]);
    const formulas = [];
    const posts = [];
    let deliveries = [];
    const restore = restoreGlobals(["game", "fromUuid", "Roll", "ChatMessage", "dnd5e"]);
    globalThis.game = {
      system: { id: "dnd5e" },
      packs: [decoy, official],
      modules: modules(["drakkenheim-scgd"]),
      settings: { get: (namespace, key) => namespace === "dnd5e" && key === "rulesVersion" ? "modern" : {} }
    };
    delete globalThis.dnd5e;
    globalThis.fromUuid = async uuid => lookup.get(uuid) ?? null;
    globalThis.Roll = class {
      constructor(formula) { this.formula = formula; formulas.push(formula); this.total = formula === "1" ? 1 : formula === "1d6" ? 6 : 8; }
      async evaluate() { return this; }
      async toMessage(data, options) { posts.push({ kind: "roll", data, options }); }
    };
    globalThis.ChatMessage = {
      getSpeaker: ({ actor }) => ({ actor: actor.uuid }),
      async create(data, options) { posts.push({ kind: "card", data, options }); return data; }
    };
    try {
      for (const [successes, count] of [[2, 0], [3, 1], [4, 2], [5, 3], [8, 3]]) {
        formulas.length = 0;
        posts.length = 0;
        deliveries = [];
        const session = { id: `table-${successes}`, status: "open", successes, failures: 2, results: [], zone: { dc: 15 } };
        await deleriumSearch.finalize(session);
        assert.equal(session.randomEncounter, true);
        assert.equal(session.status, "complete");
        assert.equal(typeof session.completedAt, "number");
        assert.equal(session.result, null);
        assert.deepEqual(session.rewards.map(reward => reward.formula), ["3d6", "1d6", "1"].slice(0, count));
        assert.deepEqual(session.rewards.map(reward => reward.name), ["Delerium Chip", "Delerium Fragment", "Delerium Shard"].slice(0, count));
        assert.deepEqual(session.rewards.map(reward => reward.rarity), Array(count).fill("rare"));
        if (!count) {
          await assert.rejects(deleriumSearch.rollAndAward(session, character.uuid), { message: "This search did not find any delerium to award." });
          assert.deepEqual(formulas, []);
          continue;
        }
        const recipient = successes === 4 ? group : character;
        session.messageMode = successes === 3 ? "blind" : null;
        const result = await deleriumSearch.rollAndAward(session, recipient.uuid);
        assert.equal(result, session.result);
        assert.deepEqual(formulas, ["3d6", "1d6", "1"].slice(0, count));
        assert.equal(session.result.recipientUuid, recipient.uuid);
        assert.equal(session.result.items.length, count);
        assert.deepEqual(session.result.items.map(entry => entry.quantity), [8, 6, 1].slice(0, count));
        assert.equal(posts.filter(entry => entry.kind === "card").length, 1);
        assert.match(posts.find(entry => entry.kind === "card").data.content, /<section class="ml-chat-card ml-stack"><h3>Delerium Found<\/h3>/);
        assert.equal(posts.find(entry => entry.kind === "card").data.content.includes("ml-craftworks"), false);
        if (successes === 3) {
          assert.equal(posts.length, 2);
          assert.ok(posts.every(entry => entry.options.messageMode === "blind"));
          assert.equal(posts[0].data.flavor, "Delerium Search — Delerium Chip");
          assert.deepEqual(posts[0].data.speaker, { actor: character.uuid });
          assert.match(posts[1].data.content, /Awarded to A&amp;B &lt;C&gt;/);
          assert.equal(deliveries[0]._id, undefined);
          assert.equal(deliveries[0].system.quantity, 8);
          assert.equal(chip.system.quantity, undefined);
          assert.equal(chip._id, "Chip");
        } else {
          assert.ok(posts.every(entry => Object.keys(entry.options).length === 0));
        }
        await assert.rejects(deleriumSearch.rollAndAward(session, recipient.uuid), { message: "This search result has already been awarded." });
      }
      assert.deepEqual(decoyCalls, []);
      const quiet = { id: "quiet", status: "open", successes: 5, failures: 1, results: [] };
      await deleriumSearch.finalize(quiet);
      assert.equal(quiet.randomEncounter, false);
      assert.equal(quiet.rewards.length, 3);
    } finally {
      restore();
    }
  });

  test("a failed delivery resumes for the same recipient without rerolling, and a different recipient is rejected", async () => {
    const documents = ["Chip", "Fragment", "Shard"].map(name => item(name, `Delerium ${name}`, "drakkenheim-monsters.items"));
    const official = compendium("drakkenheim-monsters.items", documents);
    const party = { uuid: "Actor.party", type: "group", name: "Party" };
    const other = { uuid: "Actor.other", type: "character", name: "Other" };
    let failFragment = true;
    const deliveries = [];
    party.createEmbeddedDocuments = async (_type, [data]) => {
      if (failFragment && data.name === "Delerium Fragment") {
        failFragment = false;
        throw new Error("Delivery failed");
      }
      deliveries.push(data.name);
      return [{ uuid: `Actor.party.Item.${data.name}` }];
    };
    const formulas = [];
    const options = [];
    const restore = restoreGlobals(["game", "fromUuid", "Roll", "ChatMessage", "dnd5e"]);
    globalThis.game = {
      system: { id: "dnd5e" },
      packs: [official],
      settings: { get: () => ({}) }
    };
    delete globalThis.dnd5e;
    globalThis.fromUuid = async uuid => [party, other, ...documents].find(entry => entry.uuid === uuid) ?? null;
    globalThis.Roll = class {
      constructor(formula) { this.formula = formula; formulas.push(formula); this.total = formula === "1" ? 1 : formula === "1d6" ? 6 : 8; }
      async evaluate() { return this; }
      async toMessage(_data, messageOptions) { options.push(messageOptions); }
    };
    globalThis.ChatMessage = {
      getSpeaker: () => ({ alias: "Party" }),
      async create(_data, messageOptions) { options.push(messageOptions); return {}; }
    };
    try {
      const session = { id: "resume", status: "open", successes: 5, failures: 2, results: [], messageMode: "blind" };
      await deleriumSearch.finalize(session);
      await assert.rejects(deleriumSearch.rollAndAward(session, party.uuid), /Delivery failed/);
      assert.equal(session.results.length, 1);
      assert.equal(session.rewards[0].quantity, 8);
      assert.equal(session.rewards[1].quantity, 6);
      assert.equal(session.result, null);
      await assert.rejects(deleriumSearch.rollAndAward(session, other.uuid), { message: "Finish awarding this search to the original recipient." });
      await deleriumSearch.rollAndAward(session, party.uuid);
      assert.deepEqual(formulas, ["3d6", "1d6", "1"]);
      assert.deepEqual(deliveries, ["Delerium Chip", "Delerium Fragment", "Delerium Shard"]);
      assert.deepEqual(options, [{ messageMode: "blind" }, { messageMode: "blind" }, { messageMode: "blind" }, { messageMode: "blind" }]);
      assert.equal(session.result.items.length, 3);
      assert.equal(session.randomEncounter, true);
    } finally {
      restore();
    }
  });

  test("Configure Sources rejects a pack, and a disallowed stored uuid is resolved by name", async () => {
    const calls = [];
    const rejectedChip = item("Rejected", "Delerium Chip", "drakkenheim-monsters.rejected", "rejected.webp");
    rejectedChip.indexName = " delerium chip ";
    const allowedChip = item("Allowed", "Delerium Chip", "drakkenheim-monsters.items", "allowed.webp");
    allowedChip.indexName = "DELERIUM CHIP";
    const prefixed = item("Prefixed", "Delerium Fragment", "drakkenheim-monsters.relics", "prefixed.webp");
    const renamed = item("Renamed", "Delerium Shard", "world.delerium", "renamed.webp");
    const configuration = { "drakkenheim-monsters.rejected": false };
    const rejected = compendium("drakkenheim-monsters.rejected", [rejectedChip], { calls });
    const allowed = compendium("drakkenheim-monsters.items", [allowedChip]);
    const byCollection = compendium("drakkenheim-monsters.relics", [prefixed], { packageName: "world" });
    const byPackage = compendium("world.delerium", [renamed], { packageName: "drakkenheim-monsters" });
    const restore = restoreGlobals(["game", "fromUuid", "Roll", "ChatMessage", "dnd5e"]);
    globalThis.game = {
      system: { id: "dnd5e" },
      packs: [rejected, allowed, byCollection, byPackage],
      settings: {
        get(namespace, key) {
          if (namespace === "dnd5e" && key === "packSourceConfiguration") return configuration;
          if (namespace === "dnd5e" && key === "rulesVersion") return "modern";
          return {};
        }
      }
    };
    delete globalThis.dnd5e;
    const character = { uuid: "Actor.hero", type: "character", name: "Hero", async createEmbeddedDocuments(_type, [data]) { return [{ uuid: "Actor.hero.Item.chip", data }]; } };
    globalThis.fromUuid = async uuid => {
      if (uuid === rejectedChip.uuid) throw new Error("disallowed uuid loaded");
      if (uuid === character.uuid) return character;
      return [allowedChip, prefixed, renamed].find(entry => entry.uuid === uuid) ?? null;
    };
    globalThis.Roll = class {
      constructor() { this.total = 4; }
      async evaluate() { return this; }
      async toMessage() {}
    };
    globalThis.ChatMessage = { getSpeaker: () => ({}), async create() { return {}; } };
    try {
      const session = { id: "sources", status: "open", successes: 5, failures: 0, results: [] };
      await deleriumSearch.finalize(session);
      assert.deepEqual(calls, []);
      assert.deepEqual(session.rewards.map(reward => reward.sourceUuid), [allowedChip.uuid, prefixed.uuid, renamed.uuid]);
      assert.deepEqual(session.rewards.map(reward => reward.name), ["Delerium Chip", "Delerium Fragment", "Delerium Shard"]);
      const direct = { ...session, id: "direct", rewards: session.rewards.map(reward => ({ ...reward })), results: [] };
      direct.rewards.splice(1);
      await deleriumSearch.rollAndAward(direct, character.uuid);
      assert.equal(direct.results[0].sourceUuid, allowedChip.uuid);
      configuration["drakkenheim-monsters.items"] = false;
      configuration["drakkenheim-monsters.relics"] = false;
      configuration["world.delerium"] = false;
      const blocked = { id: "blocked", status: "complete", successes: 3, failures: 0, results: [], rewards: [{ ...session.rewards[0] }] };
      await assert.rejects(deleriumSearch.rollAndAward(blocked, character.uuid), { message: "Delerium Chip is no longer available in the enabled compendiums." });
      configuration["drakkenheim-monsters.items"] = true;
      const moved = { id: "moved", status: "complete", successes: 3, failures: 0, results: [], rewards: [{ sourceUuid: rejectedChip.uuid, name: "Delerium Chip", formula: "3d6" }] };
      await deleriumSearch.rollAndAward(moved, character.uuid);
      assert.equal(moved.results[0].sourceUuid, allowedChip.uuid);
      assert.equal(moved.results[0].img, "allowed.webp");
      const incomplete = { id: "missing-fragment", status: "open", successes: 5, failures: 0, results: [] };
      configuration["drakkenheim-monsters.relics"] = false;
      await assert.rejects(deleriumSearch.finalize(incomplete), { message: "Delerium Fragment was not found in the enabled Monsters of Drakkenheim Item compendiums." });
      assert.equal(incomplete.status, "open");
      assert.equal(incomplete.rewards, undefined);
    } finally {
      restore();
    }
  });

  test("award checks reject the wrong state, a bad recipient, and a second in-flight award", async () => {
    const chip = item("Chip", "Delerium Chip", "drakkenheim-monsters.items");
    const character = { uuid: "Actor.character", type: "character", name: "Hero" };
    const npc = { uuid: "Actor.npc", type: "npc", name: "Goblin" };
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    character.createEmbeddedDocuments = () => gate.then(() => [{ uuid: "Actor.character.Item.chip" }]);
    const restore = restoreGlobals(["game", "fromUuid", "Roll", "ChatMessage", "dnd5e"]);
    globalThis.game = { system: { id: "dnd5e" }, packs: [compendium("drakkenheim-monsters.items", [chip])], settings: { get: () => ({}) } };
    delete globalThis.dnd5e;
    globalThis.fromUuid = async uuid => [chip, character, npc].find(entry => entry.uuid === uuid) ?? null;
    globalThis.Roll = class { constructor() { this.total = 2; } async evaluate() { return this; } async toMessage() {} };
    globalThis.ChatMessage = { getSpeaker: () => ({}), async create() { return {}; } };
    try {
      await assert.rejects(deleriumSearch.rollAndAward(null, character.uuid), { message: "Delerium search session not found." });
      const open = { id: "still-open", status: "open", rewards: [{ name: "Delerium Chip" }], results: [] };
      await assert.rejects(deleriumSearch.rollAndAward(open, character.uuid), { message: "Finalize the delerium search before awarding its result." });
      const session = { id: "award-lock", status: "open", successes: 3, failures: 0, results: [] };
      await deleriumSearch.finalize(session);
      await assert.rejects(deleriumSearch.rollAndAward(session, npc.uuid), { message: "Choose a valid party or character recipient." });
      await assert.rejects(deleriumSearch.rollAndAward(session, ""), { message: "Choose a valid party or character recipient." });
      const pending = deleriumSearch.rollAndAward(session, character.uuid);
      await assert.rejects(deleriumSearch.rollAndAward(session, character.uuid), { message: "This search is already being awarded." });
      release();
      await pending;
      assert.equal(session.result.items[0].quantity, 2);
    } finally {
      release();
      restore();
    }
  });

  test("the results window uses Core markup, recipient order, and the Encounters handoff", async () => {
    const template = read("templates/delerium-search-results.hbs");
    const appSource = read("scripts/ui/delerium-search-results-app.js");
    assert.equal(DeleriumSearchResultsApp.DEFAULT_OPTIONS.id, "morelord-core-delerium-search-results");
    assert.deepEqual(DeleriumSearchResultsApp.DEFAULT_OPTIONS.classes, ["ml-window"]);
    assert.match(appSource, /id: "morelord-core-delerium-search-results"/);
    assert.equal(appSource.includes("ml-craftworks"), false);
    assert.match(template, /^<section class="ml-app ml-app-shell">/);
    assert.match(template, /class="ml-form-footer ml-page-footer"/);
    assert.match(template, /Roll &amp; Award All Delerium/);
    assert.match(template, /Open Morelord Encounters/);
    assert.match(template, /Get Morelord Encounters/);
    assert.match(template, /\{\{encountersProductUrl\}\}/);
    assert.equal(template.includes("ml-craftworks"), false);
    assert.match(template, /\{\{#unless canAward\}\}disabled\{\{\/unless\}\}/);

    const cal = { uuid: "Actor.cal", name: "Cal", type: "character", hasPlayerOwner: false };
    const ada = { uuid: "Actor.ada", name: "Ada", type: "character", hasPlayerOwner: true };
    const bea = { uuid: "Actor.bea", name: "Bea", type: "character", hasPlayerOwner: true };
    const dee = { uuid: "Actor.dee", name: "Dee", type: "character", hasPlayerOwner: false };
    const npc = { uuid: "Actor.npc", name: "Goblin", type: "npc" };
    const camp = { uuid: "Actor.camp", name: "Camp", type: "group", system: {} };
    const party = { uuid: "Actor.party", name: "Party", type: "group", system: { members: [cal] } };
    const restore = restoreGlobals(["game", "ui", "foundry"]);
    const warnings = [];
    const errors = [];
    globalThis.ui = { notifications: { warn: message => warnings.push(message), error: message => errors.push(message) } };
    globalThis.game = {
      users: [],
      actors: [dee, npc, party, ada, camp, bea, cal],
      modules: { get: id => id === "morelord-encounters" ? { id, active: true, api: {} } : undefined }
    };
    try {
      const session = {
        id: "results", type: "delerium-search", status: "complete", successes: 4, failures: 2, randomEncounter: true,
        zone: { id: "outer", name: "Outer City", dc: 15 },
        participants: { first: { actorUuid: null }, second: { actorUuid: "Actor.cal" } },
        rewards: [{ sourceUuid: "Compendium.drakkenheim-monsters.items.Item.Chip", name: "Delerium Chip", img: "chip.webp", formula: "3d6" }],
        results: []
      };
      const app = new DeleriumSearchResultsApp({ session, award: async () => session, defaultRecipientUuid: "Actor.bea" });
      const context = await app._prepareContext();
      assert.deepEqual(context.recipients.map(entry => entry.name), [
        "Camp (Group Inventory)", "Party (Group Inventory)", "Ada", "Bea", "Cal"
      ]);
      assert.equal(context.recipients.find(entry => entry.selected).uuid, "Actor.bea");
      assert.equal(context.encounterTitle, "Random Encounter Required");
      assert.match(context.encounterText, /Two or more characters failed/);
      assert.equal(context.canAward, true);
      assert.equal(context.encountersActive, true);
      assert.equal(context.encountersProductUrl, "https://morelord.com/products/morelord-encounters");
      app.selectedRecipientUuid = "Actor.ada";
      assert.equal((await app._prepareContext()).recipients.find(entry => entry.selected).uuid, "Actor.ada");

      const participant = new DeleriumSearchResultsApp({ session, award: async () => session });
      assert.equal((await participant._prepareContext()).recipients.find(entry => entry.selected).uuid, "Actor.cal");
      const missing = new DeleriumSearchResultsApp({
        session: { ...session, participants: { first: { actorUuid: "Actor.missing" } } },
        award: async () => session
      });
      assert.equal((await missing._prepareContext()).recipients.find(entry => entry.selected).uuid, "Actor.camp");

      globalThis.game.modules = { get: id => id === "morelord-encounters" ? { id, active: false } : undefined };
      const inactive = await app._prepareContext();
      assert.equal(inactive.encountersActive, false);
      assert.match(inactive.encountersUnavailableText, /installed but not active/);
      globalThis.game.modules = { get: () => undefined };
      const absent = await app._prepareContext();
      assert.equal(absent.encountersInstalled, false);
      assert.match(absent.encountersUnavailableText, /Install Morelord Encounters/);
      session.randomEncounter = false;
      session.result = { items: [{ sourceUuid: "item", name: "Delerium Chip", img: "chip.webp", quantity: 8, recipientName: "Bea" }], recipientName: "Bea", recipientUuid: "Actor.bea" };
      const awarded = await app._prepareContext();
      assert.equal(awarded.encounterTitle, "No Random Encounter");
      assert.equal(awarded.canAward, false);
      assert.equal(awarded.hasResult, true);
      session.rewards = [];
      session.result = null;
      session.randomEncounter = false;
      assert.equal((await app._prepareContext()).canAward, false);

      const builderCalls = [];
      await openMorelordEncounters({
        modules: { get: () => ({ active: true, api: { openEncounterBuilder() { builderCalls.push("builder"); }, open() { builderCalls.push("open"); } } }) }
      }, () => { throw new Error("imported"); });
      await openMorelordEncounters({
        modules: { get: () => ({ active: true, api: { open() { builderCalls.push("open"); } } }) }
      }, () => { throw new Error("imported"); });
      let loaded;
      globalThis.foundry = { utils: { getRoute: path => `foundry://${path}` } };
      await openMorelordEncounters({ modules: { get: () => ({ active: true, api: {} }) } }, async url => {
        loaded = url;
        return { configureEncounter() { builderCalls.push("configure"); } };
      });
      assert.deepEqual(builderCalls, ["builder", "open", "configure"]);
      assert.equal(loaded, "foundry://modules/morelord-encounters/scripts/apps/encounter-builder-dialog.mjs");
      await assert.rejects(openMorelordEncounters({ modules: { get: () => ({ active: true, api: {} }) } }, async () => ({})), /does not expose its encounter builder/);
      await openMorelordEncounters({ modules: { get: () => undefined } });
      await openMorelordEncounters({ modules: { get: () => ({ active: false }) } });
      assert.match(warnings[0], /Install Morelord Encounters/);
      assert.match(warnings[1], /Enable Morelord Encounters/);

      const button = { disabled: false };
      let rendered = null;
      const updated = { ...session, id: "results", type: "delerium-search", result: { items: [], recipientName: "Ada", recipientUuid: "Actor.ada" } };
      const awarding = new DeleriumSearchResultsApp({ session, award: async uuid => { awarding.received = uuid; return updated; } });
      awarding.element = { querySelector: () => ({ value: "Actor.ada" }) };
      awarding.render = async options => { rendered = options; };
      await DeleriumSearchResultsApp.rollAward.call(awarding, { preventDefault() {} }, button);
      assert.equal(awarding.received, "Actor.ada");
      assert.equal(awarding.session, updated);
      assert.deepEqual(rendered, { force: true });
      awarding.award = async () => { throw new Error("Award failed"); };
      button.disabled = true;
      await DeleriumSearchResultsApp.rollAward.call(awarding, { preventDefault() {} }, button);
      assert.deepEqual(errors, ["Award failed"]);
      assert.equal(button.disabled, false);

      assert.throws(() => deleriumSearch.openResults(session, {}), { message: "Delerium search results require an award function." });
      const opened = await deleriumSearch.openResults(session, { award: async () => session, defaultRecipientUuid: "Actor.ada" });
      const reopened = await deleriumSearch.openResults(updated, { award: async () => updated });
      assert.equal(opened, reopened);
      assert.equal(reopened.session, updated);
      await reopened.close();
      const fresh = await deleriumSearch.openResults(session, { award: async () => session });
      assert.notEqual(fresh, reopened);
      await fresh.close();
    } finally {
      restore();
    }
  });

  test("Core publishes one deleriumSearch object on the module API", () => {
    const main = read("scripts/main.js");
    assert.match(main, /import \{ deleriumSearch \} from "\.\/services\/delerium-search\.js";/);
    assert.match(main, /api\.deleriumSearch = deleriumSearch;/);
    assert.match(main, /tools: toolsRegistry\.api,\s*deleriumSearch/);
    assert.match(main, /globalThis\.MorelordCore = api;/);
  });
});
