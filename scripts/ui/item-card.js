import { itemRarity } from "../services/item-rarity.js";

const RARITY_LABELS = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  veryrare: "Very Rare",
  legendary: "Legendary",
  artifact: "Artifact"
};
const COIN_ORDER = ["pp", "gp", "ep", "sp", "cp"];
const DEFAULT_ICON = "fa-solid fa-gift";
const DEFAULT_IMAGE = "icons/svg/item-bag.svg";

/**
 * Chat card for awarded or received items.
 *
 * `MorelordCore.ui.itemCard(options)` and `api.ui.itemCard(options)` return the same HTML string.
 * Post it with `ChatMessage.create`. Foundry turns `@UUID[uuid]{name}` into a content link and its type icon.
 *
 * @param {object} [options]
 * @param {string} [options.title]
 * @param {string} [options.icon] Font Awesome classes. Default `fa-solid fa-gift`.
 * @param {string} [options.recipientName]
 * @param {string} [options.subtitle]
 * @param {Array<{uuid?: string, name: string, img?: string, rarity?: string|object, quantity?: number, value?: string|number}>} [options.items]
 * @param {Array<{heading?: string, items?: Array}>} [options.sections] Headed groups. Each row uses the same item markup.
 * @param {string} [options.emptyText] Shown for an empty item list, or for an empty section.
 * @param {{pp?: number, gp?: number, ep?: number, sp?: number, cp?: number}} [options.coins] Positive denominations only, order pp gp ep sp cp.
 * @param {string} [options.coinLabel] Plain-text coin line used when `coins` has no positive count.
 * @param {string} [options.totalLabel]
 * @param {string} [options.footer] Module label, rendered in uppercase.
 * @param {string} [options.bodyHTML] Inserted raw after the header.
 * @param {string} [options.actionsHTML] Inserted raw before the footer.
 * @returns {string}
 */
export function itemCard({
  title = "",
  icon = DEFAULT_ICON,
  recipientName = "",
  subtitle = "",
  items = [],
  sections = [],
  emptyText = "",
  coins = null,
  coinLabel = "",
  totalLabel = "",
  footer = "",
  bodyHTML = "",
  actionsHTML = ""
} = {}) {
  const sectionList = Array.isArray(sections) ? sections : [];
  const empty = text(emptyText);
  const sectionsHtml = sectionList.map(section => renderSection(section, empty)).join("");
  const itemsHtml = renderItemList(items, sectionList.length ? "" : empty);
  const coinLine = formatCoins(coins) || text(coinLabel);
  const total = text(totalLabel);
  const moduleFooter = text(footer);
  const body = rawSlot(bodyHTML);
  const actions = rawSlot(actionsHTML);
  const recipient = text(recipientName);
  const detail = text(subtitle);

  return `<section class="ml-chat-card ml-award-card">`
    + `<header class="ml-award-card__header">`
    + `<div class="ml-award-card__icon"><i class="${escapeHtml(text(icon) || DEFAULT_ICON)}"></i></div>`
    + `<div class="ml-award-card__heading">`
    + `<div class="ml-award-card__title">${escapeHtml(title)}</div>`
    + (recipient ? `<div class="ml-award-card__recipient"><i class="fa-solid fa-user"></i>${escapeHtml(recipient)}</div>` : "")
    + (detail ? `<div class="ml-award-card__subtitle">${escapeHtml(detail)}</div>` : "")
    + `</div></header>`
    + body
    + itemsHtml
    + sectionsHtml
    + (coinLine ? `<div class="ml-award-card__coins"><i class="fa-solid fa-coins"></i><span>${escapeHtml(coinLine)}</span></div>` : "")
    + (total ? `<div class="ml-award-card__total">${escapeHtml(total)}</div>` : "")
    + actions
    + (moduleFooter ? `<footer class="ml-award-card__footer">${escapeHtml(moduleFooter.toUpperCase())}</footer>` : "")
    + `</section>`;
}

function renderSection(section, emptyText) {
  const heading = text(section?.heading);
  return `<section class="ml-award-card__section">`
    + `<div class="ml-award-card__section-heading">${escapeHtml(heading)}</div>`
    + renderItemList(section?.items, emptyText)
    + `</section>`;
}

function renderItemList(items, emptyText) {
  const rows = (Array.isArray(items) ? items : []).map(renderItem).filter(Boolean);
  if (rows.length) return `<div class="ml-award-card__items">${rows.join("")}</div>`;
  return emptyText ? `<p class="ml-award-card__empty">${escapeHtml(emptyText)}</p>` : "";
}

function renderItem(item) {
  const name = text(item?.name);
  if (!name) return "";
  const uuid = text(item?.uuid);
  const safeName = escapeHtml(name);
  const label = uuid ? `@UUID[${escapeHtml(uuid)}]{${safeName}}` : safeName;
  const rarity = rarityLabel(item?.rarity);
  const value = item?.value == null || item.value === "" ? "" : String(item.value);
  const image = text(item?.img) || DEFAULT_IMAGE;
  return `<article class="ml-award-card__item">`
    + `<img class="ml-award-card__item-image" src="${escapeHtml(image)}" alt="${safeName}">`
    + `<div class="ml-award-card__item-body">`
    + `<div class="ml-award-card__item-name">${label}</div>`
    + (rarity ? `<div class="ml-award-card__item-rarity">${escapeHtml(rarity)}</div>` : "")
    + `</div>`
    + (value ? `<div class="ml-award-card__item-value">${escapeHtml(value)}</div>` : "")
    + `<div class="ml-award-card__item-quantity">×${quantityOf(item?.quantity)}</div>`
    + `</article>`;
}

function rarityLabel(rarity) {
  if (rarity == null || rarity === "") return "";
  const system = rarity && typeof rarity === "object"
    ? (rarity.rarities != null || rarity.rarity != null ? rarity : { rarity })
    : { rarity };
  const key = itemRarity(system);
  return key ? (RARITY_LABELS[key] ?? key) : "";
}

function quantityOf(value) {
  const number = Number(value ?? 1);
  if (!Number.isFinite(number)) return 1;
  return Math.max(1, Math.trunc(number));
}

/** List a purse as given. formatCp rebuckets into gp, sp, and cp, so it is not used here. */
function formatCoins(coins) {
  if (!coins || typeof coins !== "object") return "";
  const parts = [];
  for (const denomination of COIN_ORDER) {
    const count = Math.trunc(Number(coins[denomination]));
    if (Number.isFinite(count) && count > 0) parts.push(`${count} ${denomination}`);
  }
  return parts.join(", ");
}

function text(value) {
  return String(value ?? "").trim();
}

function rawSlot(value) {
  return typeof value === "string" && value.trim() ? value : "";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));
}
