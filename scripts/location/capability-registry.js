import { TRAINING_SPECIALTY_CATALOG } from "./training-specialties.js";

export const BUILTIN_CAPABILITY_TYPES = Object.freeze([
  { id: "forge", name: "Forge" },
  { id: "marketplace", name: "Marketplace" },
  { id: "alchemist", name: "Alchemist" },
  { id: "library", name: "Library" },
  { id: "temple", name: "Temple" },
  { id: "contractor", name: "Contractor" },
  { id: "instructor", name: "Instructor", supportsSpecialty: true, specialtyCatalog: TRAINING_SPECIALTY_CATALOG },
  { id: "workshop", name: "Workshop" }
]);

export class CapabilityRegistry {
  #types = new Map();

  register(definition = {}) {
    const id = String(definition.id ?? "").trim();
    if (!id) throw new Error("A capability type requires an id.");
    const specialtyCatalog = String(definition.specialtyCatalog ?? "").trim() || null;
    const normalized = Object.freeze({
      id,
      name: String(definition.name ?? id).trim(),
      icon: String(definition.icon ?? "fa-solid fa-location-dot").trim(),
      supportsSpecialty: definition.supportsSpecialty === true,
      specialtyCatalog
    });
    this.#types.set(id, normalized);
    return normalized;
  }

  get(id) { return this.#types.get(String(id)) ?? null; }
  all() { return Array.from(this.#types.values()); }
}
