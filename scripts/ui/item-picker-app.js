import { Dnd5eSourceFilterService } from "../services/dnd5e-source-filter-service.js";
import { resolvePackLabel } from "../services/source-book-service.js";
import { itemRarity } from "../services/item-rarity.js";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const sources = new Dnd5eSourceFilterService();
const physicalTypes = new Set(["weapon", "equipment", "consumable", "tool", "loot", "container"]);

export class ItemPickerApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "morelord-core-item-picker", classes: ["ml-window"], tag: "section",
    window: { title: "Select an Item", icon: "fa-solid fa-box", resizable: true },
    position: { width: 800, height: 660 },
    actions: { search: ItemPickerApp.search, choose: ItemPickerApp.choose }
  };
  static PARTS = { content: { template: "modules/morelord-core/templates/item-picker.hbs" } };
  constructor({ onSelect, ...options } = {}) {
    super(options);
    this.onSelect = onSelect;
    this.query = "";
    this.packId = "";
    this.results = [];
  }
  async _prepareContext() {
    return { query: this.query, searched: this.query.length >= 2, results: this.results,
      packs: sources.enabledPacks({ documentName: "Item" }).map(pack => ({ id: pack.collection, label: resolvePackLabel({ pack }), selected: pack.collection === this.packId })) };
  }
  static async search(event, target) {
    event.preventDefault(); target.disabled = true;
    try {
      this.query = this.element.querySelector('[name="itemSearch"]').value.trim();
      this.packId = this.element.querySelector('[name="itemPack"]').value;
      this.results = [];
      if (this.query.length >= 2) {
        const packs = sources.enabledPacks({ documentName: "Item" }).filter(pack => !this.packId || pack.collection === this.packId);
        for (const pack of packs) {
          const index = await pack.getIndex({ fields: ["name", "img", "type", "system.source", "system.rarity", "system.rarities"] });
          for (const entry of index) {
            if (!physicalTypes.has(entry.type) || !entry.name.toLocaleLowerCase().includes(this.query.toLocaleLowerCase())) continue;
            const source = sources.sourceLabelForItem(entry, { pack });
            if (!sources.isSourceEnabled(source, { itemType: entry.type })) continue;
            this.results.push({ uuid: `Compendium.${pack.collection}.Item.${entry._id}`, name: entry.name, img: entry.img, source, rarity: itemRarity(entry.system) ?? "Mundane" });
          }
        }
        this.results.sort((a, b) => a.name.localeCompare(b.name));
      }
      await this.render({ force: true });
    } catch (error) { ui.notifications.error(`Could not search items: ${error.message}`); }
    finally { target.disabled = false; }
  }
  static async choose(event, target) {
    event.preventDefault(); target.disabled = true;
    try {
      const result = this.results.find(item => item.uuid === target.dataset.uuid);
      if (!result) return;
      const item = await fromUuid(result.uuid);
      if (!item || !sources.isPackEnabled(item.pack) || !sources.isSourceEnabled(sources.sourceLabelForItem(item, { pack: game.packs.get(item.pack) }), { itemType: item.type })) throw new Error("That item is no longer available from an enabled source.");
      await this.onSelect?.(item);
      await this.close();
    } catch (error) { ui.notifications.error(error.message); target.disabled = false; }
  }
}
