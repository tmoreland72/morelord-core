export const SUBSCRIPTION_TIERS = Object.freeze(["standard", "premium", "champion"]);

export function normalizeSubscriptionTier(value) {
  const tier = String(value ?? "").trim().toLowerCase().replace(/^tools[-_]/, "");
  return SUBSCRIPTION_TIERS.includes(tier) ? tier : "standard";
}

export function capSubscriptionTier(requested, actual) {
  return SUBSCRIPTION_TIERS[Math.min(
    SUBSCRIPTION_TIERS.indexOf(normalizeSubscriptionTier(requested)),
    SUBSCRIPTION_TIERS.indexOf(normalizeSubscriptionTier(actual))
  )];
}

// Only retain known lower-tier grants when simulating a downgrade. Unknown
// grants must not accidentally carry Champion access into a lower tier.
const FEATURE_TIERS = new Map([
  ["encounters.standard", "standard"],
  ...[
    "encounters.premium", "marketplace.gm-approvals", "marketplace.shop-manager",
    "markplace.shop-manager", "craftworks.advanced-crafting", "craftworks.content-phb",
    "craftworks.content-dmg", "craftworks.content-mod", "potion-generator",
    "spell-scroll-generator"
  ].map(feature => [feature, "premium"])
]);

export function applySubscriptionTesting(entry, { enabled, tier, actualTier }) {
  if (!entry || !enabled) return entry;
  const effectiveTier = capSubscriptionTier(capSubscriptionTier(tier, actualTier), entry.tier);
  if (effectiveTier !== "standard" && effectiveTier === normalizeSubscriptionTier(entry.tier)) return { ...entry, tier: effectiveTier };
  const allowed = value => {
    const key = typeof value === "string" ? value : value?.id ?? value?.key ?? value?.slug;
    const minimum = FEATURE_TIERS.get(key);
    return minimum !== undefined && capSubscriptionTier(minimum, effectiveTier) === minimum;
  };
  return {
    ...entry,
    tier: effectiveTier,
    features: Array.isArray(entry.features) ? entry.features.filter(allowed) : [],
    entitlements: Array.isArray(entry.entitlements) ? entry.entitlements.filter(allowed) : []
  };
}
