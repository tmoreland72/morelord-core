import { CAPABILITY_TIERS, SETTLEMENT_TYPES } from "./location-domain.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function optionMap(values, format = value => value) {
  return Object.fromEntries(values.map(value => [value, format(value)]));
}

function titleCase(value) {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/(^|\s)\S/g, letter => letter.toUpperCase());
}

export class LocationManagerApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static locationService = null;
  static capabilityRegistry = null;

  static configure({ locationService, capabilityRegistry }) {
    this.locationService = locationService;
    this.capabilityRegistry = capabilityRegistry;
  }

  static DEFAULT_OPTIONS = {
    id: "morelord-core-locations",
    classes: ["ml-window", "ml-location-manager"],
    tag: "form",
    window: { title: "Morelord Locations", icon: "fa-solid fa-map-location-dot", resizable: true },
    position: { width: 900, height: 680 },
    form: { closeOnSubmit: false },
    actions: {
      create: LocationManagerApp.create,
      edit: LocationManagerApp.edit,
      addCapability: LocationManagerApp.addCapability,
      removeCapability: LocationManagerApp.removeCapability,
      save: LocationManagerApp.save,
      delete: LocationManagerApp.delete
    }
  };

  static PARTS = {
    content: { template: "modules/morelord-core/templates/location-manager.hbs" }
  };

  selectedId = null;
  draft = null;

  constructor(options = {}) {
    super(options);
    if (options.locationId) this.selectedId = String(options.locationId);
    if (options.createNew) {
      this.draft = { id: null, name: "", settlementType: "road", sceneIds: [], capabilities: [], notes: "", metadata: {} };
    }
  }

  render(options = {}) {
    const preserve = game.modules.get("morelord-core")?.api?.ui?.renderPreservingScroll;
    return preserve ? preserve(this, () => super.render(options)) : super.render(options);
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const filter = this.element.querySelector("[data-scene-filter]");
    const select = this.element.querySelector("[data-scene-select]");
    const count = this.element.querySelector("[data-scene-count]");
    const selectedSceneIds = new Set(this.draft?.sceneIds ?? []);
    for (const option of select?.options ?? []) option.selected = selectedSceneIds.has(option.value);
    const refresh = () => {
      const query = String(filter?.value ?? "").trim().toLocaleLowerCase();
      for (const option of select?.options ?? []) option.hidden = Boolean(query) && !option.text.toLocaleLowerCase().includes(query);
      if (count) count.textContent = `${Array.from(select?.selectedOptions ?? []).length} selected`;
    };
    filter?.addEventListener("input", refresh);
    select?.addEventListener("change", refresh);
    select?.addEventListener("mousedown", event => {
      if (!(event.target instanceof HTMLOptionElement)) return;
      event.preventDefault();
      event.target.selected = !event.target.selected;
      select.focus();
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    refresh();
  }

  async _prepareContext() {
    const locations = this.constructor.locationService.list();
    if (!this.draft && !this.selectedId && locations.length) {
      this.selectedId = locations[0].id;
    }
    if (!this.draft && this.selectedId) {
      this.draft = foundry.utils.deepClone(this.constructor.locationService.get(this.selectedId));
    }
    const draft = this.draft;
    const selectedSceneIds = new Set(draft?.sceneIds ?? []);
    return {
      locations: locations.map(location => ({ ...location, selected: location.id === draft?.id })),
      hasLocations: locations.length > 0,
      draft,
      isExisting: Boolean(draft?.id && this.constructor.locationService.get(draft.id)),
      settlementTypes: optionMap(SETTLEMENT_TYPES, titleCase),
      capabilityTypes: Object.fromEntries(this.constructor.capabilityRegistry.all().map(type => [type.id, type.name])),
      capabilityTiers: optionMap(CAPABILITY_TIERS, titleCase),
      scenes: Array.from(game.scenes ?? [])
        .map(scene => ({
          id: scene.id,
          name: scene.name,
          selected: selectedSceneIds.has(scene.id)
        }))
        .sort((left, right) => Number(right.selected) - Number(left.selected) || left.name.localeCompare(right.name))
    };
  }

  static create(event) {
    event.preventDefault();
    this.selectedId = null;
    this.draft = {
      id: null,
      name: "",
      settlementType: "road",
      sceneIds: [],
      capabilities: [],
      notes: "",
      metadata: {}
    };
    this.render({ force: true });
  }

  static edit(event, target) {
    event.preventDefault();
    this.selectedId = target.dataset.locationId;
    this.draft = foundry.utils.deepClone(this.constructor.locationService.get(this.selectedId));
    this.render({ force: true });
  }

  static addCapability(event) {
    event.preventDefault();
    this.#captureDraft();
    this.draft.capabilities.push({ type: "forge", tier: "common", specialty: null, source: null });
    this.render({ force: true });
  }

  static removeCapability(event, target) {
    event.preventDefault();
    this.#captureDraft();
    this.draft.capabilities.splice(Number(target.dataset.index), 1);
    this.render({ force: true });
  }

  static async save(event, target) {
    event.preventDefault();
    target.disabled = true;
    try {
      this.#captureDraft();
      const saved = await this.constructor.locationService.save(this.draft);
      this.selectedId = saved.id;
      this.draft = saved;
      ui.notifications.info(`${saved.name} saved.`);
      await this.close();
    } catch (error) {
      ui.notifications.error(`Could not save location: ${error.message}`);
    } finally {
      target.disabled = false;
    }
  }

  static async delete(event, target) {
    event.preventDefault();
    if (!this.draft?.id) return;
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Delete Morelord Location" },
      content: `<p>Delete <strong>${foundry.utils.escapeHTML(this.draft.name)}</strong>? Projects and integrations that reference it may become unavailable.</p>`,
      modal: true
    });
    if (!confirmed) return;
    target.disabled = true;
    try {
      await this.constructor.locationService.remove(this.draft.id);
      this.selectedId = null;
      this.draft = null;
      ui.notifications.info("Location deleted.");
      await this.render({ force: true });
    } finally {
      target.disabled = false;
    }
  }

  #captureDraft() {
    if (!this.draft) return;
    const data = new FormData(this.element);
    const capabilities = [];
    const count = Number(data.get("capabilityCount") ?? 0);
    for (let index = 0; index < count; index += 1) {
      const type = String(data.get(`capabilities.${index}.type`) ?? "").trim();
      if (!type) continue;
      capabilities.push({
        type,
        tier: String(data.get(`capabilities.${index}.tier`) ?? "common"),
        specialty: String(data.get(`capabilities.${index}.specialty`) ?? "").trim() || null,
        source: String(data.get(`capabilities.${index}.source`) ?? "").trim() || null
      });
    }
    this.draft = {
      ...this.draft,
      name: String(data.get("name") ?? "").trim(),
      settlementType: String(data.get("settlementType") ?? "road"),
      sceneIds: data.getAll("sceneIds").map(String),
      capabilities,
      notes: String(data.get("notes") ?? "")
    };
  }
}
