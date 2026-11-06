const QUANTITY_TYPES = new Set(["consumable", "loot", "equipment", "weapon", "tool"]);
const STACK_TYPES = new Set(["consumable", "loot"]);

function actorItems(actor) {
  const items = actor?.items;
  if (!items) return [];
  if (typeof items.values === "function") return [...items.values()];
  if (typeof items[Symbol.iterator] === "function") return [...items];
  return [];
}

function sourceOf(item) {
  if (!item || typeof item !== "object") return "";
  const fromFlag = typeof item.getFlag === "function" ? item.getFlag("core", "sourceId") : "";
  const uuid = typeof item.uuid === "string" && item.uuid.startsWith("Compendium.") ? item.uuid : "";
  return String(item._stats?.compendiumSource || item.flags?.core?.sourceId || fromFlag || uuid || "");
}

function copyItem(data) {
  return structuredClone(data);
}

/** Positive whole number, or null when the field is absent. Any other value is rejected. */
function quantityOf(data) {
  const value = data?.system?.quantity;
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isInteger(value) && value >= 1) return value;
  throw new Error("The item quantity must be a positive whole number.");
}

function readField(source, key) {
  if (!source || typeof source !== "object") return undefined;
  if (!Object.hasOwn(source, key) && !(key in source)) return undefined;
  const value = source[key];
  if (typeof value === "function") return undefined;
  return value;
}

function chargeToken(uses) {
  if (!uses || typeof uses !== "object" || Array.isArray(uses)) return "";
  const picked = {};
  for (const key of ["max", "spent", "value"]) {
    const value = readField(uses, key);
    if (value == null || value === "") continue;
    picked[key] = value;
  }
  return Object.keys(picked).length ? JSON.stringify(picked) : "";
}

function stateValue(system, key, boolean = false) {
  const value = readField(system, key);
  if (value === undefined) return null;
  return boolean ? value === true : value;
}

function stateKey(data, source) {
  const system = data?.system ?? {};
  return JSON.stringify({
    type: data?.type ?? "",
    name: data?.name ?? "",
    source: source || "",
    identified: stateValue(system, "identified", true),
    attunement: stateValue(system, "attunement"),
    attuned: stateValue(system, "attuned", true),
    charges: chargeToken(system.uses)
  });
}

function stampSource(data, source) {
  if (!source || (data._stats?.compendiumSource && data.flags?.core?.sourceId)) return data;
  const next = { ...data };
  if (!data._stats?.compendiumSource) next._stats = { ...(data._stats ?? {}), compendiumSource: source };
  if (!data.flags?.core?.sourceId) {
    next.flags = { ...(data.flags ?? {}), core: { ...(data.flags?.core ?? {}), sourceId: source } };
  }
  return next;
}

function asRecord(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("An inventory item is required.");
  const source = sourceOf(item);
  const raw = typeof item.toObject === "function" ? item.toObject() : item;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("An inventory item is required.");
  const data = copyItem(raw);
  return {
    data,
    source: source || sourceOf(data),
    document: typeof item.toObject === "function" ? item : null
  };
}

function isCompound(data) {
  return data?.type === "container" || Boolean(data?.system?.container);
}

function stackQuantity(data) {
  const type = data?.type;
  if (!QUANTITY_TYPES.has(type)) return null;
  const quantity = quantityOf(data);
  if (isCompound(data)) return null;
  if (STACK_TYPES.has(type)) return quantity ?? 1;
  return quantity;
}

async function expandCompounds(records) {
  const prepare = globalThis.CONFIG?.Item?.documentClass?.createWithContents;
  const expandable = typeof prepare === "function" ? records.filter(record => record.document && record.data?.type === "container") : [];
  const expanded = [];
  if (expandable.length) {
    const produced = await prepare(expandable.map(record => record.document));
    const list = Array.isArray(produced) ? produced : produced ? [produced] : [];
    if (!list.length) throw new Error("The container contents could not be prepared.");
    for (const entry of list) {
      const raw = entry && typeof entry.toObject === "function" ? entry.toObject() : entry;
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("The container contents could not be prepared.");
      const data = copyItem(raw);
      expanded.push({ data, source: sourceOf(entry) || sourceOf(data), compound: true });
    }
  }
  const consumed = new Set(expandable);
  const rest = records.filter(record => !consumed.has(record)).map(record => ({
    ...record,
    compound: isCompound(record.data)
  }));
  return [...rest, ...expanded];
}

