import test from "node:test";
import assert from "node:assert/strict";
import { evaluateRequirements, locationAllowsSpecialty, meetsTier, normalizeLocation, SETTLEMENT_TYPES } from "../scripts/location/location-domain.js";

test("capability tiers compare from Common through Legendary", () => {
  assert.equal(meetsTier("veryRare", "rare"), true);
  assert.equal(meetsTier("common", "rare"), false);
  assert.equal(meetsTier("rare", "rare"), true);
  assert.equal(meetsTier("unknown", "common"), false);
});

test("Rare Forge fails in Emberwood and passes in Neverwinter", () => {
  const emberwood = normalizeLocation({ id: "emberwood", name: "Emberwood", settlementType: "village", capabilities: [{ type: "forge", tier: "common" }] });
  const neverwinter = normalizeLocation({ id: "neverwinter", name: "Neverwinter", settlementType: "city", capabilities: [{ type: "forge", tier: "rare" }] });
  const requirement = [{ kind: "capability", type: "forge", tier: "rare" }];
  assert.equal(evaluateRequirements(requirement, { location: emberwood }).passed, false);
  assert.equal(evaluateRequirements(requirement, { location: neverwinter }).passed, true);
});

test("specialized capabilities require the matching specialty", () => {
  const location = normalizeLocation({ id: "academy", name: "Academy", settlementType: "city", capabilities: [{ type: "instructor", specialty: "smiths-tools", tier: "rare" }] });
  assert.equal(evaluateRequirements([{ kind: "capability", type: "instructor", specialty: "smiths-tools", tier: "common" }], { location }).passed, true);
  assert.equal(evaluateRequirements([{ kind: "capability", type: "instructor", specialty: "brewers-supplies", tier: "common" }], { location }).passed, false);
});

test("locationAllowsSpecialty treats Any or empty as every specialty", () => {
  const open = normalizeLocation({
    id: "open-forge",
    name: "Open Forge",
    settlementType: "town",
    capabilities: [{ type: "forge", tier: "common", specialty: null }]
  });
  assert.equal(locationAllowsSpecialty(open, "forge", "longsword"), true);
  assert.equal(locationAllowsSpecialty(open, "forge", ""), true);
  assert.equal(locationAllowsSpecialty(open, "forge", "Any"), true);
  assert.equal(locationAllowsSpecialty(open, "instructor", "ste"), false);
  assert.equal(locationAllowsSpecialty(null, "forge", "longsword"), false);
  assert.equal(locationAllowsSpecialty(open, "", "longsword"), false);

  const named = normalizeLocation({
    id: "sword-forge",
    name: "Sword Forge",
    settlementType: "town",
    capabilities: [
      { type: "forge", tier: "rare", specialty: "longsword" },
      { type: "instructor", tier: "common", specialty: "" }
    ]
  });
  assert.equal(locationAllowsSpecialty(named, "forge", "longsword"), true);
  assert.equal(locationAllowsSpecialty(named, "forge", "martialM"), true);
  assert.equal(locationAllowsSpecialty(named, "forge", "mar"), false);
  assert.equal(locationAllowsSpecialty(named, "forge", "weapon"), false);
  assert.equal(locationAllowsSpecialty(named, "forge", "dagger"), false);
  assert.equal(locationAllowsSpecialty(named, "forge", "simpleM"), false);
  assert.equal(locationAllowsSpecialty(named, "forge", "  longsword  "), true);
  assert.equal(locationAllowsSpecialty(named, "forge", ""), true);
  assert.equal(locationAllowsSpecialty(named, "instructor", "dwarvish"), true);
  assert.equal(evaluateRequirements([{ kind: "capability", type: "forge", specialty: "dagger", tier: "common" }], { location: named }).passed, false);

  const labeledAny = normalizeLocation({
    id: "any-forge",
    name: "Any Forge",
    settlementType: "village",
    capabilities: [{ type: "forge", tier: "common", specialty: " Any " }]
  });
  assert.deepEqual(labeledAny.capabilities[0].specialty, []);
  assert.equal(locationAllowsSpecialty(labeledAny, "forge", "whip"), true);
  assert.equal(evaluateRequirements([{ kind: "capability", type: "forge", specialty: "whip", tier: "common" }], { location: labeledAny }).passed, true);

  const mixed = {
    capabilities: [
      { type: "forge", specialty: "dagger" },
      { type: "forge", specialty: null }
    ]
  };
  assert.equal(locationAllowsSpecialty(mixed, "forge", "maul"), true);
  assert.equal(locationAllowsSpecialty({ capabilities: [{ type: "alchemist", specialty: "longsword" }] }, "forge", "longsword"), false);
});

