import test from "node:test";
import assert from "node:assert/strict";
import { CapabilityRegistry, BUILTIN_CAPABILITY_TYPES } from "../scripts/location/capability-registry.js";
import { decorateCapabilityRows } from "../scripts/location/training-specialties.js";
import {
  ARTISAN_TOOLS,
  artisanSpecialtyOptions,
  listArtisanToolsForCapability,
  listWorkshopSpecialties,
  toolCapabilityType
} from "../scripts/location/artisan-tools.js";

const WORKSHOP_LABELS = [
  "Brewer's Supplies",
  "Calligrapher's Supplies",
  "Carpenter's Tools",
  "Cartographer's Tools",
  "Cobbler's Tools",
  "Cook's Utensils",
  "Glassblower's Tools",
  "Jeweler's Tools",
  "Leatherworker's Tools",
  "Mason's Tools",
  "Painter's Supplies",
  "Potter's Tools",
  "Tinker's Tools",
  "Weaver's Tools",
  "Woodcarver's Tools"
];

function flat(model) {
  return model.groups.flatMap(group => group.options);
}

test("artisan tools map to Forge, Alchemist, or Workshop, and Tavern takes brewing and cooking when registered", () => {
  assert.equal(ARTISAN_TOOLS.length, 17);
  assert.equal(toolCapabilityType("Smith's Tools"), "forge");
  assert.equal(toolCapabilityType("smith"), "forge");
  assert.equal(toolCapabilityType("Blacksmith’s Tools"), "forge");
  assert.equal(toolCapabilityType("Alchemist's Supplies"), "alchemist");
  assert.equal(toolCapabilityType("alchemist"), "alchemist");
  assert.equal(toolCapabilityType("Cobbler's Tools"), "workshop");
  assert.equal(toolCapabilityType("carpenter"), "workshop");
  assert.equal(toolCapabilityType("mason"), "workshop");
  assert.equal(toolCapabilityType("calligrapher"), "workshop");
  assert.equal(toolCapabilityType("cartographer"), "workshop");
  assert.equal(toolCapabilityType("Brewer's Supplies"), "workshop");
  assert.equal(toolCapabilityType("Cook's Utensils"), "workshop");
  assert.equal(toolCapabilityType("lute"), null);
  assert.equal(toolCapabilityType(""), null);

  assert.deepEqual(listWorkshopSpecialties().map(tool => tool.label), WORKSHOP_LABELS);
  assert.deepEqual(listWorkshopSpecialties().map(tool => tool.id), [
    "brewer", "calligrapher", "carpenter", "cartographer", "cobbler", "cook", "glassblower",
    "jeweler", "leatherworker", "mason", "painter", "potter", "tinker", "weaver", "woodcarver"
  ]);
  assert.deepEqual(listArtisanToolsForCapability("forge").map(tool => tool.id), ["smith"]);
  assert.deepEqual(listArtisanToolsForCapability("alchemist").map(tool => tool.id), ["alchemist"]);
  assert.equal(artisanSpecialtyOptions("forge"), null);
  assert.equal(artisanSpecialtyOptions("alchemist"), null);

  const withTavern = [...BUILTIN_CAPABILITY_TYPES.map(type => type.id), "tavern"];
  assert.equal(toolCapabilityType("brewer", { capabilityTypeIds: withTavern }), "tavern");
  assert.equal(toolCapabilityType("cook", { capabilityTypeIds: withTavern }), "tavern");
  assert.equal(listWorkshopSpecialties({ capabilityTypeIds: withTavern }).some(tool => tool.id === "brewer" || tool.id === "cook"), false);
  const tavern = artisanSpecialtyOptions("tavern", { capabilityTypeIds: withTavern });
  assert.deepEqual(flat(tavern).filter(option => option.value).map(option => option.value), ["brewer", "cook"]);
  assert.equal(flat(tavern)[0].label, "Any");
  assert.equal(flat(tavern)[0].selected, true);
});

test("Workshop specialty stores the tool id, defaults to Any, and keeps an unknown value", () => {
  const types = new CapabilityRegistry();
  for (const definition of BUILTIN_CAPABILITY_TYPES) types.register(definition);
  const rows = decorateCapabilityRows([
    { type: "workshop", tier: "common", specialty: null, source: "bench" },
    { type: "workshop", tier: "rare", specialty: "old-loom", source: null },
    { type: "forge", tier: "common", specialty: "smith", source: null }
  ], {
    resolveType: id => types.get(id),
    capabilityTypeIds: types.all().map(type => type.id)
  });
  const workshop = flat(rows[0].specialtyOptions);
  assert.equal(workshop[0], workshop.find(option => option.label === "Any"));
  assert.equal(workshop[0].selected, true);
  assert.equal(workshop.find(option => option.label === "Cobbler's Tools").value, "cobbler");
  assert.equal(workshop.some(option => option.value === "smith" || option.value === "alchemist"), false);
  assert.deepEqual(workshop.filter(option => option.value).map(option => option.label), WORKSHOP_LABELS.slice().sort((a, b) => a.localeCompare(b)));

  const saved = flat(rows[1].specialtyOptions);
  assert.equal(saved.find(option => option.value === "").selected, false);
  assert.deepEqual(saved.find(option => option.value === "old-loom"), {
    value: "old-loom",
    label: "old-loom",
    selected: true
  });
  assert.equal(rows[1].source, null);
  assert.equal(rows[2].specialtyOptions, null);
  assert.equal(rows[2].specialty, "smith");
});
