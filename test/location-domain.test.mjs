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
  assert.equal(locationAllowsSpecialty(named, "forge", "dagger"), false);
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
  assert.equal(labeledAny.capabilities[0].specialty, "Any");
  assert.equal(locationAllowsSpecialty(labeledAny, "forge", "whip"), true);

  const mixed = {
    capabilities: [
      { type: "forge", specialty: "dagger" },
      { type: "forge", specialty: null }
    ]
  };
  assert.equal(locationAllowsSpecialty(mixed, "forge", "maul"), true);
  assert.equal(locationAllowsSpecialty({ capabilities: [{ type: "alchemist", specialty: "longsword" }] }, "forge", "longsword"), false);
});

test("Other supports special locations such as strongholds and garrisons", () => {
  assert.equal(SETTLEMENT_TYPES.includes("other"), true);
  const stronghold = normalizeLocation({ id: "stronghold", name: "The Stronghold", settlementType: "other" });
  assert.equal(stronghold.settlementType, "other");
});
