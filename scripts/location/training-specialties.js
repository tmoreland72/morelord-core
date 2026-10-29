import { isUuidAllowed as coreUuidAllowed } from "../services/allowed-packs.js";

/**
 * D&D 2024 training subjects used by Downtime's Dnd5eProficiencyAdapter.listTrainingChoices:
 * skills, languages, tools, weapons, armor (including shields), and weapon masteries of those weapons.
 * A location stores `id`. Downtime matches that id to the training proficiency id, and treats an empty specialty as any subject.
 * Compendium documents whose pack Configure Sources excludes are omitted.
 */
export const TRAINING_SPECIALTY_CATALOG = "training";

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

const titleCase = value => String(value)
  .replace(/([a-z])([A-Z])/g, "$1 $2")
  .replace(/(^|\s)\S/g, letter => letter.toUpperCase());

function defaultConfig() {
  return globalThis.CONFIG?.DND5E ?? {};
}

function defaultLocalize(key) {
  try {
    const localize = globalThis.game?.i18n?.localize;
    if (typeof localize === "function") return localize(key);
  } catch {
    // A missing translation leaves the config key as the label.
  }
  return key;
}

function defaultResolveUuid(uuid) {
  const resolve = globalThis.fromUuid;
  if (typeof resolve !== "function") return null;
  return Promise.resolve(resolve(uuid)).catch(() => null);
}

function defaultUuidAllowed(uuid) {
  if (!globalThis.game?.system) return true;
  return coreUuidAllowed(uuid);
}

function choice(kind, id, label, category) {
  const proficiencyId = String(id ?? "").trim();
  if (!proficiencyId) return null;
  const text = String(label ?? proficiencyId).trim() || proficiencyId;
  return {
    kind,
    id: proficiencyId,
    label: text,
    category,
    trainingValue: `${kind}:${proficiencyId}`
  };
}

function documentAllowed(uuid, isUuidAllowed) {
  if (!uuid) return true;
  try {
    return isUuidAllowed(uuid) !== false;
  } catch {
    return false;
  }
}

/**
 * @returns {Promise<Array<{ kind: string, id: string, label: string, category: string, trainingValue: string }>>}
 */
export async function listTrainingSpecialties({
  config = defaultConfig,
  resolveUuid = defaultResolveUuid,
  localize = defaultLocalize,
  isUuidAllowed = defaultUuidAllowed
} = {}) {
  const dnd = (typeof config === "function" ? config() : config) ?? {};
  const entries = new Map();
  const add = entry => {
    if (entry) entries.set(`${entry.kind}:${entry.id}`, entry);
  };
  const addConfig = (values, kind, category) => {
    for (const [id, data] of Object.entries(values ?? {})) {
      const rawLabel = typeof data === "string" ? data : data?.label ?? id;
      add(choice(kind, id, localize(rawLabel), category));
    }
  };
  const addDocuments = async (values, kind, category) => {
    for (const [id, data] of Object.entries(values ?? {})) {
      const uuid = typeof data === "string" ? data : data?.id;
      if (!documentAllowed(uuid, isUuidAllowed)) continue;
      let document = null;
      if (uuid) {
        try {
          document = await Promise.resolve(resolveUuid(uuid));
        } catch {
          document = null;
        }
      }
      const fallback = typeof data === "object" && data?.label ? localize(data.label) : titleCase(id);
      add(choice(kind, id, document?.name ?? fallback, category));
    }
  };

  addConfig(dnd.skills, "skillProficiency", "Skill Proficiency");
  addConfig(dnd.enrichmentLookup?.languages, "language", "Language");
  addConfig(dnd.armorProficiencies, "armorProficiency", "Armor Proficiency");
  await addDocuments({ ...(dnd.armorIds ?? {}), ...(dnd.shieldIds ?? {}) }, "armorProficiency", "Armor Proficiency");
  addConfig(dnd.weaponProficiencies, "weaponProficiency", "Weapon Proficiency");
  await addDocuments(dnd.weaponIds, "weaponProficiency", "Weapon Proficiency");
  await addDocuments(dnd.weaponIds, "weaponMastery", "Weapon Mastery");
  addConfig(dnd.toolProficiencies, "toolProficiency", "Tool Proficiency");
  await addDocuments(dnd.tools, "toolProficiency", "Tool Proficiency");

  return [...entries.values()].sort((left, right) =>
    left.label.localeCompare(right.label)
    || left.category.localeCompare(right.category)
    || left.kind.localeCompare(right.kind)
  );
}

/**
 * Dropdown model for one capability type.
 * Returns null when the type has no specialty catalog, so the editor can hide Specialty and keep the stored value.
 * @returns {null | { groups: Array<{ label: string, options: Array<{ value: string, label: string, selected: boolean }> }> }}
 */
export function buildSpecialtyOptions(definition, { choices = [], current = null } = {}) {
  const catalog = String(definition?.specialtyCatalog ?? "").trim();
  if (!catalog) return null;
  const currentValue = current == null ? "" : String(current).trim();
  const relevant = catalog === TRAINING_SPECIALTY_CATALOG ? choices : [];
  const buckets = new Map();
  for (const entry of relevant) {
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
  const groups = [{ label: "", options: [{ value: "", label: "Any", selected: false }] }];
  for (const category of orderedCategories) {
    const options = buckets.get(category).sort((left, right) =>
      left.label.localeCompare(right.label) || left.value.localeCompare(right.value)
    );
    if (options.length) groups.push({ label: GROUP_LABELS[category] ?? category, options });
  }
  const known = new Set(groups.flatMap(group => group.options.map(option => option.value)).filter(Boolean));
  if (currentValue && !known.has(currentValue)) {
    groups[0].options.push({ value: currentValue, label: currentValue, selected: false });
  }
  let matched = false;
  for (const group of groups) {
    for (const option of group.options) {
      option.selected = !matched && option.value === currentValue;
      if (option.selected) matched = true;
    }
  }
  return { groups };
}

export function decorateCapabilityRows(capabilities = [], { resolveType = () => null, choices = [] } = {}) {
  return (capabilities ?? []).map(capability => ({
    ...capability,
    specialtyOptions: buildSpecialtyOptions(resolveType(capability?.type), {
      choices,
      current: capability?.specialty
    })
  }));
}
