const TITLE_KEY = "morelord-core.modules.title";
const INTRO_KEY = "morelord-core.modules.intro";
const LEARN_MORE_KEY = "morelord-core.modules.learnMore";
const LEARN_MORE_ABOUT_KEY = "morelord-core.modules.learnMoreAbout";

/** One-line copy is each repository's module.json description. */
export const MORELORD_MODULE_CATALOG = Object.freeze([
  moduleEntry("morelord-core", "Morelord Core", "Shared account connection and premium entitlement services for Morelord Tools modules.", "fa-sharp fa-solid fa-user-crown", "https://morelordgaming.com/tools/morelord-core"),
  moduleEntry("morelord-journeys", "Morelord Journeys", "A structured exploration and travel workflow for Foundry Virtual Tabletop.", "fa-solid fa-person-hiking", "https://morelordgaming.com/tools/morelord-journeys"),
  moduleEntry("morelord-encounters", "Morelord Encounters", "A standalone intelligent encounter builder for Foundry Virtual Tabletop.", "fa-solid fa-hydra", "https://morelordgaming.com/tools/morelord-encounters"),
  moduleEntry("morelord-character-export", "Morelord Character Export", "Exports D&D 5e characters to portable JSON for import into My Characters on the Morelord Gaming website with a free account.", "fa-solid fa-file-export", "https://morelordgaming.com/tools/morelord-character-export"),
  moduleEntry("morelord-craftworks", "Morelord Craftworks", "System-agnostic gathering, harvesting, looting, selling, materials, recipes, and premium crafting workflows for Foundry VTT.", "fa-solid fa-hammer", "https://morelordgaming.com/tools/morelord-craftworks"),
  moduleEntry("morelord-marketplace", "Morelord Marketplace", "A standalone shopping, selling, and marketplace system for Foundry VTT.", "fa-solid fa-store", "https://morelordgaming.com/tools/morelord-marketplace"),
  moduleEntry("morelord-downtime", "Morelord Downtime", "Persistent, location-aware downtime Projects and campaign-time orchestration for the Morelord suite.", "fa-solid fa-timer", "https://morelordgaming.com/tools/morelord-downtime"),
  moduleEntry("morelord-game-master", "Morelord Game Master", "A GM tray for roll requests, sound, macros, and triggers.", "fa-solid fa-dice-d20", "https://github.com/tmoreland72/morelord-game-master")
]);

export const MORELORD_MODULES_APP = Object.freeze({
  id: "morelord-core-modules",
  classes: ["ml-window"],
  window: { title: TITLE_KEY, icon: "fa-solid fa-circle-info", resizable: true },
  position: { width: 640 },
  template: "modules/morelord-core/templates/modules.hbs"
});

export const MORELORD_MODULES_HOME_TITLE = TITLE_KEY;

const STATUS = Object.freeze({
  active: { key: "morelord-core.modules.status.active", label: "Active", tone: "success" },
  inactive: { key: "morelord-core.modules.status.inactive", label: "Installed but inactive", tone: "warning" },
  missing: { key: "morelord-core.modules.status.missing", label: "Not installed", tone: "info" }
});

function moduleEntry(id, title, description, icon, url) {
  return Object.freeze({ id, slug: id, title, description, icon, url });
}

function translated(i18n, key, fallback) {
  try {
    const value = i18n?.localize?.(key);
    if (value && value !== key) return String(value);
  } catch { /* The English catalog string remains. */ }
  return fallback;
}

function learnMoreAbout(i18n, title) {
  try {
    const value = i18n?.format?.(LEARN_MORE_ABOUT_KEY, { title });
    if (value && value !== LEARN_MORE_ABOUT_KEY) return String(value);
  } catch { /* Fall through to the English sentence. */ }
  return `Learn more about ${title}`;
}

export function morelordModuleState(installed) {
  if (!installed) return "missing";
  return installed.active ? "active" : "inactive";
}

export function morelordModuleUrl(entry) {
  const url = new URL(entry.url);
  url.searchParams.set("utm_source", "foundry");
  url.searchParams.set("utm_medium", "morelord_tools");
  url.searchParams.set("utm_campaign", entry.slug);
  return url.toString();
}

export function morelordModuleRows(modules, i18n = globalThis.game?.i18n) {
  return MORELORD_MODULE_CATALOG.map(entry => {
    const state = morelordModuleState(modules?.get?.(entry.id));
    const status = STATUS[state];
    const title = translated(i18n, `morelord-core.modules.${entry.id}.title`, entry.title);
    return {
      id: entry.id,
      title,
      description: translated(i18n, `morelord-core.modules.${entry.id}.description`, entry.description),
      icon: entry.icon,
      state,
      tone: status.tone,
      statusLabel: translated(i18n, status.key, status.label),
      url: state === "missing" ? morelordModuleUrl(entry) : "",
      learnMore: translated(i18n, LEARN_MORE_KEY, "Learn more"),
      learnMoreLabel: learnMoreAbout(i18n, title)
    };
  });
}

export function morelordModulesContext(modules, i18n = globalThis.game?.i18n) {
  return {
    title: translated(i18n, TITLE_KEY, "Morelord Modules"),
    intro: translated(i18n, INTRO_KEY, "Each module shows whether it is active, installed but inactive, or not installed in this world."),
    modules: morelordModuleRows(modules, i18n)
  };
}

let MorelordModulesApp;

function modulesApp() {
  if (MorelordModulesApp) return MorelordModulesApp;
  const { ApplicationV2, HandlebarsApplicationMixin } = globalThis.foundry.applications.api;
  MorelordModulesApp = class extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
      id: MORELORD_MODULES_APP.id,
      classes: [...MORELORD_MODULES_APP.classes],
      window: { ...MORELORD_MODULES_APP.window },
      position: { ...MORELORD_MODULES_APP.position }
    };

    static PARTS = {
      content: { template: MORELORD_MODULES_APP.template }
    };

    async _prepareContext() {
      return morelordModulesContext(globalThis.game?.modules, globalThis.game?.i18n);
    }
  };
  return MorelordModulesApp;
}

function notify(error) {
  const message = error instanceof Error && error.message ? error.message : "Morelord Modules could not open.";
  globalThis.ui?.notifications?.error?.(message);
}

export function openMorelordModules() {
  try {
    const App = modulesApp();
    const existing = globalThis.foundry?.applications?.instances?.get?.(MORELORD_MODULES_APP.id);
    const app = existing?.render ? existing : new App();
    return Promise.resolve(app.render({ force: true })).catch(notify);
  } catch (error) {
    notify(error);
    return Promise.resolve();
  }
}

export function bindMorelordModulesButton(application, element) {
  const roots = [element, application?.element]
    .map(node => node?.jquery ? node[0] : node)
    .filter(root => root?.querySelector);
  for (const root of roots) {
    const button = root.querySelector('button[data-tool="morelordHome"]');
    if (!button) continue;
    if (button.dataset.mlModulesBound !== "bound") {
      button.dataset.mlModulesBound = "bound";
      button.addEventListener("click", () => openMorelordModules());
    }
    return;
  }
}
