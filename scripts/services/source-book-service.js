const SYSTEM_PACK_LABELS = Object.freeze({
  "drakkenheim-monsters.monsters": "Monsters of Drakkenheim",
  "dnd5e.actors24": "System Reference Document 5.2",
  "dnd5e.monsters": "System Reference Document 5.1",
  "dnd5e.spells": "System Reference Document 5.1",
  "dnd5e.items": "System Reference Document 5.1",
  "dnd5e.tradegoods": "System Reference Document 5.1",
  "dnd5e.spells24": "System Reference Document 5.2",
  "dnd5e.equipment24": "System Reference Document 5.2"
});

const GENERIC_LABELS = /^(?:items?|equipment|weapons?|armor|tools?|loot|consumables?|spells?|monsters?|actors?|journals?|tables?|roll tables|adventures?|classes|class|features?|character classes|character options)$/i;
const BOOK_ALIASES = { phb: "Player's Handbook", dmg: "Dungeon Master's Guide", mm: "Monster Manual", mdt2: "Mini-Dungeon Tome II", vsos: "Valda's Spire of Secrets", "vsos.title": "Valda's Spire of Secrets" };

function bookName(value) {
  return String(value ?? "").trim()
    .replace(/\s*[,;:]?\s+(?:p(?:g|ages?)?\.?|pp\.?)\s*\d+(?:\s*[-–]\s*\d+)?\.?$/i, "")
    .replace(/[’‘]/g, "'");
}

function localized(value, i18n) {
  if (!value) return "";
  return i18n?.localize?.(value) || String(value);
}

/** Resolve a human-facing source-book name without exposing generic pack labels. */
export function resolveBookLabel({ book = "", custom = "", pack = null, packageCollection = game.modules, system = game.system, config = globalThis.CONFIG, i18n = game.i18n } = {}) {
  const collection = pack?.collection ?? "";
  if (SYSTEM_PACK_LABELS[collection]) return SYSTEM_PACK_LABELS[collection];

  const packageName = pack?.metadata?.packageName ?? pack?.metadata?.package ?? collection.split(".")[0];
  const owner = packageName ? packageCollection?.get?.(packageName) : null;
  const ownerBooks = owner?.flags?.dnd5e?.sourceBooks ?? {};
  const books = { ...system?.config?.sourceBooks, ...config?.DND5E?.sourceBooks, ...ownerBooks };
  const labelOf = value => {
    const label = localized(value && typeof value === "object" ? value.label ?? value.name ?? value.title : value, i18n);
    return BOOK_ALIASES[label.toLowerCase()] ?? label;
  };
  const canonical = value => {
    const raw = bookName(localized(value, i18n));
    if (!raw || /^\d+$/.test(raw) || GENERIC_LABELS.test(raw)) return "";
    // MDT II includes items credited only to its publisher in source.custom.
    if (packageName === "foundry5emdt2" && /^aaw(?: games)?$/i.test(raw)) return "Mini-Dungeon Tome II";
    const srd = raw.match(/^(?:(?:d&d|dnd)\s*5e\s*)?(?:srd|system reference document)\s*5[.\s]([12])$/i);
    if (srd) return `System Reference Document 5.${srd[1]}`;
    const match = Object.entries(books).find(([key, label]) =>
      bookName(key).toLowerCase() === raw.toLowerCase()
      || bookName(labelOf(label)).toLowerCase() === raw.toLowerCase());
    if (match) return labelOf(match[1]);
    if (raw.toLowerCase() === bookName(owner?.title).toLowerCase() && Object.keys(ownerBooks).length === 1) {
      return labelOf(Object.values(ownerBooks)[0]);
    }
    return BOOK_ALIASES[raw.toLowerCase()] ?? raw;
  };

  const explicit = canonical(book) || canonical(custom) || canonical(pack?.metadata?.sourceBook ?? pack?.metadata?.flags?.dnd5e?.sourceBook);
  if (explicit) return explicit;
  // One declared book is more precise than an umbrella module or generic pack title.
  if (Object.keys(ownerBooks).length === 1) return labelOf(Object.values(ownerBooks)[0]);
  return canonical(owner?.title) || canonical(pack?.metadata?.label) || canonical(pack?.title) || "Unknown Source";
}
