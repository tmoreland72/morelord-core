import { exportSettings, importSettings, transferableSettings } from "../services/settings-transfer.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class SettingsTransferApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "morelord-settings-transfer", classes: ["ml-window"], tag: "form",
    window: { title: "Morelord Settings Transfer", resizable: true },
    position: { width: 620, height: 580 },
    actions: { exportSettings: SettingsTransferApp.exportFile, importSettings: SettingsTransferApp.importFile }
  };

  static PARTS = { content: { template: "modules/morelord-core/templates/settings-transfer.hbs" } };

  async _prepareContext() {
    const counts = new Map();
    for (const setting of transferableSettings()) counts.set(setting.namespace, (counts.get(setting.namespace) ?? 0) + 1);
    return { modules: Array.from(counts, ([id, count]) => ({ name: game.modules.get(id).title, count })) };
  }

  static async exportFile(event) {
    event.preventDefault();
    try {
      const data = JSON.stringify(exportSettings(), null, 2);
      foundry.utils.saveDataToFile(data, "application/json", "morelord-settings.json");
    } catch (error) { ui.notifications.error(error.message); }
  }

  static async importFile(event) {
    event.preventDefault();
    if (this.importing) return;
    const file = this.element.querySelector('[name="configurationFile"]').files[0];
    if (!file) { ui.notifications.warn("Choose a Morelord settings file first."); return; }
    this.importing = true;
    const buttons = this.element.querySelectorAll("button");
    buttons.forEach(button => button.disabled = true);
    try {
      const result = await importSettings(JSON.parse(await file.text()));
      ui.notifications.info(`Imported ${result.imported} settings; skipped ${result.skipped} unavailable modules or settings. Reload Foundry to refresh all module views.`);
    } catch (error) { ui.notifications.error(error.message); }
    finally { this.importing = false; buttons.forEach(button => button.disabled = false); }
  }
}
