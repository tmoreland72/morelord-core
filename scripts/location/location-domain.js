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

const UNRESTRICTED_SPECIALTY = new Set(["", "any"]);

export function isUnrestrictedSpecialty(value) {
  return UNRESTRICTED_SPECIALTY.has(String(value ?? "").trim().toLowerCase());
}

/** A legacy string, an array, empty, or Any all become the stored specialty keys. Empty means no restriction. */
export function normalizeSpecialtyList(value) {
  const raw = Array.isArray(value) ? value : [value];
  const keys = [];
  const seen = new Set();
  for (const entry of raw) {
    const key = String(entry ?? "").trim();
    if (!key || isUnrestrictedSpecialty(key) || seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
  }
  return keys;
}

export function capabilityAllowsSpecialty(capability, specialtyKey) {
  if (isUnrestrictedSpecialty(specialtyKey)) return true;
  const keys = normalizeSpecialtyList(capability?.specialty);
  if (!keys.length) return true;
  return keys.includes(String(specialtyKey).trim());
}

export function normalizeCapability(raw = {}) {
  const type = String(raw.type ?? "").trim();
  const tier = String(raw.tier ?? "common").trim();
  if (!type) throw new Error("A capability requires a type.");
  if (!TIER_RANK.has(tier)) throw new Error(`Unknown capability tier: ${tier}.`);
  return {
    type,
    tier,
    specialty: normalizeSpecialtyList(raw.specialty),
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

/**
 * True when any capability of `type` has no specialty restriction or includes `specialtyKey`.
 * Any or an empty specialtyKey is allowed by every capability of that type.
 * A location with no capability of that type returns false.
 */
export function locationAllowsSpecialty(location, type, specialtyKey) {
  const typeId = String(type ?? "").trim();
  if (!typeId || !location || typeof location !== "object") return false;
  const capabilities = Array.isArray(location.capabilities) ? location.capabilities : [];
  const matches = capabilities.filter(capability => String(capability?.type ?? "").trim() === typeId);
  if (!matches.length) return false;
  return matches.some(capability => capabilityAllowsSpecialty(capability, specialtyKey));
}

export function findCapability(capabilities = [], requirement = {}) {
  const type = String(requirement.type ?? "").trim();
  const specialty = requirement.specialty ? String(requirement.specialty).trim() : null;
  return capabilities
    .map(normalizeCapability)
    .filter(capability => capability.type === type)
    .filter(capability => !specialty || capabilityAllowsSpecialty(capability, specialty))
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
