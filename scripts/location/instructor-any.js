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

const BY_GROUP = new Map(INSTRUCTOR_GROUP_ANY.map(entry => [entry.group, entry]));
const BY_CATEGORY = new Map(INSTRUCTOR_GROUP_ANY.map(entry => [entry.category, entry]));
const BY_KEY = new Map(INSTRUCTOR_GROUP_ANY.map(entry => [entry.key, entry]));

export function instructorGroupAny(groupLabel) {
  return BY_GROUP.get(groupLabel) ?? null;
}

/** True when a stored Instructor list allows this subject, including a group Any such as any-language. */
export function instructorSpecialtyAllowed(storedKeys, specialtyKey) {
  const requested = String(specialtyKey ?? "").trim();
  if (!requested) return true;
  if (storedKeys.includes(requested)) return true;
  if (BY_KEY.has(requested) && storedKeys.includes(requested)) return true;
  const categories = DND2024_SPECIALTIES.filter(entry => entry.id === requested).map(entry => entry.category);
  return categories.some(category => {
    const any = BY_CATEGORY.get(category);
    return any ? storedKeys.includes(any.key) : false;
  });
}
