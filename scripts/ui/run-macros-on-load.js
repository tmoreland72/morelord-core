const MODULE_ID = "morelord-core";
const FLAG = "runOnLoad";
const MENU_CLASS = "ml-core-run-on-load";

const COPY = {
  runForMe: ["morelord-core.macros.runForMe", "Run on load for me"],
  runningForMe: ["morelord-core.macros.runningForMe", "Running on load for me"],
  runForEveryone: ["morelord-core.macros.runForEveryone", "Run on load for everyone"],
  runningForEveryone: ["morelord-core.macros.runningForEveryone", "Running on load for everyone"],
  indicatorForMe: ["morelord-core.macros.indicatorForMe", "Runs on load for you"],
  indicatorForEveryone: ["morelord-core.macros.indicatorForEveryone", "Runs on load for everyone"]
};

function translated(key) {
  const [i18nKey, fallback] = COPY[key];
  try {
    const value = globalThis.game?.i18n?.localize?.(i18nKey);
    if (value && value !== i18nKey) return String(value);
  } catch {
    /* The English catalog string remains. */
  }
  return fallback;
}

function asElement(target) {
  if (!target) return null;
  if (target.dataset || typeof target.closest === "function") return target;
  return target[0] ?? null;
}

function slotElement(target) {
  const element = asElement(target);
  if (!element) return null;
  if (element.dataset?.slot) return element;
  return element.closest?.("[data-slot]") ?? null;
}

/**
 * Foundry 14.366 types document `getMacroContextOptions` as the menu hook called from
 * `Hotbar#_onFirstRender` (and from MacroDirectory). Early v13 testing used
 * `getHotbarContextOptions` (foundryvtt/foundryvtt#12183). The slot element carries
 * `data-slot`; a Hotbar subclass that keeps the core menu reads the macro id from
 * `user.hotbar[slot]`.
 */
export function isHotbarApplication(app) {
  const Hotbar = globalThis.foundry?.applications?.ui?.Hotbar;
  if (typeof Hotbar === "function") return app instanceof Hotbar;
  return app?.id === "hotbar";
}

export function macroFromHotbarTarget(target, user = globalThis.game?.user, macros = globalThis.game?.macros) {
  const element = slotElement(target);
  const slot = element?.dataset?.slot;
  if (!slot) return null;
  const macroId = user?.hotbar?.[slot];
  if (!macroId) return null;
  return macros?.get?.(macroId) ?? null;
}

export function runOnLoadUuids(user) {
  const value = user?.getFlag?.(MODULE_ID, FLAG);
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(entry => typeof entry === "string" && entry))];
}

export function macroRunsForUser(macro, user = globalThis.game?.user) {
  const uuid = macro?.uuid;
  if (!uuid) return false;
  return runOnLoadUuids(user).includes(uuid);
}

export function macroRunsForEveryone(macro) {
  return macro?.getFlag?.(MODULE_ID, FLAG) === true;
}

export function userCanRunMacro(macro, user = globalThis.game?.user) {
  if (!macro || !user) return false;
  const sees = macro.visible === true || (
    macro.visible == null
    && typeof macro.testUserPermission === "function"
    && macro.testUserPermission(user, "LIMITED") === true
  );
  if (!sees) return false;
  if (typeof macro.canUserExecute === "function" && macro.canUserExecute(user) !== true) return false;
  if (macro.canExecute === false) return false;
  if (macro.canExecute === true) return true;
  return typeof macro.canUserExecute === "function";
}

export function resolveMacro(uuid, macros = globalThis.game?.macros) {
  if (!uuid) return null;
  if (typeof globalThis.fromUuidSync === "function") {
    try {
      const resolved = globalThis.fromUuidSync(uuid);
      if (resolved) return resolved;
    } catch {
      /* Fall through to the world collection. */
    }
  }
  const text = String(uuid);
  const id = text.startsWith("Macro.") && !text.startsWith("Compendium.") ? text.slice("Macro.".length) : text;
  return macros?.get?.(id) ?? null;
}

export function macrosToRunOnLoad({ user = globalThis.game?.user, macros = globalThis.game?.macros } = {}) {
  const chosen = new Map();
  const add = macro => {
    if (!macro) return;
    const key = macro.uuid || macro.id;
    if (!key || chosen.has(key) || !userCanRunMacro(macro, user)) return;
    chosen.set(key, macro);
  };
  for (const uuid of runOnLoadUuids(user)) add(resolveMacro(uuid, macros));
  for (const macro of macros?.contents ?? []) {
    if (macroRunsForEveryone(macro)) add(macro);
  }
  return [...chosen.values()];
}

export async function runMacrosOnLoad(environment = {}) {
  const logger = environment.logger ?? console;
  const ran = [];
  for (const macro of macrosToRunOnLoad(environment)) {
    try {
      await macro.execute?.();
      ran.push(macro.uuid ?? macro.id);
    } catch (error) {
      logger.error?.(`Morelord Core could not run "${macro.name ?? macro.uuid ?? "macro"}" on load.`, error);
    }
  }
  return ran;
}

async function refreshHotbar() {
  try {
    await globalThis.ui?.hotbar?.render?.();
  } catch (error) {
    console.error("Morelord Core could not refresh the hotbar after a run-on-load change.", error);
  }
}

