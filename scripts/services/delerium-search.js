import { getAllowedPacks, isUuidAllowed } from "./allowed-packs.js";
import { itemRarity } from "./item-rarity.js";
import { openDeleriumSearchResults } from "../ui/delerium-search-results-app.js";

/**
 * Shared Delerium Search. The caller owns the session object and the roll.
 * This module does not keep a session map.
 */

const DRAKKENHEIM_MODULES = Object.freeze([
  "drakkenheim-core",
  "drakkenheim-monsters",
  "drakkenheim-scgd"
]);
const MONSTERS_PACKAGE = "drakkenheim-monsters";

const ZONES = Object.freeze([
  Object.freeze({ id: "outer", name: "Outer City", dc: 15 }),
  Object.freeze({ id: "inner", name: "Inner City", dc: 20 })
]);

const SKILLS = Object.freeze([
  Object.freeze({ id: "arc", label: "Arcana" }),
  Object.freeze({ id: "inv", label: "Investigation" }),
  Object.freeze({ id: "sur", label: "Survival" })
]);

const REWARDS = Object.freeze([
  Object.freeze({ min: 5, name: "Delerium Shard", formula: "1" }),
  Object.freeze({ min: 4, name: "Delerium Fragment", formula: "1d6" }),
  Object.freeze({ min: 3, name: "Delerium Chip", formula: "3d6" })
]);

// In-flight award lock only. The caller keeps the session.
const awarding = new Set();

export function available(game = globalThis.game) {
  return DRAKKENHEIM_MODULES.some(id => game?.modules?.get?.(id)?.active === true);
}

export function getZones() {
  return ZONES.map(zone => ({ id: zone.id, name: zone.name, dc: zone.dc }));
}

export function getSkillOptions() {
  return SKILLS.map(skill => ({ id: skill.id, label: skill.label }));
}

function createId() {
  const randomID = globalThis.foundry?.utils?.randomID;
  if (typeof randomID === "function") return randomID();
  return globalThis.crypto.randomUUID();
}

function sceneForStart(options = {}) {
  if (Object.prototype.hasOwnProperty.call(options, "scene")) return options.scene || null;
  return globalThis.canvas?.scene ?? null;
}

export function start(zoneId, options = {}) {
  if (!available()) throw new Error("Enable a Drakkenheim content module to search for delerium.");
  const zone = ZONES.find(entry => entry.id === zoneId);
  if (!zone) throw new Error("Choose the Outer City or Inner City.");
  const scene = sceneForStart(options);
  if (!scene) throw new Error("Delerium searching requires an active scene.");
  return {
    id: options.id ? String(options.id) : createId(),
    type: "delerium-search",
    status: "open",
    createdAt: Date.now(),
    gmUserId: globalThis.game?.user?.id ?? null,
    sceneId: scene.id,
    sceneName: scene.name ?? "",
    zone: { id: zone.id, name: zone.name, dc: zone.dc },
    durationHours: 1,
    distanceMiles: 0.25,
    participants: {},
    successes: 0,
    failures: 0,
    results: [],
    selectedCharacterUuids: [],
    messageMode: null
  };
}

function requireSession(session) {
  if (!session || typeof session !== "object") throw new Error("Delerium search session not found.");
  return session;
}

function requireOpen(session) {
  const open = requireSession(session);
  if (open.status !== "open") throw new Error("This delerium search is no longer open.");
  return open;
}

function requireUnresolved(session, userId) {
  if (session.participants?.[userId]?.status) throw new Error("That player's search check is already resolved.");
}

export function attempt(session, { userId, actorUuid, skillId, total, naturalD20 } = {}) {
  const open = requireOpen(session);
  requireUnresolved(open, userId);
  if (!SKILLS.some(skill => skill.id === skillId)) throw new Error("Choose Arcana, Investigation, or Survival.");
  const numericTotal = Number(total);
  const rolledNatural20 = Number(naturalD20) === 20;
  const passed = rolledNatural20 || (Number.isFinite(numericTotal) && numericTotal >= open.zone.dc);
  const successes = passed ? ((rolledNatural20 || numericTotal >= open.zone.dc + 5) ? 2 : 1) : 0;
  const state = {
    userId,
    actorUuid,
    skillId,
    total: numericTotal,
    naturalD20: rolledNatural20 ? 20 : null,
    successes,
    status: passed ? "succeeded" : "failed"
  };
  open.participants[userId] = state;
  open.successes += successes;
  if (!passed) open.failures += 1;
  return state;
}

export function decline(session, { userId, actorUuid = null } = {}) {
  const open = requireOpen(session);
  requireUnresolved(open, userId);
  const state = { userId, actorUuid, status: "declined", successes: 0 };
  open.participants[userId] = state;
  return state;
}

function collectionId(pack) {
  return String(pack?.collection ?? pack?.metadata?.id ?? "");
}

function isMonstersItemPack(pack) {
  if (pack?.metadata?.packageName === MONSTERS_PACKAGE) return true;
  return collectionId(pack).startsWith(`${MONSTERS_PACKAGE}.`);
}

function sameName(left, right) {
  return String(left ?? "").trim().toLowerCase() === String(right ?? "").trim().toLowerCase();
}

function indexEntries(index) {
  if (!index) return [];
  if (typeof index.values === "function") return [...index.values()];
  if (typeof index[Symbol.iterator] === "function") return [...index];
  return [];
}

function entryUuid(pack, entry) {
  if (entry?.uuid) return entry.uuid;
  return `Compendium.${collectionId(pack)}.Item.${entry?._id ?? entry?.id ?? ""}`;
}

