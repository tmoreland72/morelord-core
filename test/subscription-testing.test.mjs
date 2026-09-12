import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SUBSCRIPTION_TIERS, capSubscriptionTier, applySubscriptionTesting } from "../scripts/services/subscription-testing.js";

test("every requested level is capped by both account and product access", () => {
  for (const actualTier of SUBSCRIPTION_TIERS) {
    for (const productTier of SUBSCRIPTION_TIERS) {
      for (const tier of SUBSCRIPTION_TIERS) {
        const result = applySubscriptionTesting({ tier: productTier }, { enabled: true, tier, actualTier });
        assert.equal(result.tier, SUBSCRIPTION_TIERS[Math.min(
          ...[actualTier, productTier, tier].map(value => SUBSCRIPTION_TIERS.indexOf(value))
        )]);
      }
    }
  }
  assert.equal(capSubscriptionTier("champion", undefined), "standard");
  assert.equal(capSubscriptionTier("invalid", "champion"), "standard");
  assert.equal(capSubscriptionTier("tools-champion", "tools_premium"), "premium");
});

test("downgrades filter grants without adding any or mutating the real snapshot", () => {
  const entry = {
    tier: "champion", expiresAt: "2030-01-01",
    features: ["encounters.standard", "encounters.premium", "unknown-champion-feature"],
    entitlements: [{ id: "encounters.premium" }, { key: "unknown-champion-feature" }]
  };
  const before = structuredClone(entry);
  const options = { enabled: true, actualTier: "champion" };
  const premium = applySubscriptionTesting(entry, { ...options, tier: "premium" });
  assert.deepEqual(premium.features, ["encounters.standard", "encounters.premium"]);
  assert.deepEqual(premium.entitlements, [{ id: "encounters.premium" }]);
  const standard = applySubscriptionTesting(entry, { ...options, tier: "standard" });
  assert.deepEqual(standard.features, ["encounters.standard"]);
  assert.deepEqual(standard.entitlements, []);
  assert.deepEqual(entry, before);
  assert.equal(applySubscriptionTesting(entry, { enabled: false }), entry);
  assert.equal(applySubscriptionTesting(null, options), null);
  assert.deepEqual(applySubscriptionTesting(entry, { ...options, tier: "champion" }), entry);
  assert.deepEqual(applySubscriptionTesting({ tier: "champion", features: [] }, { ...options, tier: "premium" }).features, []);
});

test("an account downgrade or lost account validation clamps an already saved selection", () => {
  const entry = { tier: "champion", features: ["encounters.premium"] };
  assert.equal(applySubscriptionTesting(entry, { enabled: true, tier: "champion", actualTier: "premium" }).tier, "premium");
  const expiredAccount = applySubscriptionTesting(entry, { enabled: true, tier: "champion", actualTier: undefined });
  assert.equal(expiredAccount.tier, "standard");
  assert.deepEqual(expiredAccount.features, []);
});

test("Standard removes paid grants even when the original tier already says Standard", () => {
  const result = applySubscriptionTesting({ tier: "standard", features: ["marketplace.gm-approvals"] },
    { enabled: true, tier: "standard", actualTier: "champion" });
  assert.deepEqual(result.features, []);
});

test("Core applies one world selection to every product, including refresh results", async () => {
  const source = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
  const products = ["core", "character-export", "craftworks", "downtime", "encounters", "journeys", "marketplace"]
    .map(name => `morelord-${name}`);
  const entry = { tier: "champion", features: ["encounters.standard", "encounters.premium", "marketplace.gm-approvals"], expiresAt: new Date(Date.now() + 86400000).toISOString() };
  const cache = Object.fromEntries(products.map(product => [product, structuredClone(entry)]));
  const values = { entitlementCache: cache, developerMode: true, developerTier: "standard", installationToken: "test" };
  const game = { user: { isGM: true }, modules: new Map(), settings: {
    get: (_module, key) => values[key],
    set: async (_module, key, value) => { values[key] = value; }
  } };
  // Exercise the actual Core cache/read/refresh functions without booting Foundry UI.
  const createApi = new Function("game", "foundry", "Hooks", "applySubscriptionTesting", "request", `
    const MODULE_ID = "morelord-core", PRODUCT_SLUG = MODULE_ID, CACHE_GRACE_MS = 7 * 86400000;
    const SETTINGS = { ENTITLEMENT_CACHE: "entitlementCache", DEVELOPER_MODE: "developerMode", DEVELOPER_TIER: "developerTier", TOKEN: "installationToken", SHARE_USAGE: "shareUsageStatistics" };
    const notify = () => {};
    ${source.slice(source.indexOf("function getCache()"), source.indexOf("function packageDiagnostics("))}
    return { getTier, getEntitlements, hasFeature, refresh: refreshEntitlements };
  `);
  const api = createApi(game, { utils: { deepClone: structuredClone } }, { callAll() {} }, applySubscriptionTesting, async () => structuredClone(entry));
  for (const product of products) {
    assert.equal(api.getTier(product), "standard");
    assert.equal(api.hasFeature("marketplace.gm-approvals", product), false);
    assert.equal((await api.refresh(product)).tier, "standard");
    assert.equal(values.entitlementCache[product].tier, "champion");
  }
  values.developerTier = "premium";
  for (const product of products) assert.equal(api.getTier(product), "premium");
  values.entitlementCache["morelord-core"].tier = "standard";
  for (const product of products) assert.equal(api.getTier(product), "standard");
  game.user.isGM = false;
  assert.equal((await api.refresh("morelord-marketplace")).tier, "standard");
  values.developerMode = false;
  assert.equal(api.getTier("morelord-marketplace"), "champion");
  values.entitlementCache["morelord-marketplace"].expiresAt = "2000-01-01";
  assert.equal(await api.refresh("morelord-marketplace"), null);
});
