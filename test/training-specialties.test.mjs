import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BUILTIN_CAPABILITY_TYPES, CapabilityRegistry } from "../scripts/location/capability-registry.js";
import { normalizeLocation } from "../scripts/location/location-domain.js";
import {
  TRAINING_SPECIALTY_CATEGORIES,
  buildSpecialtyOptions,
  decorateCapabilityRows,
  listTrainingSpecialties
} from "../scripts/location/training-specialties.js";

const config = {
  skills: { ste: { label: "Stealth" } },
  enrichmentLookup: { languages: { common: "Common", dwarvish: "Dwarvish" } },
  armorProficiencies: { lgt: "Light Armor" },
  armorIds: { plate: "Item.plate" },
  shieldIds: { shield: "Item.shield" },
  weaponProficiencies: { sim: "Simple Weapons" },
  weaponIds: { dagger: "Item.dagger" },
  toolProficiencies: { art: "Artisan's Tools" },
  tools: { thief: { id: "Item.thief", ability: "dex" } }
};
const documents = {
  "Item.plate": { name: "Plate Armor" },
  "Item.shield": { name: "Shield" },
  "Item.dagger": { name: "Dagger" },
  "Item.thief": { name: "Thieves' Tools" }
};

function registry() {
  const types = new CapabilityRegistry();
  for (const definition of BUILTIN_CAPABILITY_TYPES) types.register(definition);
  return types;
}

function optionsFor(typeId, { choices, current = null } = {}) {
  return buildSpecialtyOptions(registry().get(typeId), { choices, current });
}

function flatOptions(model) {
  return model.groups.flatMap(group => group.options);
}

test("training catalog lists the same subject families Downtime Training discovers", async () => {
  const choices = await listTrainingSpecialties({
    config,
    resolveUuid: uuid => documents[uuid] ?? null,
    localize: value => value
  });
  const byKind = kind => choices.filter(choice => choice.kind === kind).map(choice => choice.id);
  assert.deepEqual(new Set(choices.map(choice => choice.category)), new Set(TRAINING_SPECIALTY_CATEGORIES));
  assert.deepEqual(byKind("language"), ["common", "dwarvish"]);
  assert.deepEqual(byKind("skillProficiency"), ["ste"]);
  assert.deepEqual(byKind("toolProficiency").sort(), ["art", "thief"]);
  assert.deepEqual(byKind("weaponProficiency").sort(), ["dagger", "sim"]);
  assert.deepEqual(byKind("weaponMastery"), ["dagger"]);
  assert.deepEqual(byKind("armorProficiency").sort(), ["lgt", "plate", "shield"]);
  const stealth = choices.find(choice => choice.id === "ste");
  assert.equal(stealth.label, "Stealth");
  assert.equal(stealth.trainingValue, "skillProficiency:ste");
  assert.equal(choices.find(choice => choice.id === "thief").label, "Thieves' Tools");
  assert.equal(choices.find(choice => choice.kind === "weaponMastery").label, "Dagger");
  assert.equal(choices.find(choice => choice.id === "plate").label, "Plate Armor");
});

test("a compendium document excluded by Configure Sources is left out of the catalog", async () => {
  const choices = await listTrainingSpecialties({
    config,
    resolveUuid: uuid => documents[uuid] ?? null,
    localize: value => value,
    isUuidAllowed: uuid => uuid !== "Item.plate"
  });
  assert.equal(choices.some(choice => choice.id === "plate"), false);
  assert.equal(choices.some(choice => choice.id === "shield"), true);
  assert.equal(choices.some(choice => choice.id === "lgt"), true);
  assert.equal(choices.some(choice => choice.kind === "weaponMastery" && choice.id === "dagger"), true);
});