test("a specialty array and a legacy string both match the included keys", () => {
  const location = normalizeLocation({
    id: "armory",
    name: "Armory",
    settlementType: "town",
    capabilities: [
      { type: "forge", tier: "uncommon", specialty: ["longsword", "Any", "longsword", " plate "] },
      { type: "instructor", tier: "common", specialty: "ste" },
      { type: "workshop", tier: "rare", specialty: ["cobbler", "weaver"] }
    ]
  });
  assert.deepEqual(location.capabilities[0].specialty, ["martialM", "hvy"]);
  assert.deepEqual(location.capabilities[1].specialty, ["ste"]);
  assert.deepEqual(location.capabilities[2].specialty, ["cobbler", "weaver"]);
  assert.equal(locationAllowsSpecialty(location, "forge", "longsword"), true);
  assert.equal(locationAllowsSpecialty(location, "forge", "plate"), true);
  assert.equal(locationAllowsSpecialty(location, "forge", "dagger"), false);
  assert.equal(locationAllowsSpecialty(location, "instructor", "ste"), true);
  assert.equal(locationAllowsSpecialty(location, "workshop", "weaver"), true);
  assert.equal(locationAllowsSpecialty(location, "workshop", "smith"), false);
  assert.equal(evaluateRequirements([{ kind: "capability", type: "forge", specialty: "plate", tier: "common" }], { location }).passed, true);
  assert.equal(evaluateRequirements([{ kind: "capability", type: "forge", specialty: "dagger", tier: "common" }], { location }).passed, false);
  assert.equal(evaluateRequirements([{ kind: "capability", type: "workshop", specialty: "cobbler", tier: "common" }], { location }).passed, true);
  assert.equal(evaluateRequirements([{ kind: "capability", type: "instructor", specialty: "ste", tier: "common" }], { location }).passed, true);
});

test("a saved alchemist capability becomes the Workshop specialty alchemist", () => {
  const only = normalizeLocation({
    id: "shop",
    name: "Shop",
    settlementType: "village",
    capabilities: [
      { type: "forge", tier: "common" },
      { type: "alchemist", tier: "not-a-tier", specialty: "potion", source: "Elara" },
      { type: "temple", tier: "common" }
    ]
  });
  assert.deepEqual(only.capabilities.map(capability => capability.type), ["forge", "workshop", "temple"]);
  const converted = only.capabilities[1];
  assert.deepEqual(converted.specialty, ["alchemist"]);
  assert.equal(converted.tier, "common");
  assert.equal(converted.source, "Elara");

  const merged = normalizeLocation({
    id: "bench",
    name: "Bench",
    settlementType: "town",
    capabilities: [
      { type: "workshop", tier: "common", specialty: ["cobbler"], source: "bench" },
      { type: "alchemist", tier: "rare", source: "Elara" },
      { type: "alchemist", tier: "uncommon" }
    ]
  });
  assert.equal(merged.capabilities.length, 1);
  assert.deepEqual(merged.capabilities[0].specialty, ["cobbler", "alchemist"]);
  assert.equal(merged.capabilities[0].tier, "rare");
  assert.equal(merged.capabilities[0].source, "bench");

  const open = normalizeLocation({
    id: "open",
    name: "Open",
    settlementType: "town",
    capabilities: [
      { type: "workshop", tier: "common", specialty: "Any", source: "hall" },
      { type: "workshop", tier: "uncommon", specialty: ["weaver"] },
      { type: "alchemist", tier: "legendary" }
    ]
  });
  assert.deepEqual(open.capabilities[0].specialty, []);
  assert.equal(open.capabilities[0].tier, "legendary");
  assert.equal(open.capabilities[0].source, "hall");
  assert.deepEqual(open.capabilities[1].specialty, ["weaver"]);
  assert.equal(open.capabilities[1].tier, "uncommon");

  const raw = { capabilities: [{ type: "alchemist", tier: "rare", specialty: "potion" }] };
  assert.equal(locationAllowsSpecialty(raw, "alchemist", "potion"), true);
  assert.equal(locationAllowsSpecialty(raw, "workshop", "alchemist"), true);
  assert.equal(locationAllowsSpecialty(raw, "workshop", "cobbler"), false);
  assert.equal(locationAllowsSpecialty({ capabilities: [{ type: "workshop", tier: "rare", specialty: ["cobbler"] }] }, "alchemist"), false);
  assert.equal(locationAllowsSpecialty({ capabilities: [{ type: "workshop", tier: "common", specialty: [] }] }, "alchemist", ""), true);
  assert.equal(locationAllowsSpecialty({ capabilities: [{ type: "instructor", specialty: ["alchemist"] }] }, "instructor", "alchemist"), true);
  assert.equal(evaluateRequirements([{ kind: "capability", type: "alchemist", tier: "rare" }], { location: raw }).passed, true);
  assert.equal(evaluateRequirements([{ kind: "capability", type: "alchemist", tier: "rare" }], {
    location: { capabilities: [{ type: "workshop", tier: "uncommon", specialty: ["alchemist"] }] }
  }).passed, false);
  assert.equal(evaluateRequirements([{ kind: "capability", type: "alchemist", tier: "uncommon" }], {
    location: { capabilities: [{ type: "workshop", tier: "rare", specialty: "Any" }] }
  }).passed, true);
});

test("a saved contractor capability is dropped and the rest of the location loads", () => {
  const location = normalizeLocation({
    id: "phandalin",
    name: "Phandalin",
    settlementType: "village",
    capabilities: [
      { type: "contractor", tier: "not-a-tier", specialty: "mason" },
      { type: "temple", tier: "uncommon" },
      { type: "library", tier: "rare", specialty: "kept" }
    ]
  });
  assert.deepEqual(location.capabilities.map(capability => capability.type), ["temple", "library"]);
  assert.equal(locationAllowsSpecialty(location, "contractor", "mason"), false);
  assert.equal(location.capabilities.find(capability => capability.type === "library").specialty[0], "kept");
  assert.equal(evaluateRequirements([{ kind: "capability", type: "temple", tier: "common" }], { location }).passed, true);
});

test("Other supports special locations such as strongholds and garrisons", () => {
  assert.equal(SETTLEMENT_TYPES.includes("other"), true);
  const stronghold = normalizeLocation({ id: "stronghold", name: "The Stronghold", settlementType: "other" });
  assert.equal(stronghold.settlementType, "other");
});
