/**
 * Forge specialties are D&D 2024 equipment categories.
 * A stored parent covers its children. Individual weapons, armor, and weapon masteries migrate to a category.
 */

const SIMPLE_MELEE = Object.freeze(["club", "dagger", "greatclub", "handaxe", "javelin", "lighthammer", "mace", "quarterstaff", "sickle", "spear"]);
const SIMPLE_RANGED = Object.freeze(["dart", "lightcrossbow", "shortbow", "sling"]);
const MARTIAL_MELEE = Object.freeze(["battleaxe", "flail", "glaive", "greataxe", "greatsword", "halberd", "lance", "longsword", "maul", "morningstar", "pike", "rapier", "scimitar", "shortsword", "trident", "warpick", "warhammer", "whip"]);
const MARTIAL_RANGED = Object.freeze(["blowgun", "handcrossbow", "heavycrossbow", "longbow", "musket", "pistol"]);
const LIGHT_ARMOR = Object.freeze(["padded", "leather", "studded"]);
const MEDIUM_ARMOR = Object.freeze(["hide", "chainshirt", "scalemail", "breastplate", "halfplate"]);
const HEAVY_ARMOR = Object.freeze(["ringmail", "chainmail", "splint", "plate"]);

const NODES = Object.freeze([
  { id: "armor", label: "Armor", parent: null, group: "Armor" },
  { id: "lgt", label: "Light Armor", parent: "armor", group: "Armor" },
  { id: "med", label: "Medium Armor", parent: "armor", group: "Armor" },
  { id: "hvy", label: "Heavy Armor", parent: "armor", group: "Armor" },
  { id: "shl", label: "Shields", parent: "armor", group: "Armor" },
  { id: "weapon", label: "Weapons", parent: null, group: "Weapons" },
  { id: "sim", label: "Simple Weapons", parent: "weapon", group: "Weapons" },
  { id: "simpleM", label: "Simple Melee Weapons", parent: "sim", group: "Weapons" },
  { id: "simpleR", label: "Simple Ranged Weapons", parent: "sim", group: "Weapons" },
  { id: "mar", label: "Martial Weapons", parent: "weapon", group: "Weapons" },
  { id: "martialM", label: "Martial Melee Weapons", parent: "mar", group: "Weapons" },
  { id: "martialR", label: "Martial Ranged Weapons", parent: "mar", group: "Weapons" },
  { id: "ammo", label: "Ammunition", parent: "weapon", group: "Weapons" }
]);

const BY_ID = new Map(NODES.map(node => [node.id, node]));

const LEGACY = new Map([
  ["light", "lgt"],
  ["medium", "med"],
  ["heavy", "hvy"],
  ["shield", "shl"]
]);
for (const id of SIMPLE_MELEE) LEGACY.set(id, "simpleM");
for (const id of SIMPLE_RANGED) LEGACY.set(id, "simpleR");
for (const id of MARTIAL_MELEE) LEGACY.set(id, "martialM");
for (const id of MARTIAL_RANGED) LEGACY.set(id, "martialR");
for (const id of LIGHT_ARMOR) LEGACY.set(id, "lgt");
for (const id of MEDIUM_ARMOR) LEGACY.set(id, "med");
for (const id of HEAVY_ARMOR) LEGACY.set(id, "hvy");

export function listForgeSpecialties() {
  return NODES.map(node => Object.freeze({
    kind: "forgeCategory",
    id: node.id,
    label: node.label,
    category: node.group,
    parent: node.parent
  }));
}

/** The category id for a stored or requested key, or null when it is not a forge category. */
export function resolveForgeCategory(value) {
  const key = String(value ?? "").trim();
  if (!key) return null;
  if (BY_ID.has(key)) return key;
  return LEGACY.get(key) ?? null;
}

/** Self and each parent, nearest first. */
export function forgeAncestors(categoryId) {
  const start = resolveForgeCategory(categoryId);
  if (!start) return [];
  const chain = [];
  let current = start;
  const seen = new Set();
  while (current && !seen.has(current)) {
    seen.add(current);
    chain.push(current);
    current = BY_ID.get(current)?.parent ?? null;
  }
  return chain;
}

/**
 * Category keys for a dnd5e weapon, armor, or ammunition item, root first.
 * A string may be a category id, a dnd5e type value such as "martialM" or "heavy", or a legacy item id such as "longsword".
 * Anything else returns [].
 */
export function forgeCategoryKeys(item) {
  const category = categoryFromItem(item);
  if (!category) return [];
  return forgeAncestors(category).reverse();
}

export function migrateForgeSpecialties(keys = []) {
  const mapped = [];
  const seen = new Set();
  for (const key of keys) {
    const category = resolveForgeCategory(key);
    if (!category || seen.has(category)) continue;
    seen.add(category);
    mapped.push(category);
  }
  return mapped;
}

function categoryFromItem(item) {
  if (typeof item === "string" || typeof item === "number") return resolveForgeCategory(item);
  if (!item || typeof item !== "object") return null;
  const itemType = String(item.type ?? "").trim();
  const system = item.system ?? {};
  const rawValue = system?.type?.value ?? system?.armor?.type ?? system?.type;
  const value = String(rawValue ?? "").trim();
  if (itemType === "consumable" && value === "ammo") return "ammo";
  if (itemType === "weapon" || itemType === "equipment" || itemType === "") return resolveForgeCategory(value);
  return resolveForgeCategory(value);
}