test("specialty options follow the capability type, default to Any, and keep unknown stored values", async () => {
  const choices = await listTrainingSpecialties({
    config,
    resolveUuid: uuid => documents[uuid] ?? null,
    localize: value => value
  });
  const instructor = optionsFor("instructor", { choices });
  assert.deepEqual(
    instructor.groups.filter(group => group.label).map(group => group.label),
    ["Languages", "Skills", "Tools", "Weapons", "Armor", "Weapon Masteries"]
  );
  const any = instructor.groups[0].options[0];
  assert.deepEqual(any, { value: "", label: "Any", selected: true });
  const emptyInstructor = optionsFor("instructor", { choices: [] });
  assert.deepEqual(emptyInstructor.groups, [{ label: "", options: [{ value: "", label: "Any", selected: true }] }]);
  assert.equal(flatOptions(instructor).filter(option => option.selected).length, 1);
  const dagger = flatOptions(instructor).filter(option => option.value === "dagger");
  assert.equal(dagger.length, 2);
  assert.deepEqual(dagger.map(option => option.label), ["Dagger", "Dagger"]);
  assert.equal(flatOptions(instructor).some(option => option.value === "skillProficiency:ste"), false);
  assert.equal(flatOptions(instructor).some(option => option.value === "Stealth"), false);
  assert.equal(flatOptions(instructor).find(option => option.value === "ste").label, "Stealth");

  for (const typeId of ["forge", "marketplace", "alchemist", "library", "temple", "contractor", "workshop"]) {
    assert.equal(optionsFor(typeId, { choices, current: "smiths-tools" }), null, typeId);
  }
  assert.equal(buildSpecialtyOptions({ id: "oracle", supportsSpecialty: true }, { choices, current: "ste" }), null);

  const saved = optionsFor("instructor", { choices, current: "smiths-tools" });
  const savedFlat = flatOptions(saved);
  assert.equal(savedFlat.find(option => option.value === "").selected, false);
  assert.deepEqual(savedFlat.find(option => option.value === "smiths-tools"), {
    value: "smiths-tools",
    label: "smiths-tools",
    selected: true
  });
  assert.equal(savedFlat.filter(option => option.selected).length, 1);

  const weapon = optionsFor("instructor", { choices, current: "dagger" });
  const selectedDaggers = flatOptions(weapon).filter(option => option.value === "dagger" && option.selected);
  assert.equal(selectedDaggers.length, 1);
  assert.equal(weapon.groups.find(group => group.label === "Weapons").options.some(option => option.selected), true);
});

test("hidden specialty types keep the stored specialty on the editor row", async () => {
  const choices = await listTrainingSpecialties({ config, resolveUuid: uuid => documents[uuid] ?? null, localize: value => value });
  const types = registry();
  const rows = decorateCapabilityRows([
    { type: "instructor", tier: "common", specialty: "dwarvish", source: "guild charter" },
    { type: "forge", tier: "rare", specialty: "old-forge-note", source: "kept" }
  ], { resolveType: id => types.get(id), choices });
  assert.equal(rows[0].specialty, "dwarvish");
  assert.equal(rows[0].source, "guild charter");
  assert.equal(flatOptions(rows[0].specialtyOptions).find(option => option.value === "dwarvish").selected, true);
  assert.equal(rows[1].specialtyOptions, null);
  assert.equal(rows[1].specialty, "old-forge-note");
  assert.equal(rows[1].source, "kept");
});

test("builtin instructor advertises the training catalog and other types do not", () => {
  const types = registry();
  assert.equal(types.get("instructor").supportsSpecialty, true);
  assert.equal(types.get("instructor").specialtyCatalog, "training");
  for (const typeId of ["forge", "marketplace", "alchemist", "library", "temple", "contractor", "workshop"]) {
    assert.equal(types.get(typeId).supportsSpecialty, false, typeId);
    assert.equal(types.get(typeId).specialtyCatalog, null, typeId);
  }
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
  assert.equal(location.capabilities[0].specialty, "smiths-tools");
  assert.equal(location.capabilities[0].source, "guild charter");
  assert.equal(location.capabilities[1].specialty, null);
  assert.equal(location.capabilities[1].source, null);
});

test("capability editor labels Notes and posts the existing source field", () => {
  const template = readFileSync(new URL("../templates/location-manager.hbs", import.meta.url), "utf8");
  assert.match(template, /<span>Notes<\/span>\s*<input type="text" name="capabilities\.\{\{@index\}\}\.source"/);
  assert.match(template, /<select name="capabilities\.\{\{@index\}\}\.specialty">/);
  assert.match(template, /<input type="hidden" name="capabilities\.\{\{@index\}\}\.specialty"/);
  assert.match(template, /data-capability-type/);
  assert.doesNotMatch(template, /<span>Source<\/span>/);
});
