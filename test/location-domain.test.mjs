import test from "node:test";
import assert from "node:assert/strict";
import { evaluateRequirements, meetsTier, normalizeLocation } from "../scripts/location/location-domain.js";

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
