/**
 * D&D 2024 / SRD 5.2 artisan's tools.
 * `id` is the dnd5e tool key, the same kind of id Instructor stores for a training specialty.
 * `capabilityTypes` are checked in order against registered capability types.
 * Workshop is the fallback, so a tool leaves Workshop only when a more specific type is registered.
 * Forge is smithing for this tool map. The Forge specialty dropdown is the fixed weapon, armor, and mastery list, not Smith's Tools.
 * Alchemist is alchemist's supplies. Tavern, when a module registers it, is brewing and cooking.
 * Carpenter's Tools and Mason's Tools stay on Workshop: Contractor is not those crafts.
 * Calligrapher's Supplies and Cartographer's Tools stay on Workshop: Library is not those crafts.
 */
export const ARTISAN_TOOLS = Object.freeze([
  { id: "alchemist", label: "Alchemist's Supplies", capabilityTypes: Object.freeze(["alchemist"]) },
  { id: "brewer", label: "Brewer's Supplies", capabilityTypes: Object.freeze(["tavern"]) },
  { id: "calligrapher", label: "Calligrapher's Supplies", capabilityTypes: Object.freeze([]) },
  { id: "carpenter", label: "Carpenter's Tools", capabilityTypes: Object.freeze([]) },
  { id: "cartographer", label: "Cartographer's Tools", capabilityTypes: Object.freeze([]) },
  { id: "cobbler", label: "Cobbler's Tools", capabilityTypes: Object.freeze([]) },
  { id: "cook", label: "Cook's Utensils", capabilityTypes: Object.freeze(["tavern"]) },
  { id: "glassblower", label: "Glassblower's Tools", capabilityTypes: Object.freeze([]) },
  { id: "jeweler", label: "Jeweler's Tools", capabilityTypes: Object.freeze([]) },
  { id: "leatherworker", label: "Leatherworker's Tools", capabilityTypes: Object.freeze([]) },
  { id: "mason", label: "Mason's Tools", capabilityTypes: Object.freeze([]) },
  { id: "painter", label: "Painter's Supplies", capabilityTypes: Object.freeze([]) },
  { id: "potter", label: "Potter's Tools", capabilityTypes: Object.freeze([]) },
  { id: "smith", label: "Smith's Tools", capabilityTypes: Object.freeze(["forge"]), aliases: Object.freeze(["Blacksmith's Tools"]) },
  { id: "tinker", label: "Tinker's Tools", capabilityTypes: Object.freeze([]) },
  { id: "weaver", label: "Weaver's Tools", capabilityTypes: Object.freeze([]) },
  { id: "woodcarver", label: "Woodcarver's Tools", capabilityTypes: Object.freeze([]) }
]);

const DEFAULT_CAPABILITY_TYPE_IDS = Object.freeze([
  "forge",
  "marketplace",
  "alchemist",
  "library",
  "temple",
  "contractor",
  "instructor",
  "workshop"
]);

const TOOLS_BY_KEY = new Map();
for (const tool of ARTISAN_TOOLS) {
  for (const name of [tool.id, tool.label, ...(tool.aliases ?? [])]) {
    TOOLS_BY_KEY.set(normalizeToolKey(name), tool);
  }
}

export function normalizeToolKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[’‘ʼ]/g, "'")
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export function resolveArtisanTool(tool) {
  const key = normalizeToolKey(tool);
  if (!key) return null;
  return TOOLS_BY_KEY.get(key) ?? null;
}

export function toolCapabilityType(tool, { capabilityTypeIds = DEFAULT_CAPABILITY_TYPE_IDS } = {}) {
  const entry = resolveArtisanTool(tool);
  if (!entry) return null;
  const registered = new Set((capabilityTypeIds ?? []).map(id => String(id)));
  for (const typeId of entry.capabilityTypes) {
    if (registered.has(typeId)) return typeId;
  }
  if (registered.has("workshop")) return "workshop";
  return entry.capabilityTypes[0] ?? "workshop";
}

export function listArtisanToolsForCapability(typeId, options = {}) {
  const capabilityType = String(typeId ?? "").trim();
  if (!capabilityType) return [];
  return ARTISAN_TOOLS
    .filter(tool => toolCapabilityType(tool.id, options) === capabilityType)
    .map(tool => ({ id: tool.id, label: tool.label, capabilityType }));
}

export function listWorkshopSpecialties(options = {}) {
  return listArtisanToolsForCapability("workshop", options);
}

export function artisanSpecialtyOptions(typeId, { current = null, ...options } = {}) {
  const tools = listArtisanToolsForCapability(typeId, options);
  const show = String(typeId) === "workshop" ? tools.length > 0 : tools.length > 1;
  if (!show) return null;
  const currentValue = current == null ? "" : String(current).trim();
  const optionsList = tools
    .map(tool => ({ value: tool.id, label: tool.label, selected: false }))
    .sort((left, right) => left.label.localeCompare(right.label) || left.value.localeCompare(right.value));
  const known = new Set(optionsList.map(option => option.value));
  const head = [{ value: "", label: "Any", selected: false }];
  if (currentValue && !known.has(currentValue)) {
    head.push({ value: currentValue, label: currentValue, selected: false });
  }
  const flat = [...head, ...optionsList];
  let matched = false;
  for (const option of flat) {
    option.selected = !matched && option.value === currentValue;
    if (option.selected) matched = true;
  }
  return { groups: [{ label: "", options: flat }] };
}
