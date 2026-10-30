import { DND2024_SPECIALTIES } from "./fixed-specialties.js";

/** Group-level Any keys for an Instructor. The label is the one shown in Select Specialty. */
export const INSTRUCTOR_GROUP_ANY = Object.freeze([
  { key: "any-language", category: "Language", group: "Languages", label: "Any Language" },
  { key: "any-skill", category: "Skill Proficiency", group: "Skills", label: "Any Skill" },
  { key: "any-tool", category: "Tool Proficiency", group: "Tools", label: "Any Tool" },
  { key: "any-weapon", category: "Weapon Proficiency", group: "Weapons", label: "Any Weapon" },
  { key: "any-armor", category: "Armor Proficiency", group: "Armor", label: "Any Armor" },
  { key: "any-mastery", category: "Weapon Mastery", group: "Weapon Masteries", label: "Any Weapon Mastery" }
]);

/** Older worlds stored Common Sign Language as these ids. The catalog id is `sign`. */
const LEGACY_INSTRUCTOR_IDS = Object.freeze({
  commonSign: "sign",
  commonsign: "sign",
  "common-sign": "sign",
  signlanguage: "sign",
  csl: "sign"
});

export function canonicalInstructorId(id) {
  const key = String(id ?? "").trim();
  return LEGACY_INSTRUCTOR_IDS[key] ?? key;
}

/** Member ids plus legacy aliases, so a stored `sign` is covered by Any Language. */
export function instructorCoverIds(memberIds = []) {
  const covers = new Set(memberIds.map(id => canonicalInstructorId(id)).filter(Boolean));
  for (const [legacy, canonical] of Object.entries(LEGACY_INSTRUCTOR_IDS)) {
    if (covers.has(canonical)) covers.add(legacy);
  }
  if (covers.has("sign")) covers.add("sign");
  return [...covers];
}

export function normalizeInstructorSpecialties(keys = []) {
  const seen = new Set();
  const normalized = [];
  for (const key of keys) {
    const canonical = canonicalInstructorId(key);
    if (!canonical || canonical === "*" || seen.has(canonical)) continue;
    seen.add(canonical);
    normalized.push(canonical);
  }
  return normalized;
}

const BY_GROUP = new Map(INSTRUCTOR_GROUP_ANY.map(entry => [entry.group, entry]));
const BY_CATEGORY = new Map(INSTRUCTOR_GROUP_ANY.map(entry => [entry.category, entry]));
const BY_KEY = new Map(INSTRUCTOR_GROUP_ANY.map(entry => [entry.key, entry]));

export function instructorGroupAny(groupLabel) {
  return BY_GROUP.get(groupLabel) ?? null;
}

/** True when a stored Instructor list allows this subject, including a group Any such as any-language. */
export function instructorSpecialtyAllowed(storedKeys, specialtyKey) {
  const requested = canonicalInstructorId(specialtyKey);
  if (!requested) return true;
  if (storedKeys.map(canonicalInstructorId).includes(requested)) return true;
  if (BY_KEY.has(requested) && storedKeys.includes(requested)) return true;
  const categories = DND2024_SPECIALTIES.filter(entry => entry.id === requested).map(entry => entry.category);
  return categories.some(category => {
    const any = BY_CATEGORY.get(category);
    return any ? storedKeys.includes(any.key) : false;
  });
}
