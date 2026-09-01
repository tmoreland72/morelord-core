import assert from "node:assert/strict";
import test from "node:test";
import { resolveBookLabel } from "../scripts/services/source-book-service.js";

const context = {
  packageCollection: new Map([["dnd-monster-manual", { title: "Monster Manual" }]]),
  system: { config: { sourceBooks: { MM: "Monster Manual" } } },
  config: {},
  i18n: { localize: value => value }
};

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
