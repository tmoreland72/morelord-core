/**
 * Primary compendium filter for every Morelord module.
 *
 * dnd5e (CompendiumBrowserSettingsConfig.isSourceEnabled, added after 6.0.6
 * and present on current 6.x) decides a pack like this:
 * `dnd5e.settings.packSourceConfiguration[collection]` wins when that entry is
 * set. Otherwise the pack is allowed only when `metadata.flags.dnd5e.rulesVersion`
 * is empty or equal to `dnd5e.settings.rulesVersion` (`modern` or `legacy`).
 * The Configure Sources screen lists Actor and Item packs. Unchecking System
 * still writes `false` for every system pack id, and that explicit false wins.
 * Core calls dnd5e's own static method when it is loaded, and uses the same
 * rule when it is not. It does not substitute another pack.
 */

export const CONFIGURE_SOURCES_CHANGED = "morelordCoreConfigureSourcesChanged";
const SETTING_KEY = "dnd5e.packSourceConfiguration";
const RULES_KEY = "dnd5e.rulesVersion";
const WATCHER = Symbol.for("morelord-core.configureSourcesWatcher");
const DOCUMENT_TYPES = new Set([
  "Actor", "Adventure", "Cards", "ChatMessage", "Combat", "FogExploration",
  "Folder", "Item", "JournalEntry", "Macro", "Playlist", "RollTable", "Scene",
  "Setting", "User"
]);
const COMPENDIUM_PACK = /^Compendium\.([^.]+)\.([^.]+)(?:\.|$)/;
const listeners = new Set();

export function packSourceConfiguration(game = globalThis.game) {
  const cached = globalThis.dnd5e?.settings?.packSourceConfiguration;
  if (cached && typeof cached === "object" && !Array.isArray(cached)) return cached;
  if (game?.system?.id !== "dnd5e") return {};
  try {
    const value = game.settings?.get?.("dnd5e", "packSourceConfiguration");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value;
  } catch {
    return {};
  }
}

function currentRulesVersion(game = globalThis.game) {
  const cached = globalThis.dnd5e?.settings?.rulesVersion;
  if (typeof cached === "string" && cached) return cached;
  try {
    const value = game?.settings?.get?.("dnd5e", "rulesVersion");
    if (typeof value === "string" && value) return value;
  } catch {
    // The registered default is modern.
  }
  return "modern";
}

function resolvePack(packOrId, game = globalThis.game) {
  if (packOrId && typeof packOrId === "object") return packOrId;
  const id = String(packOrId ?? "").trim();
  if (!id) return null;
  const packs = game?.packs;
  if (typeof packs?.get === "function") {
    const found = packs.get(id);
    if (found) return found;
  }
  if (packs && typeof packs[Symbol.iterator] === "function") {
    for (const pack of packs) {
      if (pack?.collection === id || pack?.metadata?.id === id) return pack;
    }
  }
  return null;
}

function collectionId(packOrId, pack) {
  if (typeof packOrId === "string" && packOrId.trim()) return packOrId.trim();
  return String(pack?.collection ?? pack?.metadata?.id ?? "").trim();
}

