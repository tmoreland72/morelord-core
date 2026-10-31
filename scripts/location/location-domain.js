import { forgeAncestors, migrateForgeSpecialties } from "./forge-categories.js";
import { instructorSpecialtyAllowed, normalizeInstructorSpecialties } from "./instructor-any.js";

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

const UNRESTRICTED_SPECIALTY = new Set(["", "any", "*"]);

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
  const type = String(capability?.type ?? "").trim();
  const stored = type === "forge"
    ? migrateForgeSpecialties(normalizeSpecialtyList(capability?.specialty))
    : normalizeSpecialtyList(capability?.specialty);
  if (!stored.length) return true;
  const requested = String(specialtyKey).trim();
  if (type === "instructor") return instructorSpecialtyAllowed(stored, requested);
  if (type !== "forge") return stored.includes(requested);
  const accepted = new Set(forgeAncestors(requested));
  if (!accepted.size) return stored.includes(requested);
  return stored.some(key => accepted.has(key));
}

export function normalizeCapability(raw = {}) {
  const type = String(raw.type ?? "").trim();
  const tier = String(raw.tier ?? "common").trim();
  if (!type) throw new Error("A capability requires a type.");
  if (!TIER_RANK.has(tier)) throw new Error(`Unknown capability tier: ${tier}.`);
  const specialty = normalizeSpecialtyList(raw.specialty);
  const normalized = type === "forge"
    ? migrateForgeSpecialties(specialty)
    : type === "instructor"
      ? normalizeInstructorSpecialties(specialty)
      : specialty;
  return {
    type,
    tier,
    specialty: normalized,
    source: raw.source ? String(raw.source).trim() : null
  };
}

const REMOVED_CAPABILITY_TYPES = new Set(["contractor"]);
const ALCHEMIST_SPECIALTY = "alchemist";

function higherTier(left, right) {
  const leftTier = String(left ?? "").trim();
  const rightTier = String(right ?? "").trim();
  const leftRank = TIER_RANK.get(leftTier);
  const rightRank = TIER_RANK.get(rightTier);
  if (leftRank === undefined) return rightRank === undefined ? "common" : rightTier;
  if (rightRank === undefined) return leftTier;
  return rightRank > leftRank ? rightTier : leftTier;
}

/**
 * An Alchemist capability becomes the Workshop specialty `alchemist`.
 * An existing Workshop set to Any stays Any. The tier is the higher of the two.
 * A limited Workshop gains `alchemist` on its first row, or on an Any row when one exists.
 */
export function migrateAlchemistCapabilities(capabilities = []) {
  const rows = Array.isArray(capabilities) ? capabilities : [];
  if (!rows.some(row => String(row?.type ?? "").trim() === "alchemist")) return rows;
  const alchemistRows = rows.filter(row => String(row?.type ?? "").trim() === "alchemist");
  const bestTier = alchemistRows.reduce((tier, row) => higherTier(tier, row?.tier), "common");
  const kept = rows.filter(row => String(row?.type ?? "").trim() !== "alchemist");
  const anyIndex = kept.findIndex(row => String(row?.type ?? "").trim() === "workshop" && !normalizeSpecialtyList(row?.specialty).length);
  const workshopIndex = anyIndex >= 0
    ? anyIndex
    : kept.findIndex(row => String(row?.type ?? "").trim() === "workshop");
  if (workshopIndex === -1) {
    const donor = alchemistRows[0] ?? {};
    const workshop = {
      type: "workshop",
      tier: bestTier,
      specialty: [ALCHEMIST_SPECIALTY],
      source: donor.source ?? null
    };
    const result = [];
    let placed = false;
    for (const row of rows) {
      if (String(row?.type ?? "").trim() === "alchemist") {
        if (!placed) {
          result.push(workshop);
          placed = true;
        }
        continue;
      }
      result.push(row);
    }
    return result;
  }
  return kept.map((row, index) => {
    if (index !== workshopIndex) return row;
    const specialty = normalizeSpecialtyList(row.specialty);
    return {
      ...row,
      tier: higherTier(row.tier, bestTier),
      specialty: specialty.length && !specialty.includes(ALCHEMIST_SPECIALTY)
        ? [...specialty, ALCHEMIST_SPECIALTY]
        : specialty
    };
  });
}

/** Drop capability types that are no longer offered. A contractor row is ignored. */
export function withoutRemovedCapabilities(capabilities = []) {
  return (Array.isArray(capabilities) ? capabilities : []).filter(capability => {
    return !REMOVED_CAPABILITY_TYPES.has(String(capability?.type ?? "").trim());
  });
}

function presentCapabilities(capabilities = []) {
  return migrateAlchemistCapabilities(withoutRemovedCapabilities(capabilities));
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
    capabilities: presentCapabilities(raw.capabilities).map(normalizeCapability),
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
 * A check for type `alchemist` is a Workshop check for the specialty `alchemist`.
 */
export function locationAllowsSpecialty(location, type, specialtyKey) {
  let typeId = String(type ?? "").trim();
  let key = specialtyKey;
  if (typeId === "alchemist") {
    typeId = "workshop";
    key = ALCHEMIST_SPECIALTY;
  }
  if (!typeId || !location || typeof location !== "object") return false;
  const capabilities = presentCapabilities(location.capabilities);
  const matches = capabilities.filter(capability => String(capability?.type ?? "").trim() === typeId);
  if (!matches.length) return false;
  return matches.some(capability => capabilityAllowsSpecialty(capability, key));
}

export function findCapability(capabilities = [], requirement = {}) {
  let type = String(requirement.type ?? "").trim();
  let specialty = requirement.specialty ? String(requirement.specialty).trim() : null;
  if (type === "alchemist") {
    type = "workshop";
    specialty = ALCHEMIST_SPECIALTY;
  }
  return presentCapabilities(capabilities)
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
