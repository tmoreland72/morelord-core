import test from "node:test";
import assert from "node:assert/strict";
import { itemRarities, itemRarity } from "../scripts/services/item-rarity.js";

test("item rarity supports legacy data and v6 source/model data without mutation", () => {
  for (const rarity of ["Very Rare", "veryRare", { value: "very-rare" }, { id: "veryrare" }, { key: "veryrare" }]) {
    assert.equal(itemRarity({ rarity }), "veryrare");
  }
  for (const rarities of [["legendary", "rare", "rare"], new Set(["legendary", "rare"])]) {
    const before = [...rarities];
    assert.deepEqual(itemRarities({ rarities, rarity: "common" }), ["rare", "legendary"]);
    assert.equal(itemRarity({ rarities }), "rare");
    assert.deepEqual([...rarities], before);
  }
  assert.deepEqual(itemRarities({ rarities: [], rarity: "rare" }), []);
  assert.deepEqual(itemRarities({ rarities: new Set(), rarity: "rare" }), []);
  for (const rarity of [undefined, null, "", "none", "mundane"]) assert.equal(itemRarity({ rarity }), undefined);
  assert.equal(itemRarity(null), undefined);
});
