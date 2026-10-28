/**
 * Primary compendium filter for every Morelord module.
 *
 * D&D 5e 6.0.6 (Foundry v14) stores Configure Sources in the world setting
 * `dnd5e.packSourceConfiguration`. CompendiumBrowserSettingsConfig.collateSources
 * and the compendium browser's document index keep a pack when
 * `setting[collection] !== false`. Unchecking the System package writes `false`
 * for every `game.system.packs` id (`package.name`, the same string as
 * `CompendiumCollection#collection`). Missing keys stay enabled. Core does not
 * substitute SRD packs or guess nested shapes.
 */

export const CONFIGURE_SOURCES_CHANGED = "morelordCoreConfigureSourcesChanged";
const SETTING_KEY = "dnd5e.packSourceConfiguration";
const WATCHER = Symbol.for("morelord-core.configureSourcesWatcher");
const DOCUMENT_TYPES = new Set([
  "Actor", "Adventure", "Cards", "ChatMessage", "Combat", "FogExploration",
  "Folder", "Item", "JournalEntry", "Macro", "Playlist", "RollTable", "Scene",
  "Setting", "User"
]);
const COMPENDIUM_PACK = /^Compendium\.([^.]+)\.([^.]+)(?:\.|$)/;
const listeners = new Set();

export function packSourceConfiguration(game = globalThis.game) {
  if (game?.system?.id !== "dnd5e") return {};
  try {
    const value = game.settings?.get?.("dnd5e", "packSourceConfiguration");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value;
  } catch {
    return {};
  }
}

function packIdentifiers(packOrId) {
  if (typeof packOrId === "string") {
    const id = packOrId.trim();
    return id ? [id] : [];
  }
  if (!packOrId || typeof packOrId !== "object") return [];
  const metadata = packOrId.metadata ?? {};
  const packageName = String(metadata.packageName ?? metadata.package ?? "").trim();
  const name = String(metadata.name ?? "").trim();
  return [...new Set([
    packOrId.collection,
    metadata.id,
    packageName && name ? `${packageName}.${name}` : ""
  ].map(value => String(value ?? "").trim()).filter(Boolean))];
}

/** @param {string|object|null|undefined} packOrId Pack, collection id, or metadata id. */
export function isPackAllowed(packOrId, game = globalThis.game) {
  const keys = packIdentifiers(packOrId);
  if (!keys.length) return false;
  if (game?.system?.id !== "dnd5e") return true;
  const configuration = packSourceConfiguration(game);
  return keys.every(key => configuration[key] !== false);
}

/** @param {{ documentName?: string|null }} [options] */
export function getAllowedPacks({ documentName = null } = {}, game = globalThis.game) {
  const packs = game?.packs;
  if (!packs || typeof packs[Symbol.iterator] !== "function") return [];
  const type = documentName ? String(documentName) : "";
  return [...packs].filter(pack =>
    (!type || pack?.documentName === type) && isPackAllowed(pack, game)
  );
}

export function compendiumPackId(uuid) {
  const match = String(uuid ?? "").match(COMPENDIUM_PACK);
  return match ? `${match[1]}.${match[2]}` : "";
}

function documentFromUuid(uuid, game) {
  try {
    const resolved = globalThis.fromUuidSync?.(uuid, { strict: false });
    if (resolved && typeof resolved === "object" && typeof resolved.then !== "function") return resolved;
  } catch {
    // An unknown world id is not an allowed source.
  }
  const [type, id, embeddedType, embeddedId] = String(uuid).split(".");
  if (type === "Actor" && id && !embeddedType) return game?.actors?.get?.(id) ?? null;
  if (type === "Item" && id && !embeddedType) return game?.items?.get?.(id) ?? null;
  if (type === "Scene" && embeddedType === "Token" && embeddedId) {
    return game?.scenes?.get?.(id)?.tokens?.get?.(embeddedId) ?? null;
  }
  return null;
}

function provenanceUuids(document) {
  const stats = document?._stats ?? {};
  const stored = document?._source?._stats ?? {};
  const flags = document?.flags ?? {};
  const values = [
    stats.compendiumSource,
    stored.compendiumSource,
    stats.duplicateSource,
    stored.duplicateSource,
    flags.core?.sourceId,
    flags.dnd5e?.sourceId
  ];
  if (typeof document?.getFlag === "function") {
    try {
      values.push(document.getFlag("core", "sourceId"), document.getFlag("dnd5e", "sourceId"));
    } catch {
      // A document without that flag scope has no provenance there.
    }
  }
  return values.filter(value => typeof value === "string" && value.trim());
}

function referencesExcludedPack(document, seen, depth, game) {
  if (!document || typeof document !== "object" || depth > 4 || seen.has(document)) return false;
  seen.add(document);

  const ownPack = compendiumPackId(document.uuid) || String(document.pack ?? "").trim();
  if (ownPack && !isPackAllowed(ownPack, game)) return true;

  for (const source of provenanceUuids(document)) {
    const packId = compendiumPackId(source);
    if (packId) {
      if (!isPackAllowed(packId, game)) return true;
      continue;
    }
    const next = documentFromUuid(source, game);
    if (next && referencesExcludedPack(next, seen, depth + 1, game)) return true;
  }

  if (document.documentName === "Token") {
    const actor = document.actor ?? (document.actorId ? game?.actors?.get?.(document.actorId) : null);
    if (actor && referencesExcludedPack(actor, seen, depth + 1, game)) return true;
  }

  const parent = document.parent;
  if (parent?.documentName === "Actor" && referencesExcludedPack(parent, seen, depth + 1, game)) return true;
  return false;
}

/**
 * Compendium UUIDs are decided by their pack. World actors, items, and tokens
 * are rejected when the document itself, its actor, or its import provenance
 * points at an excluded pack.
 */
export function isUuidAllowed(uuid, game = globalThis.game) {
  const value = String(uuid ?? "").trim();
  if (!value) return false;
  const packId = compendiumPackId(value);
  if (packId) return isPackAllowed(packId, game);
  const document = documentFromUuid(value, game);
  if (!document) return false;
  return !referencesExcludedPack(document, new WeakSet(), 0, game);
}

function stringAllowed(value, game) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("Compendium.") || DOCUMENT_TYPES.has(trimmed.split(".")[0])) return isUuidAllowed(trimmed, game);
  return isPackAllowed(trimmed, game);
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
      allowed = allowed && isPackAllowed(value, game);
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
  if (key === SETTING_KEY) return true;
  const namespace = setting?.namespace ?? setting?.data?.namespace;
  return namespace === "dnd5e" && (key === "packSourceConfiguration" || key.endsWith(".packSourceConfiguration"));
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
