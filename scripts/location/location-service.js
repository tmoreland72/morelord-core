import { normalizeLocation, evaluateRequirements } from "./location-domain.js";

export class LocationService {
  constructor({ moduleId, settingKey }) {
    this.moduleId = moduleId;
    this.settingKey = settingKey;
  }

  registerSetting() {
    game.settings.register(this.moduleId, this.settingKey, {
      scope: "world", config: false, type: Object, default: {}, restricted: true
    });
  }

  #records() {
    return foundry.utils.deepClone(game.settings.get(this.moduleId, this.settingKey) ?? {});
  }

  list() { return Object.values(this.#records()).sort((a, b) => a.name.localeCompare(b.name)); }
  get(id) { return this.#records()[String(id)] ?? null; }
  forScene(sceneId) { return this.list().find(location => location.sceneIds.includes(String(sceneId))) ?? null; }
  current() { return this.forScene(globalThis.canvas?.scene?.id ?? game.scenes?.current?.id); }

  async save(raw) {
    if (!game.user?.isGM) throw new Error("Only a GM may change Morelord locations.");
    const location = normalizeLocation(raw, { idFactory: () => foundry.utils.randomID() });
    const records = this.#records();
    const reassigned = [];
    for (const record of Object.values(records)) {
      if (record.id === location.id) continue;
      const sceneIds = record.sceneIds.filter(sceneId => !location.sceneIds.includes(sceneId));
      if (sceneIds.length === record.sceneIds.length) continue;
      records[record.id] = { ...record, sceneIds };
      reassigned.push(records[record.id]);
    }
    records[location.id] = location;
    await game.settings.set(this.moduleId, this.settingKey, records);
    for (const record of reassigned) {
      Hooks.callAll("morelordCoreLocationChanged", foundry.utils.deepClone(record));
    }
    Hooks.callAll("morelordCoreLocationChanged", foundry.utils.deepClone(location));
    return foundry.utils.deepClone(location);
  }

  async remove(id) {
    if (!game.user?.isGM) throw new Error("Only a GM may change Morelord locations.");
    const records = this.#records();
    if (!records[id]) return false;
    delete records[id];
    await game.settings.set(this.moduleId, this.settingKey, records);
    Hooks.callAll("morelordCoreLocationRemoved", String(id));
    return true;
  }

  evaluate(requirements, context = {}) {
    return evaluateRequirements(requirements, { ...context, location: context.location ?? this.current() });
  }
}
