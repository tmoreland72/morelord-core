import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BUILTIN_CAPABILITY_TYPES, CapabilityRegistry } from "../scripts/location/capability-registry.js";
import { normalizeLocation } from "../scripts/location/location-domain.js";
import {
  FORGE_SPECIALTY_CATALOG,
  TRAINING_SPECIALTY_CATEGORIES,
  buildSpecialtyOptions,
  decorateCapabilityRows,
  listForgeSpecialties,
  listTrainingSpecialties
} from "../scripts/location/training-specialties.js";

const choices = [
  { kind: "language", id: "common", label: "Common", category: "Language", trainingValue: "language:common" },
  { kind: "language", id: "dwarvish", label: "Dwarvish", category: "Language", trainingValue: "language:dwarvish" },
  { kind: "skillProficiency", id: "ste", label: "Stealth", category: "Skill Proficiency", trainingValue: "skillProficiency:ste" },
  { kind: "toolProficiency", id: "art", label: "Artisan's Tools", category: "Tool Proficiency", trainingValue: "toolProficiency:art" },
  { kind: "toolProficiency", id: "thief", label: "Thieves' Tools", category: "Tool Proficiency", trainingValue: "toolProficiency:thief" },
  { kind: "weaponProficiency", id: "sim", label: "Simple Weapons", category: "Weapon Proficiency", trainingValue: "weaponProficiency:sim" },
  { kind: "weaponProficiency", id: "dagger", label: "Dagger", category: "Weapon Proficiency", trainingValue: "weaponProficiency:dagger" },
  { kind: "weaponMastery", id: "dagger", label: "Dagger", category: "Weapon Mastery", trainingValue: "weaponMastery:dagger" },
  { kind: "armorProficiency", id: "lgt", label: "Light Armor", category: "Armor Proficiency", trainingValue: "armorProficiency:lgt" },
  { kind: "armorProficiency", id: "plate", label: "Plate Armor", category: "Armor Proficiency", trainingValue: "armorProficiency:plate" },
  { kind: "armorProficiency", id: "shield", label: "Shield", category: "Armor Proficiency", trainingValue: "armorProficiency:shield" }
];

function registry() {
  const types = new CapabilityRegistry();
  for (const definition of BUILTIN_CAPABILITY_TYPES) types.register(definition);
  return types;
}

function optionsFor(typeId, { choices: supplied = choices, current = null, useDefault = false } = {}) {
  const options = useDefault ? { current } : { choices: supplied, current };
  return buildSpecialtyOptions(registry().get(typeId), options);
}

function flatOptions(model) {
  return model.groups.flatMap(group => group.options);
}

function ids(entries, kind) {
  return entries.filter(entry => entry.kind === kind).map(entry => entry.id);
}

test("the instructor and forge catalogs are a fixed D&D 2024 list", () => {
  const catalog = listTrainingSpecialties();
  const forge = listForgeSpecialties();
  assert.deepEqual(new Set(catalog.map(entry => entry.category)), new Set(TRAINING_SPECIALTY_CATEGORIES));
  assert.deepEqual(ids(catalog, "skillProficiency").sort(), [
    "acr", "ani", "arc", "ath", "dec", "his", "ins", "inv", "itm", "med", "nat", "per", "prc", "prf", "rel", "slt", "ste", "sur"
  ]);
  assert.deepEqual(ids(catalog, "language").sort(), [
    "abyssal", "cant", "celestial", "common", "deep", "draconic", "druidic", "dwarvish", "elvish",
    "giant", "gnomish", "goblin", "halfling", "infernal", "orc", "primordial", "sign", "sylvan", "undercommon"
  ]);
  assert.equal(ids(catalog, "toolProficiency").length, 42);
  assert.equal(ids(catalog, "weaponProficiency").length, 40);
  assert.equal(ids(catalog, "armorProficiency").length, 17);
  assert.equal(ids(catalog, "weaponMastery").length, 38);
  const stealth = catalog.find(entry => entry.id === "ste");
  assert.equal(stealth.label, "Stealth");
  assert.equal(stealth.trainingValue, "skillProficiency:ste");
  assert.equal(catalog.find(entry => entry.id === "sign").label, "Common Sign Language");
  assert.equal(catalog.find(entry => entry.id === "cant").label, "Thieves' Cant");
  assert.equal(catalog.find(entry => entry.id === "thief").label, "Thieves' Tools");
  assert.equal(catalog.find(entry => entry.id === "plate" && entry.kind === "armorProficiency").label, "Plate Armor");
  assert.equal(catalog.find(entry => entry.id === "shl").label, "Shields");
  assert.equal(catalog.find(entry => entry.kind === "weaponMastery" && entry.id === "dagger").label, "Dagger");
  assert.equal(catalog.find(entry => entry.kind === "weaponMastery" && entry.id === "dagger").trainingValue, "weaponMastery:dagger");
  const weaponIds = ids(catalog, "weaponProficiency").filter(id => id !== "sim" && id !== "mar").sort();
  assert.deepEqual(ids(catalog, "weaponMastery").sort(), weaponIds);
  for (const absent of ["aarakocra", "gith", "gnoll", "aquan", "auran", "ignan", "terran", "net", "air", "space"]) {
    assert.equal(catalog.some(entry => entry.id === absent), false, absent);
  }
  for (const entry of catalog) {
    assert.equal(JSON.stringify(entry).includes("Compendium."), false, entry.id);
  }
  assert.deepEqual(forge.map(entry => entry.id), [
    "armor", "lgt", "med", "hvy", "shl",
    "weapon", "sim", "simpleM", "simpleR", "mar", "martialM", "martialR", "ammo"
  ]);
  assert.equal(forge.some(entry => entry.category === "Weapon Mastery" || entry.id === "longsword"), false);
});

