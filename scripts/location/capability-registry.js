export class CapabilityRegistry {
  #types = new Map();

  register(definition = {}) {
    const id = String(definition.id ?? "").trim();
    if (!id) throw new Error("A capability type requires an id.");
    const normalized = Object.freeze({
      id,
      name: String(definition.name ?? id).trim(),
      icon: String(definition.icon ?? "fa-solid fa-location-dot").trim(),
      supportsSpecialty: definition.supportsSpecialty === true
    });
    this.#types.set(id, normalized);
    return normalized;
  }

  get(id) { return this.#types.get(String(id)) ?? null; }
  all() { return Array.from(this.#types.values()); }
}
