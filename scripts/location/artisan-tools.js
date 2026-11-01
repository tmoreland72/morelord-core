import { finishSpecialtyGroups } from "./specialty-selection.js";

/**
 * D&D 2024 / SRD 5.2 artisan's tools.
 * `id` is the dnd5e tool key. Workshop shows `label`, the profession. The key is what a location stores.
 * `aliases` are the tool names, so a lookup by Alchemist's Supplies still finds `alchemist`.
 * `capabilityTypes` are checked in order against registered capability types.
 * Workshop is the fallback, so a tool leaves Workshop only when a more specific type is registered.
 * Forge is smithing. The Forge specialty list is equipment categories, not Smith.
 * Tavern, when a module registers it, is brewing and cooking.
 * Alchemist's Supplies are the Workshop profession Alchemist. They are not their own capability.
 */
export const ARTISAN_TOOLS = Object.freeze([
  { id: "alchemist", label: "Alchemist", capabilityTypes: Object.freeze([]), aliases: Object.freeze(["Alchemist's Supplies"]) },
  { id: "brewer", label: "Brewer", capabilityTypes: Object.freeze(["tavern"]), aliases: Object.freeze(["Brewer's Supplies"]) },
  { id: "calligrapher", label: "Calligrapher", capabilityTypes: Object.freeze([]), aliases: Object.freeze(["Calligrapher's Supplies"]) },
  { id: "carpenter", label: "Carpenter", capabilityTypes: Object.freeze([]), aliases: Object.freeze(["Carpenter's Tools"]) },
  { id: "cartographer", label: "Cartographer", capabilityTypes: Object.freeze([]), aliases: Object.freeze(["Cartographer's Tools"]) },
  { id: "cobbler", label: "Cobbler", capabilityTypes: Object.freeze([]), aliases: Object.freeze(["Cobbler's Tools"]) },
  { id: "cook", label: "Cook", capabilityTypes: Object.freeze(["tavern"]), aliases: Object.freeze(["Cook's Utensils"]) },
  { id: "glassblower", label: "Glassblower", capabilityTypes: Object.freeze([]), aliases: Object.freeze(["Glassblower's Tools"]) },
  { id: "jeweler", label: "Jeweler", capabilityTypes: Object.freeze([]), aliases: Object.freeze(["Jeweler's Tools"]) },
  { id: "leatherworker", label: "Leatherworker", capabilityTypes: Object.freeze([]), aliases: Object.freeze(["Leatherworker's Tools"]) },
  { id: "mason", label: "Mason", capabilityTypes: Object.freeze([]), aliases: Object.freeze(["Mason's Tools"]) },
  { id: "painter", label: "Painter", capabilityTypes: Object.freeze([]), aliases: Object.freeze(["Painter's Supplies"]) },
  { id: "potter", label: "Potter", capabilityTypes: Object.freeze([]), aliases: Object.freeze(["Potter's Tools"]) },
  { id: "smith", label: "Smith", capabilityTypes: Object.freeze(["forge"]), aliases: Object.freeze(["Smith's Tools", "Blacksmith's Tools"]) },
  { id: "tinker", label: "Tinker", capabilityTypes: Object.freeze([]), aliases: Object.freeze(["Tinker's Tools"]) },
  { id: "weaver", label: "Weaver", capabilityTypes: Object.freeze([]), aliases: Object.freeze(["Weaver's Tools"]) },
  { id: "woodcarver", label: "Woodcarver", capabilityTypes: Object.freeze([]), aliases: Object.freeze(["Woodcarver's Tools"]) }
]);

const DEFAULT_CAPABILITY_TYPE_IDS = Object.freeze([
  "forge",
  "marketplace",
  "library",
  "temple",
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
  const optionsList = tools
    .map(tool => ({ value: tool.id, label: tool.label, selected: false }))
    .sort((left, right) => left.label.localeCompare(right.label) || left.value.localeCompare(right.value));
  return finishSpecialtyGroups([{ label: "Tools", options: optionsList }], current);
}
