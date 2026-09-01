const SYSTEM_PACK_LABELS = Object.freeze({
  "drakkenheim-monsters.monsters": "Monsters of Drakkenheim",
  "dnd5e.actors24": "System Reference Document 5.2",
  "dnd5e.monsters": "System Reference Document 5.1"
});

function localized(value, i18n) {
  if (!value) return "";
  return i18n?.localize?.(value) || String(value);
}

/** Resolve a human-facing source-book name without exposing generic pack labels. */
export function resolveBookLabel({ book = "", pack = null, packageCollection = game.modules, system = game.system, config = globalThis.CONFIG, i18n = game.i18n } = {}) {
  const collection = pack?.collection ?? "";
  if (SYSTEM_PACK_LABELS[collection]) return SYSTEM_PACK_LABELS[collection];

  const raw = String(book || pack?.metadata?.sourceBook || "").trim();
  const configured = config?.DND5E?.sourceBooks?.[raw] ?? system?.config?.sourceBooks?.[raw];
  const configuredLabel = configured && typeof configured === "object"
    ? configured.label ?? configured.name ?? configured.title
    : configured;
  const resolvedBook = localized(configuredLabel || raw, i18n);
  if (resolvedBook) return resolvedBook;

  const packageName = pack?.metadata?.packageName;
  const packageTitle = packageName ? packageCollection?.get?.(packageName)?.title : "";
  if (packageTitle) return packageTitle;

  return localized(pack?.metadata?.label ?? pack?.title ?? collection, i18n);
}
