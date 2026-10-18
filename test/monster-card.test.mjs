import test from "node:test";
import assert from "node:assert/strict";
import { createMonsterCard } from "../scripts/ui/monster-card.js";

test("shared monster cards preserve portraits, escaped identity, CR/source and supplied actions", () => {
  const previous = globalThis.document;
  globalThis.document = { createElement: tag => ({ tag, dataset: {}, children: [], querySelector: () => null, querySelectorAll: () => [], append(...children) { this.children.push(...children); } }) };
  try {
    const open = { action: "open" };
    const reroll = { action: "reroll" };
    const monster = { name: "<Dragon>", img: 'portrait".webp', cr: 3, sourceLabel: "Book", requirements: "Rarity: Rare", category: "Animus" };
    const source = createMonsterCard(monster, { actions: [open] });
    assert.equal(source.className, "ml-card ml-monster-card");
    assert.match(source.children[0].children[0].innerHTML, /&lt;Dragon&gt;/);
    assert.match(source.children[0].children[0].innerHTML, /portrait&quot;/);
    assert.equal(source.children[0].children[1].textContent, "CR 3 · Book");
    assert.deepEqual(source.children[1].children, [open]);
    const encounter = createMonsterCard(monster, { quantity: 2, actions: [reroll, open] });
    assert.match(encounter.children[0].children[0].innerHTML, /^2× /);
    assert.deepEqual(encounter.children[1].children, [reroll, open]);
    assert.equal(createMonsterCard({ name: "Roster" }, { showDetails: false }).children[0].children.length, 1);
  } finally { globalThis.document = previous; }
});