export async function toggleRunOnLoadForMe(macro, user = globalThis.game?.user) {
  if (!macro?.uuid || typeof user?.setFlag !== "function") return false;
  try {
    const uuids = new Set(runOnLoadUuids(user));
    const enabled = uuids.has(macro.uuid);
    if (enabled) uuids.delete(macro.uuid);
    else uuids.add(macro.uuid);
    await user.setFlag(MODULE_ID, FLAG, [...uuids]);
    await refreshHotbar();
    return !enabled;
  } catch (error) {
    console.error(`Morelord Core could not change run-on-load for "${macro.name ?? macro.uuid}".`, error);
    return false;
  }
}

export async function toggleRunOnLoadForEveryone(macro, user = globalThis.game?.user) {
  if (user?.isGM !== true || typeof macro?.setFlag !== "function") return false;
  try {
    const enabled = macroRunsForEveryone(macro);
    if (enabled) await macro.unsetFlag?.(MODULE_ID, FLAG);
    else await macro.setFlag(MODULE_ID, FLAG, true);
    await refreshHotbar();
    return !enabled;
  } catch (error) {
    console.error(`Morelord Core could not change run-on-load for everyone on "${macro.name ?? macro.uuid}".`, error);
    return false;
  }
}

function menuEntry({ label, icon, visible, onClick }) {
  return { label, icon, classes: MENU_CLASS, visible, onClick };
}

export function addRunOnLoadMenuEntries(app, entries) {
  if (!isHotbarApplication(app) || !Array.isArray(entries)) return entries;
  if (entries.some(entry => String(entry?.classes ?? "").split(/\s+/).includes(MENU_CLASS))) return entries;
  const user = () => globalThis.game?.user;
  const macroFor = target => macroFromHotbarTarget(target, user());
  entries.push(
    menuEntry({
      label: translated("runForMe"),
      icon: "<i class=\"fa-solid fa-user\"></i>",
      visible: target => {
        const macro = macroFor(target);
        return Boolean(macro) && !macroRunsForUser(macro, user());
      },
      onClick: (_event, target) => {
        const macro = macroFor(target);
        if (macro) return toggleRunOnLoadForMe(macro, user());
      }
    }),
    menuEntry({
      label: translated("runningForMe"),
      icon: "<i class=\"fa-solid fa-user-check\"></i>",
      visible: target => {
        const macro = macroFor(target);
        return Boolean(macro) && macroRunsForUser(macro, user());
      },
      onClick: (_event, target) => {
        const macro = macroFor(target);
        if (macro) return toggleRunOnLoadForMe(macro, user());
      }
    }),
    menuEntry({
      label: translated("runForEveryone"),
      icon: "<i class=\"fa-solid fa-users\"></i>",
      visible: target => user()?.isGM === true && Boolean(macroFor(target)) && !macroRunsForEveryone(macroFor(target)),
      onClick: (_event, target) => {
        const macro = macroFor(target);
        if (macro) return toggleRunOnLoadForEveryone(macro, user());
      }
    }),
    menuEntry({
      label: translated("runningForEveryone"),
      icon: "<i class=\"fa-solid fa-globe\"></i>",
      visible: target => user()?.isGM === true && Boolean(macroFor(target)) && macroRunsForEveryone(macroFor(target)),
      onClick: (_event, target) => {
        const macro = macroFor(target);
        if (macro) return toggleRunOnLoadForEveryone(macro, user());
      }
    })
  );
  return entries;
}

function indicator(document, scope, icon, label) {
  const mark = document.createElement("i");
  mark.className = `ml-core-hotbar-run ${icon}`;
  mark.dataset.scope = scope;
  mark.dataset.tooltip = label;
  mark.dataset.tooltipDirection = "UP";
  mark.setAttribute("aria-label", label);
  mark.setAttribute("role", "img");
  return mark;
}

export function paintRunOnLoadIndicators(element, user = globalThis.game?.user, macros = globalThis.game?.macros) {
  const HtmlElement = globalThis.HTMLElement;
  const root = HtmlElement && element instanceof HtmlElement
    ? element
    : (element?.dataset || typeof element?.querySelectorAll === "function" ? element : element?.[0]);
  if (!root?.querySelectorAll) return;
  for (const slot of root.querySelectorAll("[data-slot]")) {
    slot.querySelector(":scope > .ml-core-hotbar-runs")?.remove();
    slot.classList?.remove("ml-core-hotbar-marked");
    const macro = macroFromHotbarTarget(slot, user, macros);
    const forMe = macroRunsForUser(macro, user);
    const forEveryone = macroRunsForEveryone(macro);
    if (!macro || (!forMe && !forEveryone)) continue;
    const host = (root.ownerDocument ?? globalThis.document).createElement("span");
    host.className = "ml-core-hotbar-runs";
    if (forMe) host.append(indicator(root.ownerDocument ?? globalThis.document, "user", "fa-solid fa-user", translated("indicatorForMe")));
    if (forEveryone) host.append(indicator(root.ownerDocument ?? globalThis.document, "world", "fa-solid fa-users", translated("indicatorForEveryone")));
    slot.classList?.add("ml-core-hotbar-marked");
    slot.append(host);
  }
}

export function registerRunOnLoad(hooks = globalThis.Hooks) {
  if (!hooks?.on) return;
  const add = (app, entries) => addRunOnLoadMenuEntries(app, entries);
  hooks.on("getMacroContextOptions", add);
  hooks.on("getHotbarContextOptions", add);
  hooks.on("renderHotbar", (_app, element) => paintRunOnLoadIndicators(element));
}
