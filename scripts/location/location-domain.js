export const SETTLEMENT_TYPES = Object.freeze([
  "road",
  "hamlet",
  "village",
  "town",
  "city",
  "metropolis",
  "other"
]);

export const CAPABILITY_TIERS = Object.freeze([
  "common",
  "uncommon",
  "rare",
  "veryRare",
  "legendary"
]);

const TIER_RANK = new Map(CAPABILITY_TIERS.map((tier, index) => [tier, index]));

export function meetsTier(actual, required) {
  const actualRank = TIER_RANK.get(String(actual ?? ""));
  const requiredRank = TIER_RANK.get(String(required ?? ""));
  return actualRank !== undefined && requiredRank !== undefined && actualRank >= requiredRank;
}

export function normalizeCapability(raw = {}) {
  const type = String(raw.type ?? "").trim();
  const tier = String(raw.tier ?? "common").trim();
  if (!type) throw new Error("A capability requires a type.");
  if (!TIER_RANK.has(tier)) throw new Error(`Unknown capability tier: ${tier}.`);
  return {
    type,
    tier,
    specialty: raw.specialty ? String(raw.specialty).trim() : null,
    source: raw.source ? String(raw.source).trim() : null
  };
}

export function normalizeLocation(raw = {}, { idFactory = () => crypto.randomUUID() } = {}) {
  const id = String(raw.id ?? idFactory()).trim();
  const name = String(raw.name ?? "").trim();
  const settlementType = String(raw.settlementType ?? "road").trim();
  if (!id) throw new Error("A location requires an id.");
  if (!name) throw new Error("A location requires a name.");
  if (!SETTLEMENT_TYPES.includes(settlementType)) {
    throw new Error(`Unknown settlement type: ${settlementType}.`);
  }
  return {
    id,
    name,
    settlementType,
    sceneIds: [...new Set((raw.sceneIds ?? []).map(String).filter(Boolean))],
    capabilities: (raw.capabilities ?? []).map(normalizeCapability),
    notes: String(raw.notes ?? ""),
    metadata: globalThis.structuredClone
      ? structuredClone(raw.metadata ?? {})
      : JSON.parse(JSON.stringify(raw.metadata ?? {}))
  };
}

export function findCapability(capabilities = [], requirement = {}) {
  const type = String(requirement.type ?? "").trim();
  const specialty = requirement.specialty ? String(requirement.specialty).trim() : null;
  return capabilities
    .map(normalizeCapability)
    .filter(capability => capability.type === type)
    .filter(capability => !specialty || capability.specialty === specialty)
    .sort((a, b) => TIER_RANK.get(b.tier) - TIER_RANK.get(a.tier))[0] ?? null;
}

export function evaluateRequirements(requirements = [], context = {}) {
  const location = context.location ?? null;
  const capabilities = [
    ...(location?.capabilities ?? []),
    ...(context.capabilities ?? [])
  ];
  const results = requirements.map((requirement, index) => {
    const kind = String(requirement.kind ?? "capability");
    if (kind === "settlement") {
      const allowed = requirement.types ?? [];
      const passed = Boolean(location && allowed.includes(location.settlementType));
      return { index, kind, passed, requirement, actual: location?.settlementType ?? null };
    }
    if (kind === "capability") {
      const match = findCapability(capabilities, requirement);
      const requiredTier = String(requirement.tier ?? "common");
      const passed = Boolean(match && meetsTier(match.tier, requiredTier));
      return { index, kind, passed, requirement, actual: match };
    }
    return { index, kind, passed: false, requirement, actual: null, reason: "unsupported-requirement" };
  });
  return { passed: results.every(result => result.passed), results };
}
