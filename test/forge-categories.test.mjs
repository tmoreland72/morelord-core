import test from "node:test";
import assert from "node:assert/strict";
import { forgeAncestors, forgeCategoryKeys, migrateForgeSpecialties, resolveForgeCategory } from "../scripts/location/forge-categories.js";
import { locationAllowsSpecialty, normalizeLocation } from "../scripts/location/location-domain.js";
import { listForgeSpecialties } from "../scripts/location/forge-categories.js";

test("a forge parent covers its children and a child does not cover the parent", () => {
  const location = normalizeLocation({
    id: "forge",
    name: "Forge",
    settlementType: "town",
    capabilities: [{ type: "forge", tier: "common", specialty: ["armor", "sim"] }]
  });
  assert.equal(locationAllowsSpecialty(location, "forge", "hvy"), true);
  assert.equal(locationAllowsSpecialty(location, "forge", "heavy"), true);
  assert.equal(locationAllowsSpecialty(location, "forge", "shl"), true);
  assert.equal(locationAllowsSpecialty(location, "forge", "armor"), true);
  assert.equal(locationAllowsSpecialty(location, "forge", "simpleM"), true);
  assert.equal(locationAllowsSpecialty(location, "forge", "simpleR"), true);
  assert.equal(locationAllowsSpecialty(location, "forge", "sim"), true);
  assert.equal(locationAllowsSpecialty(location, "forge", "martialM"), false);
  assert.equal(locationAllowsSpecialty(location, "forge", "ammo"), false);
  assert.equal(locationAllowsSpecialty(location, "forge", "weapon"), false);
  assert.deepEqual(forgeAncestors("simpleM"), ["simpleM", "sim", "weapon"]);
  assert.equal(resolveForgeCategory("longsword"), "martialM");
});

test("legacy forge keys migrate to categories and unknown keys become Any", () => {
  assert.deepEqual(migrateForgeSpecialties(["longsword", "plate", "dagger", "longsword"]), ["martialM", "hvy", "simpleM"]);
  assert.deepEqual(migrateForgeSpecialties(["sim", "musket"]), ["sim", "martialR"]);
  assert.deepEqual(migrateForgeSpecialties(["not-a-forge", "weaponMastery"]), []);
  assert.deepEqual(migrateForgeSpecialties(["hvy", "not-a-forge"]), ["hvy"]);
  const location = normalizeLocation({
    id: "old",
    name: "Old",
    settlementType: "village",
    capabilities: [{ type: "forge", tier: "common", specialty: ["mystery-key"] }]
  });
  assert.deepEqual(location.capabilities[0].specialty, []);
  assert.equal(locationAllowsSpecialty(location, "forge", "hvy"), true);
});

test("instructor group Any allows every subject in that group", () => {
  const location = normalizeLocation({
    id: "academy",
    name: "Academy",
    settlementType: "town",
    capabilities: [{ type: "instructor", tier: "common", specialty: ["any-language", "ste"] }]
  });
  assert.equal(locationAllowsSpecialty(location, "instructor", "elvish"), true);
  assert.equal(locationAllowsSpecialty(location, "instructor", "common"), true);
  assert.equal(locationAllowsSpecialty(location, "instructor", "ste"), true);
  assert.equal(locationAllowsSpecialty(location, "instructor", "acr"), false);
  assert.equal(locationAllowsSpecialty(location, "instructor", "dagger"), false);
  assert.equal(listForgeSpecialties().find(entry => entry.id === "armor").label, "Any Armor");
  assert.equal(listForgeSpecialties().find(entry => entry.id === "weapon").label, "Any Weapon");
});

test("forgeCategoryKeys maps dnd5e armor, weapon, and ammunition data", () => {
  assert.deepEqual(forgeCategoryKeys({ type: "weapon", system: { type: { value: "martialM" } } }), ["weapon", "mar", "martialM"]);
  assert.deepEqual(forgeCategoryKeys({ type: "equipment", system: { type: { value: "heavy" } } }), ["armor", "hvy"]);
  assert.deepEqual(forgeCategoryKeys({ type: "equipment", system: { armor: { type: "shield" } } }), ["armor", "shl"]);
  assert.deepEqual(forgeCategoryKeys({ type: "consumable", system: { type: { value: "ammo" } } }), ["weapon", "ammo"]);
  assert.deepEqual(forgeCategoryKeys("longsword"), ["weapon", "mar", "martialM"]);
  assert.deepEqual(forgeCategoryKeys({ type: "weapon", system: { type: { value: "simpleR" } } }), ["weapon", "sim", "simpleR"]);
  assert.deepEqual(forgeCategoryKeys({ type: "loot", system: { type: { value: "gear" } } }), []);
  assert.deepEqual(forgeCategoryKeys(null), []);
});