test("specialty options follow the capability type, default to Any, and keep unknown stored values", () => {
  const instructor = optionsFor("instructor");
  assert.deepEqual(
    instructor.groups.filter(group => group.label).map(group => group.label),
    ["Any", "Languages", "Skills", "Tools", "Weapons", "Armor", "Weapon Masteries"]
  );
  assert.equal(instructor.groups[0].options[0].label, "Any");
  assert.equal(instructor.groups.find(group => group.label === "Languages").options[0].label, "Any Language");
  assert.equal(instructor.summary, "Any");
  assert.equal(flatOptions(instructor).some(option => option.value === "" || option.selected), false);
  const emptyInstructor = optionsFor("instructor", { choices: [] });
  assert.equal(emptyInstructor.summary, "Any");
  assert.deepEqual(emptyInstructor.groups.map(group => group.label), ["Any"]);
  const dagger = flatOptions(instructor).filter(option => option.value === "dagger");
  assert.equal(dagger.length, 2);
  assert.deepEqual(dagger.map(option => option.label), ["Dagger", "Dagger"]);
  assert.equal(flatOptions(instructor).some(option => option.value === "skillProficiency:ste"), false);
  assert.equal(flatOptions(instructor).some(option => option.value === "Stealth"), false);
  assert.equal(flatOptions(instructor).find(option => option.value === "ste").label, "Stealth");

  const forge = optionsFor("forge");
  assert.deepEqual(
    forge.groups.filter(group => group.label).map(group => group.label),
    ["Any", "Armor", "Weapons"]
  );
  assert.equal(forge.summary, "Any");
  assert.equal(flatOptions(forge).some(option => option.selected), false);
  assert.equal(flatOptions(forge).some(option => option.value === "ste" || option.value === "dwarvish" || option.value === "thief" || option.value === "longsword"), false);
  assert.equal(flatOptions(forge).some(option => option.value === "sim"), true);
  assert.equal(flatOptions(forge).some(option => option.value === "lgt"), true);
  assert.equal(flatOptions(forge).some(option => option.value === "simpleM" && option.label === "Simple Melee Weapons"), true);

  const fixedForge = optionsFor("forge", { useDefault: true });
  assert.equal(flatOptions(fixedForge).some(option => option.value === "martialM"), true);
  assert.equal(flatOptions(fixedForge).some(option => option.value === "ste" || option.value === "longsword"), false);
  assert.equal(flatOptions(fixedForge).find(option => option.value === "ammo").label, "Ammunition");
  assert.equal(flatOptions(fixedForge).find(option => option.value === "armor").label, "Any Armor");
  assert.equal(flatOptions(fixedForge).find(option => option.value === "weapon").label, "Any Weapon");

  for (const typeId of ["marketplace", "alchemist", "library", "temple"]) {
    assert.equal(optionsFor(typeId, { current: "smiths-tools" }), null, typeId);
  }
  assert.equal(buildSpecialtyOptions({ id: "oracle", supportsSpecialty: true }, { choices, current: "ste" }), null);

  const saved = optionsFor("instructor", { current: "smiths-tools" });
  const savedFlat = flatOptions(saved);
  assert.equal(saved.summary, "smiths-tools");
  assert.deepEqual(savedFlat.find(option => option.value === "smiths-tools"), {
    value: "smiths-tools",
    label: "smiths-tools",
    selected: true
  });
  assert.equal(savedFlat.filter(option => option.selected).length, 1);

  const weapon = optionsFor("instructor", { current: "dagger" });
  const selectedDaggers = flatOptions(weapon).filter(option => option.value === "dagger" && option.selected);
  assert.equal(selectedDaggers.length, 2);
  assert.equal(weapon.summary, "Dagger");
  assert.equal(weapon.groups.find(group => group.label === "Weapons").options.some(option => option.selected), true);

  const many = optionsFor("instructor", { current: ["ste", "dagger", "lgt", "ste"] });
  assert.equal(many.summary, "Stealth, Dagger, Light Armor");
  assert.deepEqual(
    flatOptions(many).filter(option => option.selected).map(option => option.value),
    ["ste", "dagger", "lgt", "dagger"]
  );
});

