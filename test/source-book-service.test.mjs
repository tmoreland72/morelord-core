import assert from "node:assert/strict";
import test from "node:test";
import { resolveBookLabel } from "../scripts/services/source-book-service.js";

const context = {
  packageCollection: new Map([["dnd-monster-manual", { title: "Monster Manual" }]]),
  system: { config: { sourceBooks: { MM: "Monster Manual" } } },
  config: {},
  i18n: { localize: value => value }
};

test("publisher abbreviations and untranslated Valda keys have readable fallbacks", () => {
  for (const book of ["MDT2", "mdt2 p. 12"]) {
    assert.equal(resolveBookLabel({ ...context, book }), "Mini-Dungeon Tome II");
  }
  const options = { ...context, packageCollection: new Map([["valda", {
    title: "Mage Hand Press - Valda's Spire of Secrets",
    flags: { dnd5e: { sourceBooks: { VSoS: "VSOS.Title" } } }
  }]]), pack: { collection: "valda.items", metadata: { label: "Items" } } };
  for (const book of ["", "VSoS", "VSOS.Title", "Items"]) {
    assert.equal(resolveBookLabel({ ...options, book }), "Valda's Spire of Secrets");
  }
  assert.equal(resolveBookLabel({ ...options, book: "VSoS", i18n: { localize: value => value === "VSOS.Title" ? "Localized Valda" : value } }), "Localized Valda");
});

test("AAW publisher credits resolve within MDT II without relabeling other books", () => {
  const pack = { collection: "foundry5emdt2.items", metadata: { packageName: "foundry5emdt2" } };
  for (const credit of ["AAW", "AAW Games", "aaw p. 12"]) {
    assert.equal(resolveBookLabel({ ...context, book: credit, pack }), "Mini-Dungeon Tome II");
    assert.equal(resolveBookLabel({ ...context, custom: credit, pack }), "Mini-Dungeon Tome II");
  }
  assert.equal(resolveBookLabel({ ...context, custom: "AAW", pack: { collection: "foundry5emdt2.items" } }), "Mini-Dungeon Tome II");
  assert.equal(resolveBookLabel({ ...context, book: "Another Book", custom: "AAW", pack }), "Another Book");
  assert.equal(resolveBookLabel({ ...context, book: "AAW", pack: { collection: "another-book.items" } }), "AAW");
});

test("generic and numeric item sources retain pack metadata and custom book fallback", () => {
  const pack = { collection: "custom.items", metadata: { flags: { dnd5e: { sourceBook: "Campaign Book" } } } };
  for (const book of ["1", "Weapons", "Tools", "Loot"]) {
    assert.equal(resolveBookLabel({ ...context, book, pack }), "Campaign Book");
  }
  assert.equal(resolveBookLabel({ ...context, book: "Items", custom: "MDT2", pack }), "Mini-Dungeon Tome II");
});

test("resolves configured source books before generic compendium labels", () => {
  const label = resolveBookLabel({
    ...context,
    book: "MM",
    pack: { collection: "dnd-monster-manual.actors", metadata: { label: "Actors", packageName: "dnd-monster-manual" } }
  });
  assert.equal(label, "Monster Manual");
});

test("uses owning module titles when source metadata is absent", () => {
  const label = resolveBookLabel({
    ...context,
    pack: { collection: "dnd-monster-manual.actors", metadata: { label: "Actors", packageName: "dnd-monster-manual" } }
  });
  assert.equal(label, "Monster Manual");
});

test("labels shared system actor packs as their SRD books", () => {
  assert.equal(resolveBookLabel({ ...context, pack: { collection: "dnd5e.actors24" } }), "System Reference Document 5.2");
  assert.equal(resolveBookLabel({ ...context, pack: { collection: "dnd5e.monsters" } }), "System Reference Document 5.1");
});

test("page references and abbreviations resolve to one book without merging editions", () => {
  const options = { ...context, config: { DND5E: { sourceBooks: {
    PHB: "Player's Handbook", "PHB 2024": { label: "Player's Handbook (2024)" }
  } } } };
  for (const book of ["PHB Pg. 220", "PHB Pg. 276", "phb p. 20", "Player’s Handbook pp. 20–22"]) {
    assert.equal(resolveBookLabel({ ...options, book }), "Player's Handbook");
  }
  assert.equal(resolveBookLabel({ ...options, book: "PHB 2024 p. 220" }), "Player's Handbook (2024)");
  assert.equal(resolveBookLabel({ ...context, book: "PHB Pg. 220" }), "Player's Handbook");
  assert.equal(resolveBookLabel({ ...context, book: "Campaign Grimoire p. 8" }), "Campaign Grimoire");
});

test("generic labels and module titles use the owning module's declared book", () => {
  const options = { ...context, packageCollection: new Map([["phb", {
    title: "Dungeons & Dragons Player's Handbook",
    flags: { dnd5e: { sourceBooks: { "PHB 2024": "Player's Handbook (2024)" } } }
  }]]), pack: { collection: "phb.classes", metadata: { packageName: "phb", label: "Character Classes" } } };
  for (const book of ["", "Character Classes", "Character Options", "Dungeons & Dragons Player's Handbook"]) {
    assert.equal(resolveBookLabel({ ...options, book }), "Player's Handbook (2024)");
  }
  assert.equal(resolveBookLabel({ ...options, book: "Another Book" }), "Another Book");
  assert.equal(resolveBookLabel({ ...options, book: "Spells", custom: "PHB Pg. 220" }), "Player's Handbook");
});

test("item and spell system packs use the same SRD names as actor packs", () => {
  assert.equal(resolveBookLabel({ ...context, book: "D&D5e SRD 5.1" }), "System Reference Document 5.1");
  assert.equal(resolveBookLabel({ ...context, book: "SRD 5.2" }), "System Reference Document 5.2");
  for (const collection of ["dnd5e.spells", "dnd5e.items", "dnd5e.tradegoods"]) {
    assert.equal(resolveBookLabel({ ...context, pack: { collection } }), "System Reference Document 5.1");
  }
  for (const collection of ["dnd5e.spells24", "dnd5e.equipment24"]) {
    assert.equal(resolveBookLabel({ ...context, pack: { collection } }), "System Reference Document 5.2");
  }
});