async function resolveSourceItem(name, game = globalThis.game) {
  const packs = getAllowedPacks({ documentName: "Item" }, game).filter(isMonstersItemPack);
  for (const pack of packs) {
    const index = await pack.getIndex({ fields: ["name", "img", "system.rarity", "system.rarities"] });
    for (const entry of indexEntries(index)) {
      if (!sameName(entry?.name, name)) continue;
      const uuid = entryUuid(pack, entry);
      if (!isUuidAllowed(uuid, game)) continue;
      const document = await pack.getDocument(entry._id ?? entry.id);
      if (!document) continue;
      if (document.uuid && !isUuidAllowed(document.uuid, game)) continue;
      return document;
    }
  }
  return null;
}

export async function finalize(session) {
  const open = requireOpen(session);
  const earned = REWARDS.filter(entry => open.successes >= entry.min).reverse();
  const rewards = [];
  for (const reward of earned) {
    const source = await resolveSourceItem(reward.name);
    if (!source) throw new Error(`${reward.name} was not found in the enabled Monsters of Drakkenheim Item compendiums.`);
    rewards.push({
      sourceUuid: source.uuid,
      name: source.name,
      img: source.img,
      formula: reward.formula,
      rarity: itemRarity(source.system) ?? null
    });
  }
  open.rewards = rewards;
  open.result = null;
  open.randomEncounter = open.failures >= 2;
  open.status = "complete";
  open.completedAt = Date.now();
  return open;
}

function awardKey(session) {
  return session.id ?? session;
}

function messageOptions(session) {
  return session.messageMode ? { messageMode: session.messageMode } : {};
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[character]));
}

function awardCard(recipient, items) {
  const rows = items.map(item => {
    const img = item.img || "icons/svg/item-bag.svg";
    return `<div class="ml-item-row"><img src="${escapeHtml(img)}" alt="${escapeHtml(item.name)}"><span class="ml-stack" data-gap="1"><strong>${escapeHtml(item.quantity)} × ${escapeHtml(item.name)}</strong></span></div>`;
  }).join("");
  return `<section class="ml-chat-card ml-stack"><h3>Delerium Found</h3><p>Awarded to ${escapeHtml(recipient?.name)}.</p>${rows}</section>`;
}

function alreadyDelivered(session, reward, source) {
  return session.results.some(result =>
    result.sourceUuid === reward.sourceUuid
    || result.sourceUuid === source?.uuid
    || sameName(result.name, reward.name));
}

async function resolveRewardSource(reward) {
  if (isUuidAllowed(reward?.sourceUuid)) {
    try {
      const stored = await globalThis.fromUuid(reward.sourceUuid);
      if (stored) return stored;
    } catch {
      // The stored compendium document is gone. Look the item up by name.
    }
  }
  return resolveSourceItem(reward?.name);
}

export async function rollAndAward(session, recipientUuid) {
  const current = requireSession(session);
  if (current.status !== "complete") throw new Error("Finalize the delerium search before awarding its result.");
  if (!current.rewards?.length) throw new Error("This search did not find any delerium to award.");
  if (current.result) throw new Error("This search result has already been awarded.");
  const key = awardKey(current);
  if (awarding.has(key)) throw new Error("This search is already being awarded.");
  if (!Array.isArray(current.results)) current.results = [];
  if (current.results.length && current.results[0].recipientUuid !== recipientUuid) {
    throw new Error("Finish awarding this search to the original recipient.");
  }
  awarding.add(key);
  try {
    const recipient = recipientUuid ? await globalThis.fromUuid(recipientUuid) : null;
    if (!recipient || !["character", "group"].includes(recipient.type)) {
      throw new Error("Choose a valid party or character recipient.");
    }
    const sources = await Promise.all(current.rewards.map(async reward => {
      const source = await resolveRewardSource(reward);
      if (!source) throw new Error(`${reward.name} is no longer available in the enabled compendiums.`);
      return source;
    }));
    const speaker = globalThis.ChatMessage?.getSpeaker?.({ actor: recipient }) ?? {};
    for (const [index, reward] of current.rewards.entries()) {
      const source = sources[index];
      if (alreadyDelivered(current, reward, source)) continue;
      if (reward.quantity == null) {
        const roll = await new globalThis.Roll(reward.formula).evaluate();
        await roll.toMessage({
          flavor: `Delerium Search — ${reward.name}`,
          speaker
        }, messageOptions(current));
        reward.quantity = Number(roll.total);
      }
      const data = source.toObject();
      delete data._id;
      data.system ??= {};
      data.system.quantity = reward.quantity;
      const created = await recipient.createEmbeddedDocuments("Item", [data]);
      const item = Array.isArray(created) ? created[0] : created;
      if (!item?.uuid) throw new Error(`${reward.name} could not be added to ${recipient.name}.`);
      current.results.push({
        sourceUuid: source.uuid,
        name: source.name,
        img: source.img,
        quantity: reward.quantity,
        itemUuid: item.uuid,
        recipientName: recipient.name,
        recipientUuid: recipient.uuid
      });
    }
    current.result = {
      items: [...current.results],
      recipientName: recipient.name,
      recipientUuid: recipient.uuid
    };
    await globalThis.ChatMessage.create({
      speaker,
      content: awardCard(recipient, current.results)
    }, messageOptions(current));
    return current.result;
  } finally {
    awarding.delete(key);
  }
}

export function openResults(session, options) {
  return openDeleriumSearchResults(session, options);
}

export const deleriumSearch = Object.freeze({
  available,
  getZones,
  getSkillOptions,
  start,
  attempt,
  decline,
  finalize,
  rollAndAward,
  openResults
});