function nativeIsSourceEnabled(pack) {
  const method = globalThis.dnd5e?.applications?.settings?.CompendiumBrowserSettingsConfig?.isSourceEnabled;
  if (typeof method !== "function" || !pack) return undefined;
  try {
    const result = method(pack);
    return typeof result === "boolean" ? result : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Same decision as dnd5e.applications.settings.CompendiumBrowserSettingsConfig.isSourceEnabled.
 * @param {string|object|null|undefined} packOrId
 */
export function isSourceAllowed(packOrId, game = globalThis.game) {
  const pack = resolvePack(packOrId, game);
  const collection = collectionId(packOrId, pack);
  if (!collection) return false;
  if (game?.system?.id && game.system.id !== "dnd5e") return true;

  const native = nativeIsSourceEnabled(pack);
  if (typeof native === "boolean") return native;

  const setting = packSourceConfiguration(game)[collection];
  if (setting !== undefined) return setting;
  if (!pack) return false;
  const rulesVersion = pack.metadata?.flags?.dnd5e?.rulesVersion;
  return !rulesVersion || rulesVersion === currentRulesVersion(game);
}

/** @param {string|object|null|undefined} packOrId */
export function isPackAllowed(packOrId, game = globalThis.game) {
  return isSourceAllowed(packOrId, game);
}

/** The pack when Configure Sources allows it, otherwise null. */
export function getAllowedPack(collection, game = globalThis.game) {
  const pack = resolvePack(collection, game);
  if (!pack || pack.collection == null && pack.metadata?.id == null) return null;
  return isSourceAllowed(pack, game) ? pack : null;
}

/** @param {{ documentName?: string|null }} [options] */
export function getAllowedPacks({ documentName = null } = {}, game = globalThis.game) {
  const packs = game?.packs;
  if (!packs || typeof packs[Symbol.iterator] !== "function") return [];
  const type = documentName ? String(documentName) : "";
  return [...packs].filter(pack =>
    (!type || pack?.documentName === type) && isSourceAllowed(pack, game)
  );
}

export function compendiumPackId(uuid) {
  const match = String(uuid ?? "").match(COMPENDIUM_PACK);
  return match ? `${match[1]}.${match[2]}` : "";
}

/**
 * Compendium UUIDs follow their pack. Any other UUID, including a world actor
 * or owned item, stays allowed. Callers that already hold a compendium uuid
 * use that, not a world copy, as the source.
 */
export function isUuidAllowed(uuid, game = globalThis.game) {
  const value = String(uuid ?? "").trim();
  if (!value) return false;
  const packId = compendiumPackId(value);
  if (!packId) return true;
  return isSourceAllowed(packId, game);
}

function stringAllowed(value, game) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("Compendium.") || DOCUMENT_TYPES.has(trimmed.split(".")[0])) return isUuidAllowed(trimmed, game);
  return isSourceAllowed(trimmed, game);
}

function entryAllowed(entry, game) {
  if (typeof entry === "string") return stringAllowed(entry, game);
  if (!entry || typeof entry !== "object") return false;
  let sawIdentity = false;
  let allowed = true;
  const requireIdentity = value => {
    if (typeof value === "string" && value.trim()) {
      sawIdentity = true;
      allowed = allowed && stringAllowed(value.trim(), game);
    } else if (value && typeof value === "object") {
      sawIdentity = true;
      allowed = allowed && isSourceAllowed(value, game);
    }
  };
  requireIdentity(entry.uuid);
  requireIdentity(entry.packId);
  requireIdentity(entry.pack);
  requireIdentity(entry.sourceId);
  if (!sawIdentity && (entry.collection || entry.metadata)) requireIdentity(entry);
  return sawIdentity && allowed;
}

/** @param {Iterable<string|object>|null|undefined} entries */
export function filterAllowed(entries, game = globalThis.game) {
  if (!entries || typeof entries === "string" || typeof entries[Symbol.iterator] !== "function") return [];
  const allowed = [];
  for (const entry of entries) {
    if (entryAllowed(entry, game)) allowed.push(entry);
  }
  return allowed;
}

export function onConfigureSourcesChanged(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function isConfigureSourcesSetting(setting) {
  const key = String(setting?.key ?? setting?.data?.key ?? "");
  if (key === SETTING_KEY || key === RULES_KEY) return true;
  const namespace = setting?.namespace ?? setting?.data?.namespace;
  return namespace === "dnd5e" && (
    key === "packSourceConfiguration"
    || key === "rulesVersion"
    || key.endsWith(".packSourceConfiguration")
    || key.endsWith(".rulesVersion")
  );
}

function notifyConfigureSourcesChanged() {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (error) {
      console.warn("Morelord Core | Configure Sources listener failed.", error);
    }
  }
  try {
    globalThis.Hooks?.callAll?.(CONFIGURE_SOURCES_CHANGED);
  } catch (error) {
    console.warn("Morelord Core | Configure Sources hook failed.", error);
  }
}

export function installConfigureSourcesWatcher(hooks = globalThis.Hooks) {
  if (!hooks?.on || hooks[WATCHER]) return;
  hooks[WATCHER] = true;
  hooks.on("updateSetting", setting => {
    if (isConfigureSourcesSetting(setting)) notifyConfigureSourcesChanged();
  });
}
