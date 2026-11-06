import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { addItems } from "../scripts/services/inventory-service.js";

function actorWith(owned = []) {
  const items = owned.map(item => ({ ...item, system: { ...(item.system ?? {}) } }));
  const actor = {
    items,
    writes: [],
    creates: [],
    async updateEmbeddedDocuments(_type, updates) {
      actor.writes.push(structuredClone(updates));
      for (const update of updates) {
        const item = items.find(entry => entry.id === update._id);
        item.system.quantity = update["system.quantity"];
      }
    },
    async createEmbeddedDocuments(_type, data, options) {
      actor.creates.push({ data: structuredClone(data), options });
      const created = data.map((item, index) => ({
        ...structuredClone(item),
        id: item._id ?? `new-${items.length + index}`,
        uuid: `Actor.hero.Item.${item._id ?? items.length + index}`
      }));
      items.push(...created);
      return created;
    }
  };
  return actor;
}

const potion = (quantity, system = {}) => ({
  name: "Potion of Healing",
  type: "consumable",
  uuid: "Compendium.dnd5e.equipment24.Item.potion",
  system: { quantity, identified: true, attunement: "", uses: { max: 1, spent: 0 }, ...system }
});

test("compatible consumables and loot combine quantity once", async () => {
  const actor = actorWith([
    { id: "potion", uuid: "Actor.hero.Item.potion", name: "Potion of Healing", type: "consumable", _stats: { compendiumSource: potion().uuid }, flags: { core: { sourceId: potion().uuid } }, system: { quantity: 2, identified: true, attunement: "", uses: { max: 1, spent: 0 } } }
  ]);
  const input = potion(3);
  const snapshot = structuredClone(input);
  const first = await addItems(actor, [input, { name: "Rope", type: "loot", system: { quantity: 2 } }, { name: "Rope", type: "loot", system: { quantity: 4 } }]);
  assert.deepEqual(input, snapshot);
  assert.equal(actor.items.find(item => item.id === "potion").system.quantity, 5);
  assert.equal(actor.items.filter(item => item.name === "Rope").length, 1);
  assert.equal(actor.items.find(item => item.name === "Rope").system.quantity, 6);
  assert.equal(actor.creates.length, 1);
  assert.equal(actor.creates[0].options, undefined);
  assert.deepEqual(first.updated, [{ id: "potion", uuid: "Actor.hero.Item.potion", quantity: 5, previousQuantity: 2 }]);
  assert.equal(first.created.length, 1);

  const again = await addItems(actor, [potion(1)]);
  assert.equal(actor.items.filter(item => item.name === "Potion of Healing").length, 1);
  assert.equal(actor.items.find(item => item.id === "potion").system.quantity, 6);
  assert.deepEqual(again.created, []);
});

test("quantity-using equipment, weapons, and tools stack, and a copy without quantity stays separate", async () => {
  const actor = actorWith([]);
  await addItems(actor, [
    { name: "Torch", type: "equipment", system: { quantity: 2 } },
    { name: "Torch", type: "equipment", system: { quantity: 3 } },
    { name: "Dagger", type: "weapon", system: { quantity: 1, attunement: "" } },
    { name: "Dagger", type: "weapon", system: { quantity: 1, attunement: "" } },
    { name: "Smith's Tools", type: "tool", system: { quantity: 1 } },
    { name: "Cloak", type: "equipment" },
    { name: "Cloak", type: "equipment" }
  ]);
  assert.equal(actor.items.find(item => item.name === "Torch").system.quantity, 5);
  assert.equal(actor.items.filter(item => item.name === "Dagger").length, 1);
  assert.equal(actor.items.find(item => item.name === "Dagger").system.quantity, 2);
  assert.equal(actor.items.find(item => item.name === "Smith's Tools").system.quantity, 1);
  assert.equal(actor.items.filter(item => item.name === "Cloak").length, 2);
  assert.equal(actor.items.filter(item => item.type === "feat").length, 0);
  await addItems(actor, [{ name: "Alert", type: "feat" }, { name: "Alert", type: "feat" }]);
  assert.equal(actor.items.filter(item => item.name === "Alert").length, 2);
});

