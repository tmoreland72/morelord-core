import { MORELORD_MODULES_HOME_TITLE } from "./morelord-modules.js";

const HOME_TOOL = "morelordHome";
const CONTROL_ICON = "fa-sharp fa-solid fa-user-crown";
const REFRESH_DELAY_MS = 50;

/** `morelord-craftworks` stays `morelordCraftworks` for existing control lookups. */
export function sceneControlKey(id) {
  return String(id ?? "").trim().replace(/[-_\s]+([A-Za-z0-9])/g, (_, char) => char.toUpperCase());
}

function notifyError(error) {
  const message = error instanceof Error && error.message ? error.message : "Morelord tool failed.";
  globalThis.ui?.notifications?.error?.(message);
}

function runClick(tool, event) {
  try {
    Promise.resolve(tool.onClick(event)).catch(notifyError);
  } catch (error) {
    notifyError(error);
  }
}

/**
 * Preserve `tools` already attached to the Core api. Ready must merge into that
 * object; replacing it drops registrations made during init or setup.
 */
export function mergeCoreApi(api, properties) {
  const tools = api.tools ?? properties.tools;
  Object.assign(api, properties);
  if (tools !== undefined) api.tools = tools;
  return api;
}

export function createToolsRegistry() {
  const tools = new Map();
  let refreshTimer = 0;

  function shown(tool) {
    try {
      return tool.visible() !== false;
    } catch (error) {
      notifyError(error);
      return false;
    }
  }

  function localizedTitle(title) {
    const text = String(title ?? "");
    try {
      const localized = globalThis.game?.i18n?.localize?.(text);
      return localized == null || localized === "" ? text : String(localized);
    } catch {
      return text;
    }
  }

  /** Compare without a leading "Morelord ". The palette label stays the registered title. */
  function sortTitle(title) {
    return localizedTitle(title).replace(/^morelord /i, "");
  }

  function compareTools(a, b) {
    const locale = globalThis.game?.i18n?.lang || undefined;
    const byTitle = sortTitle(a.title).localeCompare(sortTitle(b.title), locale, { sensitivity: "base" });
    return byTitle || String(a.id).localeCompare(String(b.id), locale, { sensitivity: "base" });
  }

  function visibleTools() {
    return [...tools.values()].filter(shown).sort(compareTools);
  }

  function refresh() {
    if (!globalThis.ui?.controls?.rendered) return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshTimer = 0;
      if (!globalThis.ui?.controls?.rendered) return;
      globalThis.ui.controls.render({ controls: true, reset: true });
    }, REFRESH_DELAY_MS);
  }

  function register(definition = {}) {
    const id = String(definition.id ?? "").trim();
    const name = sceneControlKey(id);
    if (!name) throw new Error("A Morelord tool requires an id.");
    if (name === HOME_TOOL) throw new Error("morelordHome is reserved for the Morelord Tools scene control.");
    tools.set(id, {
      id,
      title: definition.title == null || definition.title === "" ? id : String(definition.title),
      icon: String(definition.icon ?? ""),
      order: Number.isFinite(Number(definition.order)) ? Number(definition.order) : 0,
      visible: typeof definition.visible === "function" ? definition.visible : () => definition.visible !== false,
      onClick: typeof definition.onClick === "function" ? definition.onClick : () => {}
    });
    refresh();
    return id;
  }

  function unregister(id) {
    const removed = tools.delete(String(id ?? "").trim());
    if (removed) refresh();
    return removed;
  }

  function list() {
    return visibleTools().map(({ id, title, icon, order }) => ({ id, title, icon, order }));
  }

  /**
   * Foundry 13 requires a visible non-button activeTool (scene-controls.mjs,
   * v13.351). Omitting it makes #onChange throw when the control changes, a
   * hidden tool is deleted, and a button cannot be active: selecting the
   * control would run it. v14 selects the first tool when activeTool is
   * omitted (issue 12966), which would open that module. This entry stays
   * selected for GMs and players. Its onChange stays empty so the crown does
   * not open a window. Players do not see the rendered button.
   */
  function buildSceneControl(controls = {}) {
    const entries = visibleTools();
    const palette = {
      [HOME_TOOL]: {
        name: HOME_TOOL,
        title: MORELORD_MODULES_HOME_TITLE,
        icon: "fa-solid fa-circle-info",
        order: 0,
        visible: true,
        onChange() {}
      }
    };
    for (const [index, tool] of entries.entries()) {
      const name = sceneControlKey(tool.id);
      palette[name] = {
        name,
        title: tool.title,
        icon: tool.icon,
        order: index + 1,
        button: true,
        visible: true,
        onChange(event) { runClick(tool, event); }
      };
    }
    return {
      name: "morelord",
      title: "Morelord Tools",
      icon: CONTROL_ICON,
      order: Object.keys(controls).length,
      visible: entries.length > 0,
      activeTool: HOME_TOOL,
      tools: palette
    };
  }

  return {
    api: Object.freeze({ register, unregister, list, refresh }),
    buildSceneControl
  };
}