test("hidden specialty types keep the stored specialty on the editor row", () => {
  const types = registry();
  const rows = decorateCapabilityRows([
    { type: "instructor", tier: "common", specialty: "dwarvish", source: "guild charter" },
    { type: "forge", tier: "rare", specialty: ["hvy", "old-forge-note"], source: "kept" },
    { type: "marketplace", tier: "common", specialty: "kept-note", source: "stall" }
  ], { resolveType: id => types.get(id), choices });
  assert.deepEqual(rows[0].specialty, ["dwarvish"]);
  assert.equal(rows[0].source, "guild charter");
  assert.equal(flatOptions(rows[0].specialtyOptions).find(option => option.value === "dwarvish").selected, true);
  assert.deepEqual(rows[1].specialty, ["hvy"]);
  assert.equal(rows[1].source, "kept");
  assert.equal(rows[1].specialtyOptions.summary, "Heavy Armor");
  assert.equal(flatOptions(rows[1].specialtyOptions).some(option => option.value === "old-forge-note" || option.value === "ste"), false);
  assert.equal(rows[2].specialtyOptions, null);
  assert.deepEqual(rows[2].specialty, ["kept-note"]);
  assert.equal(rows[2].source, "stall");
});

test("builtin instructor uses the training catalog and forge uses weapon, armor, and mastery", () => {
  const types = registry();
  assert.equal(types.get("instructor").supportsSpecialty, true);
  assert.equal(types.get("instructor").specialtyCatalog, "training");
  assert.equal(types.get("forge").supportsSpecialty, true);
  assert.equal(types.get("forge").specialtyCatalog, FORGE_SPECIALTY_CATALOG);
  for (const typeId of ["marketplace", "alchemist", "library", "temple"]) {
    assert.equal(types.get(typeId).supportsSpecialty, false, typeId);
    assert.equal(types.get(typeId).specialtyCatalog, null, typeId);
  }
  assert.equal(types.get("workshop").supportsSpecialty, true);
  assert.equal(types.get("workshop").specialtyCatalog, "artisan-tools");
});

test("instructor and forge lists do not consult Configure Sources or compendium documents", () => {
  const sources = [
    "scripts/location/training-specialties.js",
    "scripts/location/fixed-specialties.js",
    "scripts/location/location-manager-app.js",
    "scripts/location/forge-categories.js"
  ].map(path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));
  for (const source of sources) {
    assert.equal(source.includes("isUuidAllowed"), false);
    assert.equal(source.includes("fromUuid"), false);
    assert.equal(source.includes("onConfigureSourcesChanged"), false);
    assert.equal(source.includes("Compendium."), false);
    assert.equal(source.includes("CONFIG"), false);
  }
  let calls = 0;
  const catalog = listTrainingSpecialties({
    config() { calls += 1; return {}; },
    resolveUuid() { calls += 1; return null; },
    isUuidAllowed() { calls += 1; return false; }
  });
  assert.equal(calls, 0);
  assert.equal(catalog.some(entry => entry.id === "plate"), true);
});

test("stored specialty and source strings stay compatible", () => {
  const location = normalizeLocation({
    id: "academy",
    name: "Academy",
    settlementType: "city",
    capabilities: [
      { type: "instructor", specialty: "smiths-tools", source: "guild charter", tier: "rare" },
      { type: "forge", specialty: "", source: "", tier: "common" }
    ]
  });
  assert.deepEqual(location.capabilities[0].specialty, ["smiths-tools"]);
  assert.equal(location.capabilities[0].source, "guild charter");
  assert.deepEqual(location.capabilities[1].specialty, []);
  assert.equal(location.capabilities[1].source, null);
});

test("capability editor labels Notes and posts the existing source field", () => {
  const template = readFileSync(new URL("../templates/location-manager.hbs", import.meta.url), "utf8");
  assert.match(template, /<span>Notes<\/span>\s*<input type="text" name="capabilities\.\{\{@index\}\}\.source"/);
  assert.match(template, /class="ml-multi-select"/);
  assert.match(template, /data-action="pickSpecialty"/);
  assert.match(template, /class="ml-multi-select__summary" data-action="pickSpecialty"[^>]*title="\{\{specialtyOptions\.summary\}\}"/);
  assert.doesNotMatch(template, /<p class="ml-multi-select__heading">/);
  assert.match(template, /data-ml-multi-select-label/);
  assert.match(template, /name="capabilities\.\{\{@\.\.\/index\}\}\.specialty"/);
  assert.doesNotMatch(template, /type="checkbox" name="capabilities\./);
  assert.doesNotMatch(template, /<select name="capabilities\.\{\{@index\}\}\.specialty">/);
  assert.match(template, /data-action="openDocumentation"/);
  assert.match(template, /data-capability-type/);
  assert.doesNotMatch(template, /<span>Source<\/span>/);
});