test("containers and items that differ in charges, identified, or attunement stay separate", async () => {
  const actor = actorWith([
    { id: "full", name: "Wand of Magic Missiles", type: "consumable", system: { quantity: 1, identified: true, uses: { max: 7, spent: 0 } } },
    { id: "bag", name: "Backpack", type: "container", system: { quantity: 1 } },
    { id: "packed", name: "Rope", type: "loot", system: { quantity: 9, container: "bag" } }
  ]);
  await addItems(actor, [
    { name: "Wand of Magic Missiles", type: "consumable", system: { quantity: 1, identified: true, uses: { max: 7, spent: 2 } } },
    { name: "Potion of Healing", type: "consumable", system: { quantity: 1, identified: true } },
    { name: "Potion of Healing", type: "consumable", system: { quantity: 1, identified: false } },
    { name: "Sword", type: "weapon", system: { quantity: 1, attunement: "" } },
    { name: "Sword", type: "weapon", system: { quantity: 1, attunement: "attuned" } },
    { name: "Sword", type: "weapon", system: { quantity: 1, attunement: "attuned", attuned: true } },
    { name: "Backpack", type: "container", system: { quantity: 1 } },
    { name: "Rope", type: "loot", system: { quantity: 2 } }
  ]);
  assert.equal(actor.items.filter(item => item.name === "Wand of Magic Missiles").length, 2);
  assert.equal(actor.items.find(item => item.id === "full").system.quantity, 1);
  assert.equal(actor.items.filter(item => item.name === "Potion of Healing").length, 2);
  assert.equal(actor.items.filter(item => item.name === "Sword" && item.system.attunement === "").length, 1);
  assert.equal(actor.items.filter(item => item.name === "Sword" && item.system.attunement === "attuned").length, 2);
  assert.equal(actor.items.filter(item => item.name === "Backpack").length, 2);
  assert.equal(actor.items.find(item => item.id === "packed").system.quantity, 9);
  assert.equal(actor.items.find(item => item.name === "Rope" && !item.system.container).system.quantity, 2);
});

test("a contained copy is not merged into a loose stack", async () => {
  const actor = actorWith([{ id: "rope", name: "Rope", type: "loot", system: { quantity: 4 } }]);
  await addItems(actor, [
    { _id: "bag", name: "Backpack", type: "container", system: { quantity: 1 } },
    { _id: "inside", name: "Rope", type: "loot", system: { quantity: 1, container: "bag" } }
  ]);
  assert.equal(actor.items.find(item => item.id === "rope").system.quantity, 4);
  assert.equal(actor.creates.length, 1);
  assert.deepEqual(actor.creates[0].options, { keepId: true });
  assert.deepEqual(actor.creates[0].data.map(item => item._id), ["bag", "inside"]);
});

test("compound container preparation is granted once, and a failed preparation writes nothing", async t => {
  const previous = globalThis.CONFIG;
  t.after(() => { globalThis.CONFIG = previous; });
  const source = {
    name: "Explorer's Pack",
    type: "container",
    system: { quantity: 4 },
    toObject() { return { _id: "pack", name: "Explorer's Pack", type: "container", system: { quantity: 4 } }; }
  };
  globalThis.CONFIG = { Item: { documentClass: { async createWithContents(items) {
    assert.equal(items.length, 1);
    assert.equal(items[0], source);
    return [
      { _id: "pack-1", name: "Explorer's Pack", type: "container", system: { quantity: 1 } },
      { _id: "rope-1", name: "Rope", type: "loot", system: { quantity: 10, container: "pack-1" } }
    ];
  } } } };
  const actor = actorWith([{ id: "rope", name: "Rope", type: "loot", system: { quantity: 3 } }]);
  const granted = await addItems(actor, [source, { name: "Rations", type: "loot", system: { quantity: 2 } }]);
  assert.equal(source.system.quantity, 4);
  assert.equal(actor.items.find(item => item.id === "rope").system.quantity, 3);
  assert.equal(actor.creates.length, 1);
  assert.deepEqual(actor.creates[0].options, { keepId: true });
  assert.deepEqual(actor.creates[0].data.map(item => item.name), ["Rations", "Explorer's Pack", "Rope"]);
  assert.equal(granted.created.length, 3);
  assert.equal(actor.items.find(item => item.id === "rope-1").system.container, "pack-1");

  globalThis.CONFIG.Item.documentClass.createWithContents = async () => { throw new Error("contents failed"); };
  const before = actor.items.length;
  await assert.rejects(() => addItems(actor, [potion(1), source]), /contents failed/);
  assert.equal(actor.items.find(item => item.name === "Potion of Healing"), undefined);
  assert.equal(actor.items.length, before);
  assert.equal(actor.writes.length, 0);
});

