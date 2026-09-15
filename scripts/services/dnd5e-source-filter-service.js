import { resolveBookLabel } from "./source-book-service.js";

export class Dnd5eSourceFilterService {
  get configuration() {
    if (game.system.id !== "dnd5e") return {};

    try {
      return game.settings.get(
        "dnd5e",
        "packSourceConfiguration"
      ) ?? {};
    } catch {
      return {};
    }
  }

  isPackEnabled(packOrCollection) {
    if (game.system.id !== "dnd5e") return true;

    const collection =
      typeof packOrCollection === "string"
        ? packOrCollection
        : packOrCollection?.collection;

    if (!collection) return true;

    // D&D5e's Compendium Browser source configuration is exclusion-based.
    // Current versions store pack collections directly, but tolerate nested
    // configuration shapes so Craftworks remains compatible with source
    // configuration produced by add-on content packages.
    const config = this.configuration;
    if (config?.[collection] === false) return false;

    const shortCollection = String(collection)
      .split(".")
      .at(-1);

    if (config?.[shortCollection] === false) return false;

    const pack =
      typeof packOrCollection === "string"
        ? game.packs.get(packOrCollection)
        : packOrCollection;

    const packageName = String(
      pack?.metadata?.packageName
      ?? pack?.metadata?.package
      ?? ""
    );

    if (
      packageName
      && config?.[packageName]?.[collection] === false
    ) {
      return false;
    }

    if (
      Array.isArray(config?.disabled)
      && config.disabled.includes(collection)
    ) {
      return false;
    }

    const identifiers = new Set([
      collection,
      shortCollection,
      packageName,
      pack?.metadata?.label,
      pack?.metadata?.name,
      pack?.metadata?.sourceBook,
      pack?.title,
      this.sourceLabelForPack(pack)
    ].filter(Boolean).map(value => this.#normalizeIdentifier(value)));

    if (this.#configurationDisables(config, identifiers)) {
      return false;
    }

    return true;
  }

  isSourceEnabled(sourceLabel, { itemType = null } = {}) {
    if (game.system.id !== "dnd5e") return true;

    const normalized = this.#normalizeIdentifier(sourceLabel).replace("systemreferencedocument", "srd");
    const collections = normalized === "srd51"
      ? (itemType === "spell"
          ? ["dnd5e.spells"]
          : ["dnd5e.items", "dnd5e.tradegoods"])
      : normalized === "srd52"
        ? (itemType === "spell"
            ? ["dnd5e.spells24"]
            : ["dnd5e.equipment24"])
        : [];

    if (!collections.length) return true;

    // An SRD-labeled document may have been copied into a world or module
    // compendium. Honor the canonical D&D5e source setting in addition to the
    // container pack so copied documents cannot bypass Configure Sources.
    return collections.some(collection => this.isPackEnabled(collection));
  }

  sourceLabelForPack(packOrCollection) {
    const pack =
      typeof packOrCollection === "string"
        ? game.packs.get(packOrCollection)
        : packOrCollection;

    return (game.modules?.get?.("morelord-core")?.api?.sources?.resolveBookLabel ?? resolveBookLabel)({ pack }) ?? "Unknown Source";
  }

  sourceLabelForItem(itemData, { pack = null } = {}) {
    const source = itemData?.system?.source;
    const book = typeof source === "string" ? source : source?.book ?? "";
    const custom = typeof source === "object" ? source?.custom ?? "" : "";
    return (game.modules?.get?.("morelord-core")?.api?.sources?.resolveBookLabel ?? resolveBookLabel)({ book, custom, pack }) ?? "Unknown Source";
  }

  async sourceLabelForCompendiumItem(itemData, { pack = null } = {}) {
    const indexedLabel = this.sourceLabelForItem(itemData, { pack });
    if (indexedLabel !== "Unknown Source" || !pack || !itemData?._id) {
      return indexedLabel;
    }

    try {
      const document = await pack.getDocument(itemData._id);
      if (document) return this.sourceLabelForItem(document, { pack });
    } catch (error) {
      console.warn(
        `Morelord Core | Unable to resolve source for ${pack.collection}.${itemData._id}.`,
        error
      );
    }

    return this.sourceLabelForPack(pack);
  }

  sortPacks(packs = []) {
    return [...packs].sort((a, b) => {
      const priorityDelta =
        this.packPriority(a) - this.packPriority(b);

      if (priorityDelta) return priorityDelta;

      const aLabel = String(
        a?.metadata?.label
        ?? a?.title
        ?? a?.collection
        ?? ""
      );

      const bLabel = String(
        b?.metadata?.label
        ?? b?.title
        ?? b?.collection
        ?? ""
      );

      return aLabel.localeCompare(bLabel);
    });
  }

  packPriority(pack) {
    const collection = String(pack?.collection ?? "").toLowerCase();

    const metadataText = [
      pack?.metadata?.label,
      pack?.metadata?.name,
      pack?.metadata?.sourceBook,
      pack?.metadata?.system,
      pack?.title,
      collection
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const isSrd = /\bsrd\b/.test(metadataText)
      || collection === "dnd5e.equipment24"
      || collection === "dnd5e.items"
      || collection === "dnd5e.tradegoods";

    if (!isSrd) return 0;

    const is52 =
      /\bsrd\s*5[.\s_-]*2\b/.test(metadataText)
      || collection === "dnd5e.equipment24";

    if (is52) return 100;

    const is51 =
      /\bsrd\s*5[.\s_-]*1\b/.test(metadataText)
      || collection === "dnd5e.items"
      || collection === "dnd5e.tradegoods";

    if (is51) return 200;

    // Unknown/older SRD sources come after the known generations.
    return 300;
  }

  enabledPacks({
    documentName = null,
    includeWorld = true
  } = {}) {
    return this.sortPacks(
      Array.from(game.packs ?? [])
        .filter(pack =>
          !documentName
          || pack.documentName === documentName
        )
        .filter(pack =>
          includeWorld
          || pack.metadata?.packageType !== "world"
        )
        .filter(pack =>
          this.isPackEnabled(pack)
        )
    );
  }

  #configurationDisables(value, identifiers, key = "") {
    if (value == null) return false;

    const normalizedKey = this.#normalizeIdentifier(key);
    const keyMatches = normalizedKey && identifiers.has(normalizedKey);

    if (keyMatches && value === false) return true;

    if (Array.isArray(value)) {
      if (
        /disabled|excluded/i.test(key)
        && value.some(entry =>
          identifiers.has(this.#normalizeIdentifier(entry))
        )
      ) return true;

      return value.some(entry =>
        this.#configurationDisables(entry, identifiers)
      );
    }

    if (typeof value !== "object") return false;

    if (
      keyMatches
      && (
        value.enabled === false
        || value.load === false
        || value.active === false
      )
    ) return true;

    const identity =
      value.collection
      ?? value.id
      ?? value.key
      ?? value.name
      ?? value.label
      ?? value.source;

    if (
      identifiers.has(this.#normalizeIdentifier(identity))
      && (
        value.enabled === false
        || value.load === false
        || value.active === false
      )
    ) return true;

    return Object.entries(value).some(([childKey, childValue]) =>
      this.#configurationDisables(
        childValue,
        identifiers,
        childKey
      )
    );
  }

  #normalizeIdentifier(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

}