function planAdds(actor, records) {
  const updates = new Map();
  const creates = [];
  const pending = new Map();
  for (const record of records) {
    const data = record.data;
    const quantity = stackQuantity(data);
    const stack = quantity != null && !record.compound;
    if (stack && !String(data?.name ?? "").trim()) throw new Error("An inventory item needs a name.");
    if (!stack) {
      const copy = copyItem(data);
      if (!record.compound) {
        delete copy._id;
        delete copy.id;
      }
      creates.push(copy);
      continue;
    }
    const key = stateKey(data, record.source);
    const owned = actorItems(actor).find(item => {
      const id = item?.id ?? item?._id;
      return id && !item.system?.container && stateKey(item, sourceOf(item)) === key;
    });
    if (owned) {
      const id = owned.id ?? owned._id;
      const current = updates.get(id);
      const previous = current?.previous ?? (quantityOf(owned) ?? 1);
      updates.set(id, {
        id,
        uuid: owned.uuid ?? null,
        previous,
        quantity: (current?.quantity ?? previous) + quantity
      });
      continue;
    }
    const staged = pending.get(key);
    if (staged) {
      staged.system.quantity += quantity;
      continue;
    }
    let next = stampSource(copyItem(data), record.source);
    delete next._id;
    delete next.id;
    next = { ...next, system: { ...(next.system ?? {}), quantity } };
    creates.push(next);
    pending.set(key, next);
  }
  return { updates: [...updates.values()], creates };
}

async function writeQuantities(actor, rows) {
  const payload = rows.map(row => ({ _id: row.id, "system.quantity": row.quantity }));
  if (typeof actor.updateEmbeddedDocuments === "function") {
    await actor.updateEmbeddedDocuments("Item", payload);
    return;
  }
  for (const row of rows) {
    const item = actorItems(actor).find(entry => (entry?.id ?? entry?._id) === row.id);
    if (typeof item?.update !== "function") throw new Error("This Actor cannot update inventory items.");
    await item.update({ "system.quantity": row.quantity });
  }
}

/**
 * Add items to an actor. Compatible consumables, loot, and quantity-using equipment
 * combine quantity. Containers stay separate, including contents linked to a container
 * in the same add. Items that differ in charges, identified, or attunement stay separate.
 * A failed create restores quantity changes from this call and does not grant the new documents.
 * @param {Actor} actor
 * @param {Array<object|Item>} items
 * @returns {Promise<{created: Document[], updated: Array<{id: string, uuid: string|null, quantity: number, previousQuantity: number}>}>}
 */
export async function addItems(actor, items) {
  if (!actor || typeof actor.createEmbeddedDocuments !== "function") throw new Error("An inventory Actor is required.");
  if (!Array.isArray(items)) throw new Error("Inventory items must be a list.");
  if (!items.length) return { created: [], updated: [] };

  const records = await expandCompounds(items.map(asRecord));
  const plan = planAdds(actor, records);
  let written = false;
  try {
    if (plan.updates.length) {
      await writeQuantities(actor, plan.updates);
      written = true;
    }
    const keepId = plan.creates.some(item => item?._id);
    const created = plan.creates.length
      ? await actor.createEmbeddedDocuments("Item", plan.creates, keepId ? { keepId: true } : undefined)
      : [];
    return {
      created: created ?? [],
      updated: plan.updates.map(row => ({
        id: row.id,
        uuid: row.uuid,
        quantity: row.quantity,
        previousQuantity: row.previous
      }))
    };
  } catch (error) {
    if (!written) throw error;
    try {
      await writeQuantities(actor, plan.updates.map(row => ({ id: row.id, quantity: row.previous })));
    } catch {
      throw new Error("The inventory add failed and could not be fully rolled back.");
    }
    throw error;
  }
}