test("a failed create restores every quantity change from that add", async () => {
  const actor = actorWith([
    { id: "rations", name: "Rations", type: "loot", system: { quantity: 1 } },
    { id: "torches", name: "Torch", type: "equipment", system: { quantity: 2 } }
  ]);
  actor.createEmbeddedDocuments = async () => { throw new Error("disk full"); };
  await assert.rejects(() => addItems(actor, [
    { name: "Rations", type: "loot", system: { quantity: 4 } },
    { name: "Torch", type: "equipment", system: { quantity: 1 } },
    { name: "Alert", type: "feat" }
  ]), /disk full/);
  assert.equal(actor.items.find(item => item.id === "rations").system.quantity, 1);
  assert.equal(actor.items.find(item => item.id === "torches").system.quantity, 2);
  assert.equal(actor.writes.length, 2);
  assert.deepEqual(actor.writes[1], [
    { _id: "rations", "system.quantity": 1 },
    { _id: "torches", "system.quantity": 2 }
  ]);
});

test("a failed rollback reports that the quantity changes could not be restored", async () => {
  const actor = actorWith([{ id: "rations", name: "Rations", type: "loot", system: { quantity: 1 } }]);
  let writes = 0;
  actor.updateEmbeddedDocuments = async (_type, updates) => {
    writes += 1;
    if (writes > 1) throw new Error("restore failed");
    actor.items.find(item => item.id === updates[0]._id).system.quantity = updates[0]["system.quantity"];
  };
  actor.createEmbeddedDocuments = async () => { throw new Error("disk full"); };
  await assert.rejects(() => addItems(actor, [
    { name: "Rations", type: "loot", system: { quantity: 2 } },
    { name: "Alert", type: "feat" }
  ]), /could not be fully rolled back/);
  assert.equal(actor.items[0].system.quantity, 3);
});

test("invalid items and actors are rejected before any write", async () => {
  const actor = actorWith([{ id: "rations", name: "Rations", type: "loot", system: { quantity: 1 } }]);
  await assert.rejects(() => addItems(actor, [{ name: "Rations", type: "loot", system: { quantity: 0 } }]), /positive whole number/);
  await assert.rejects(() => addItems(actor, [{ name: " ", type: "loot", system: { quantity: 1 } }]), /needs a name/);
  await assert.rejects(() => addItems(actor, null), /must be a list/);
  await assert.rejects(() => addItems({ items: [] }, []), /inventory Actor is required/);
  assert.equal(actor.writes.length, 0);
  assert.equal(actor.creates.length, 0);
  assert.deepEqual(await addItems(actor, []), { created: [], updated: [] });
});

test("a different source or name does not join an existing stack", async () => {
  const actor = actorWith([{ id: "rations", name: "Rations", type: "loot", system: { quantity: 2 }, _stats: { compendiumSource: "Compendium.dnd5e.equipment24.Item.rations" } }]);
  await addItems(actor, [
    { name: "Rations", type: "loot", system: { quantity: 1 }, uuid: "Compendium.dnd5e.equipment24.Item.other" },
    { name: "Travel Rations", type: "loot", system: { quantity: 1 }, uuid: "Compendium.dnd5e.equipment24.Item.rations" }
  ]);
  assert.equal(actor.items.find(item => item.id === "rations").system.quantity, 2);
  assert.equal(actor.items.filter(item => item.type === "loot").length, 3);
});

test("the public API publishes inventory on init and ready", () => {
  const main = readFileSync(new URL("../scripts/main.js", import.meta.url), "utf8");
  assert.match(main, /api\.inventory = publishedInventory\(\)/);
  assert.match(main, /inventory: publishedInventory\(\)/);
  const start = main.indexOf("function publishedInventory");
  const published = main.slice(start, start + 200);
  assert.match(published, /\baddItems\b/);
});
