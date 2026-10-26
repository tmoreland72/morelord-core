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

  function compareTools(a, b) {
    const locale = globalThis.game?.i18n?.lang || undefined;
    const byTitle = localizedTitle(a.title).localeCompare(localizedTitle(b.title), locale, { sensitivity: "base" });
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
      description: String(definition.description ?? "").trim(),
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
    return visibleTools().map(({ id, title, icon, order, description }) => ({ id, title, icon, order, description }));
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    }[char]));
  }

  function safeIconClass(icon) {
    const value = String(icon ?? "").trim();
    return /^[A-Za-z0-9_:-]+(?:\s+[A-Za-z0-9_:-]+)*$/.test(value) ? value : "";
  }

  function overviewMarkup() {
    const cards = visibleTools().map(tool => {
      const icon = safeIconClass(tool.icon);
      const description = localizedTitle(tool.description).trim();
      const iconMarkup = icon ? `<i class="${escapeHtml(icon)}" aria-hidden="true"></i>` : "";
      const descriptionMarkup = description ? `<small class="notes">${escapeHtml(description)}</small>` : "";
      return `<div class="ml-card ml-item-row">${iconMarkup}<div class="ml-stack" data-gap="1"><strong>${escapeHtml(localizedTitle(tool.title))}</strong>${descriptionMarkup}</div></div>`;
    }).join("");
    const body = cards
      ? `<div class="ml-stack" data-gap="2">${cards}</div>`
      : `<p class="ml-empty-message">No Morelord tools are available.</p>`;
    return `<div><div class="ml-app ml-app-shell ml-dialog-shell ml-stack"><p>These are the Morelord tools available to you. Choose one in the scene controls to open it.</p>${body}</div></div>`;
  }

  let overviewOpen = false;
  async function openOverview() {
    if (overviewOpen) return;
    const dialog = globalThis.foundry?.applications?.api?.DialogV2;
    if (typeof dialog?.wait !== "function") return;
    overviewOpen = true;
    try {
      await dialog.wait({
        id: "morelord-core-tools-overview",
        classes: ["ml-window"],
        window: { title: "Morelord Tools", resizable: true },
        position: { width: 420 },
        content: overviewMarkup(),
        modal: true,
        rejectClose: false,
        buttons: [{ action: "close", label: "Close", default: true }]
      });
    } catch (error) {
      notifyError(error);
    } finally {
      overviewOpen = false;
    }
  }

  function bindOverview(application, element) {
    const roots = [element, application?.element]
      .map(node => node?.jquery ? node[0] : node)
      .filter(root => root?.querySelector);
    for (const root of roots) {
      const button = root.querySelector(`button[data-tool="${HOME_TOOL}"]`);
      if (!button) continue;
      if (button.dataset.mlToolsOverview !== "bound") {
        button.dataset.mlToolsOverview = "bound";
        button.addEventListener("click", () => { void openOverview(); });
      }
      return;
    }
  }

  /**
   * Foundry 13 requires a visible non-button activeTool (scene-controls.mjs,
   * v13.351). Omitting it makes #onChange throw when the control changes, a
   * hidden tool is deleted, and a button cannot be active: selecting the
   * control would run it. v14 selects the first tool when activeTool is
   * omitted (issue 12966), which would open that module. Overview stays
   * selected. Its onChange stays empty so the crown does not open a window.
   * A click listener opens the list, because v13 ignores a click on the
   * already active tool.
   */
  function buildSceneControl(controls = {}) {
    const entries = visibleTools();
    const palette = {
      [HOME_TOOL]: {
        name: HOME_TOOL,
        title: "Overview",
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
    buildSceneControl,
    bindOverview,
    openOverview
  };
}
