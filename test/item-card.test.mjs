import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { itemCard } from "../scripts/ui/item-card.js";

const potion = {
  uuid: "Compendium.dnd5e.items.Item.potion",
  name: "Potion of Healing",
  img: "icons/consumables/potions/potion-red.webp",
  rarity: "Rare",
  quantity: 2,
  value: "50 gp"
};

test("itemCard renders the award header and escapes its text", () => {
  const html = itemCard({
    title: "Items <Received>",
    recipientName: "Ada & Bob",
    subtitle: "From \"the vault\""
  });
  assert.match(html, /<section class="ml-chat-card ml-award-card">/);
  assert.match(html, /<i class="fa-solid fa-gift"><\/i>/);
  assert.match(html, /ml-award-card__title">Items &lt;Received&gt;/);
  assert.match(html, /ml-award-card__recipient"><i class="fa-solid fa-user"><\/i>Ada &amp; Bob/);
  assert.match(html, /ml-award-card__subtitle">From &quot;the vault&quot;/);
  const custom = itemCard({ title: "Loot", icon: "fa-solid fa-sack\" onclick=\"alert(1)" });
  assert.match(custom, /class="fa-solid fa-sack&quot; onclick=&quot;alert\(1\)"/);
  assert.doesNotMatch(itemCard({ title: "Loot" }), /ml-award-card__recipient|ml-award-card__subtitle|ml-award-card__footer/);
});

test("item rows link a uuid, label rarity, and keep rows that lack either", () => {
  const html = itemCard({
    title: "Received",
    items: [
      potion,
      { name: "Torch & <tinder>", quantity: 3 },
      { name: "Mundane", rarity: "mundane" },
      { name: "Lowest", rarity: { rarities: ["legendary", "rare"] } },
      { rarity: "rare" }
    ]
  });
  const rows = html.match(/<article class="ml-award-card__item">[\s\S]*?<\/article>/g);
  assert.equal(rows.length, 4);
  assert.match(rows[0], /src="icons\/consumables\/potions\/potion-red\.webp"/);
  assert.match(rows[0], /alt="Potion of Healing"/);
  assert.match(rows[0], /@UUID\[Compendium\.dnd5e\.items\.Item\.potion\]\{Potion of Healing\}/);
  assert.match(rows[0], /ml-award-card__item-rarity">Rare</);
  assert.match(rows[0], /ml-award-card__item-value">50 gp</);
  assert.match(rows[0], /ml-award-card__item-quantity">×2</);
  assert.match(rows[1], /ml-award-card__item-name">Torch &amp; &lt;tinder&gt;</);
  assert.doesNotMatch(rows[1], /@UUID|ml-award-card__item-rarity|ml-award-card__item-value/);
  assert.match(rows[1], /×3/);
  assert.doesNotMatch(rows[2], /ml-award-card__item-rarity/);
  assert.match(rows[3], /ml-award-card__item-rarity">Rare</);
  assert.match(itemCard({ title: "One", items: [{ name: "Bag", quantity: 2.9 }] }), /×2/);
  assert.match(itemCard({ title: "One", items: [{ name: "Bag" }] }), /src="icons\/svg\/item-bag\.svg"/);
  assert.match(itemCard({ title: "One", items: [{ name: "Bag" }] }), /×1/);
});

test("bodyHTML and actionsHTML are inserted raw", () => {
  const html = itemCard({
    title: "Received",
    bodyHTML: `<em class="keep">Keep & show</em>`,
    actionsHTML: `<button type="button">Take</button>`
  });
  assert.match(html, /<em class="keep">Keep & show<\/em>/);
  assert.match(html, /<button type="button">Take<\/button>/);
  assert.ok(html.indexOf("ml-award-card__header") < html.indexOf("keep"));
  assert.ok(html.indexOf("Take") < html.indexOf("</section>"));
});

test("sections reuse item rows and emptyText covers an empty list or section", () => {
  const html = itemCard({
    title: "Treasure Hoard",
    emptyText: "None.",
    items: [{ name: "Rope", quantity: 1 }],
    sections: [
      { heading: "Crafting <Materials>", items: [{ uuid: "Item.rope", name: "Rope", rarity: "common", quantity: 4 }] },
      { heading: "Potions", items: [] }
    ]
  });
  assert.match(html, /ml-award-card__section-heading">Crafting &lt;Materials&gt;/);
  assert.match(html, /ml-award-card__section-heading">Potions/);
  assert.match(html, /@UUID\[Item\.rope\]\{Rope\}/);
  assert.match(html, /ml-award-card__item-rarity">Common</);
  assert.match(html, /×4/);
  const rows = html.match(/<article class="ml-award-card__item">/g);
  assert.equal(rows.length, 2);
  assert.equal(html.match(/<p class="ml-award-card__empty">None\.<\/p>/g).length, 1);
  const empty = itemCard({ title: "Empty", emptyText: "<None>" });
  assert.match(empty, /<p class="ml-award-card__empty">&lt;None&gt;<\/p>/);
  assert.doesNotMatch(empty, /ml-award-card__item/);
  const grouped = itemCard({ title: "Grouped", emptyText: "None.", sections: [{ heading: "Coin", items: [] }] });
  assert.equal(grouped.match(/None\./g).length, 1);
});

test("coins render a positive purse and coinLabel is the plain-text fallback", () => {
  const html = itemCard({
    title: "Encounter Loot Received",
    items: [{ name: "Dagger" }],
    coins: { pp: 5, gp: 0, ep: -2, sp: 3.9, cp: 5 },
    coinLabel: "should not show",
    totalLabel: "Total <12> gp",
    footer: "Morelord Craftworks"
  });
  assert.match(html, /ml-award-card__coins"><i class="fa-solid fa-coins"><\/i><span>5 pp, 3 sp, 5 cp</);
  assert.doesNotMatch(html, /should not show/);
  assert.match(html, /ml-award-card__total">Total &lt;12&gt; gp/);
  assert.match(html, /ml-award-card__footer">MORELORD CRAFTWORKS/);
  const itemsAt = html.indexOf("ml-award-card__items");
  const coinsAt = html.indexOf("ml-award-card__coins");
  const totalAt = html.indexOf("ml-award-card__total");
  const footerAt = html.indexOf("ml-award-card__footer");
  assert.ok(itemsAt < coinsAt && coinsAt < totalAt && totalAt < footerAt);
  assert.match(itemCard({ title: "Coins", coinLabel: "12 gp, 5 sp" }), /<span>12 gp, 5 sp</);
  assert.doesNotMatch(itemCard({ title: "None", coins: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 } }), /ml-award-card__coins/);
  assert.match(itemCard({ title: "Fallback", coins: { gp: 0 }, coinLabel: "a <pile>" }), /a &lt;pile&gt;/);
});

test("itemCard is published on the Core ui API and the help button stays inline", async () => {
  const main = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
  assert.match(main, /import \{ itemCard \} from "\.\/ui\/item-card\.js"/);
  assert.match(main, /ui: Object\.freeze\(\{[\s\S]*\bitemCard,/);
  const css = await readFile(new URL("../styles/morelord-components.css", import.meta.url), "utf8");
  const help = css.match(/\.ml-window \.window-content button\.ml-help-button,\s*\.ml-window \.window-content \.ml-icon-button\.ml-help-button,\s*\.ml-icon-button\.ml-help-button \{[^}]+\}/);
  assert.ok(help);
  assert.match(help[0], /height:\s*1em/);
  assert.match(help[0], /max-height:\s*1em/);
  assert.match(help[0], /min-height:\s*0/);
  assert.match(help[0], /flex:\s*none/);
  assert.doesNotMatch(help[0], /!important/);
  for (const part of ["header", "icon", "title", "recipient", "items", "item", "item-image", "item-name", "item-rarity", "item-quantity", "item-value", "section", "section-heading", "coins", "footer"]) {
    assert.match(css, new RegExp(String.raw`\.ml-award-card__${part}(?=[\s,:.{])`));
  }
});
