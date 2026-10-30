import { artisanSpecialtyOptions } from "./artisan-tools.js";
import { DND2024_SPECIALTIES } from "./fixed-specialties.js";
import { listForgeSpecialties, migrateForgeSpecialties } from "./forge-categories.js";
import { normalizeSpecialtyList } from "./location-domain.js";
import { finishSpecialtyGroups } from "./specialty-selection.js";

export { listForgeSpecialties };

/**
 * D&D 2024 training subjects: skills, languages, tools, weapons, armor, and weapon masteries.
 * A location stores `id`. Downtime matches that id to the training proficiency id.
 * An empty specialty means any subject. The list is fixed and does not follow Configure Sources.
 */
export const TRAINING_SPECIALTY_CATALOG = "training";
export const FORGE_SPECIALTY_CATALOG = "forge";

export const TRAINING_SPECIALTY_CATEGORIES = Object.freeze([
  "Language",
  "Skill Proficiency",
  "Tool Proficiency",
  "Weapon Proficiency",
  "Armor Proficiency",
  "Weapon Mastery"
]);

const GROUP_LABELS = Object.freeze({
  Language: "Languages",
  "Skill Proficiency": "Skills",
  "Tool Proficiency": "Tools",
  "Weapon Proficiency": "Weapons",
  "Armor Proficiency": "Armor",
  "Weapon Mastery": "Weapon Masteries"
});

const CATALOGS = new Set([TRAINING_SPECIALTY_CATALOG, FORGE_SPECIALTY_CATALOG]);

export function listTrainingSpecialties() {
  return DND2024_SPECIALTIES.slice();
}

function choicesFor(catalog, choices) {
  if (catalog === FORGE_SPECIALTY_CATALOG) return listForgeSpecialties();
  return choices ?? listTrainingSpecialties();
}

/**
 * Checkbox model for one capability type.
 * Returns null when the type has no specialty catalog, so the editor can hide Specialty and keep the stored value.
 * @returns {null | { summary: string, groups: Array<{ label: string, options: Array<{ value: string, label: string, selected: boolean }> }> }}
 */
export function buildSpecialtyOptions(definition, { choices, current = null } = {}) {
  const catalog = String(definition?.specialtyCatalog ?? "").trim();
  if (!CATALOGS.has(catalog)) return null;
  const buckets = new Map();
  for (const entry of choicesFor(catalog, choices)) {
    const id = String(entry?.id ?? "").trim();
    if (!id) continue;
    const category = String(entry?.category ?? "Other").trim() || "Other";
    const bucket = buckets.get(category) ?? [];
    if (bucket.some(option => option.value === id)) continue;
    bucket.push({ value: id, label: String(entry?.label ?? id).trim() || id, selected: false });
    buckets.set(category, bucket);
  }
  const orderedCategories = [
    ...TRAINING_SPECIALTY_CATEGORIES.filter(category => buckets.has(category)),
    ...[...buckets.keys()].filter(category => !TRAINING_SPECIALTY_CATEGORIES.includes(category))
  ];
  const groups = [];
  for (const category of orderedCategories) {
    const options = buckets.get(category).sort((left, right) =>
      left.label.localeCompare(right.label) || left.value.localeCompare(right.value)
    );
    if (options.length) groups.push({ label: GROUP_LABELS[category] ?? category, options });
  }
  return finishSpecialtyGroups(groups, current);
}

export function decorateCapabilityRows(capabilities = [], { resolveType = () => null, choices, capabilityTypeIds = null } = {}) {
  return (capabilities ?? []).map(capability => {
    const definition = resolveType(capability?.type) ?? null;
    const stored = normalizeSpecialtyList(capability?.specialty);
    const specialty = capability?.type === "forge" || definition?.specialtyCatalog === FORGE_SPECIALTY_CATALOG
      ? migrateForgeSpecialties(stored)
      : stored;
    const current = specialty;
    const catalog = definition?.specialtyCatalog ?? null;
    let specialtyOptions = null;
    if (catalog === TRAINING_SPECIALTY_CATALOG || catalog === FORGE_SPECIALTY_CATALOG) {
      specialtyOptions = buildSpecialtyOptions(definition, { choices, current });
    } else {
      const artisanOptions = { current, ...(capabilityTypeIds ? { capabilityTypeIds } : {}) };
      specialtyOptions = artisanSpecialtyOptions(capability?.type, artisanOptions);
      if (!specialtyOptions && catalog) {
        specialtyOptions = buildSpecialtyOptions(definition, { choices, current });
      }
    }
    return { ...capability, specialty, specialtyOptions };
  });
}
