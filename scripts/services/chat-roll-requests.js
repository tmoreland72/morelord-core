import { actorIdentity, actorIdentityName } from "../ui/actor-identity.js";
import { awardCardHeader } from "../ui/item-card.js";
import { activePlayerForActor, isIgnored, listUsers } from "./user-service.js";

const ID = "morelord-core";
const ENTRY_PATCH_KEYS = ["title", "actionLabel", "modes", "choices", "dc", "data", "completed"];
const escape = value => foundry.utils.escapeHTML(String(value ?? ""));
const submittedRolls = new Set();
export const isRollSubmitted = (message, key) => submittedRolls.has(`${message.id}:${key}`);
export async function submitChatRoll(message, key, row, submit) {
  if (isRollSubmitted(message, key)) return;
  const id = `${message.id}:${key}`;
  submittedRolls.add(id);
  markRollCompleted(row);
  try { return await submit(); }
  finally {
    submittedRolls.delete(id);
    // Rejected/cancelled rolls regain their controls from the authoritative card.
    ui.chat?.updateMessage(message);
  }
}
export const rollAuthority = message => listUsers().find(user => user.active && user.isGM && user.id === message?.author?.id)
  ?? listUsers().find(user => user.active && user.isGM);
export function canRollForActor(actor, user = game.user) {
  return Boolean(user?.active && !isIgnored(user) && (user.isGM || (actor && activePlayerForActor(actor)?.id === user.id)));
}
export function rollControls(attributes, { modes = true, actionLabel = "Roll" } = {}) {
  const safeLabel = actionLabel === "Roll" ? "Roll" : escape(actionLabel);
  return `<div class="ml-roll-controls">${(modes ? [["dis", "DIS"], ["normal", "Roll"], ["adv", "ADV"]] : [["normal", safeLabel]]).map(([mode, label]) =>
    `<button type="button" class="ml-button" ${attributes(mode)} aria-label="${mode === "dis" ? "Roll with disadvantage" : mode === "adv" ? "Roll with advantage" : safeLabel}">${label}</button>`).join("")}</div>`;
}
export function markRollCompleted(row) {
  if (!row || row.querySelector(".ml-roll-completed")) return;
  for (const control of row.querySelectorAll("select, button, .ml-roll-controls")) control.remove();
  const status = document.createElement("p");
  status.className = "ml-roll-completed";
  status.setAttribute("role", "status");
  status.textContent = "Completed";
  row.append(status);
}
export async function completeChatRoll(message, entryKey, options = {}) {
  const card = message.getFlag(ID, "rollRequest");
  if (options?.reopen) {
    const patch = { completed: false };
    if (Object.hasOwn(options, "title")) patch.title = options.title;
    if (Object.hasOwn(options, "actionLabel")) patch.actionLabel = options.actionLabel;
    const next = patchRollEntry(card, entryKey, patch);
    await message.update({ content: renderRollRequest(next), [`flags.${ID}.rollRequest`]: next });
    ui.chat?.updateMessage?.(message);
    return;
  }
  if (card.entries) await message.update({ [`flags.${ID}.rollRequest.entries.${entryKey}.completed`]: true });
  else await message.setFlag(ID, "rollRequest", { ...card, completed: true });
}

function rollEntries(request) {
  return request.entries ? Object.entries(request.entries) : [["", request]];
}

/** One character: a single row, or every row for the same actor. Party rows keep their own names. */
function sharedCharacter(entries) {
  if (entries.length === 1) return entries[0][1];
  const actorUuid = entries[0][1]?.actorUuid;
  if (actorUuid && entries.every(([, entry]) => entry.actorUuid === actorUuid)) return entries[0][1];
  return null;
}

function characterName(entry) {
  if (!entry) return "";
  return entry.actorUuid ? actorIdentityName(entry) : "Game master";
}

function renderRollRequest(request) {
  const entries = rollEntries(request);
  const commonDC = entries.every(([, entry]) => entry.dc === entries[0][1].dc) ? entries[0][1].dc : null;
  const character = sharedCharacter(entries);
  const header = awardCardHeader({
    title: request.title ?? "",
    icon: "fa-solid fa-dice-d20",
    subtitle: commonDC == null ? "" : `DC ${commonDC}`,
    recipientName: character ? characterName(character) : ""
  });
  return `<section class="ml-chat-card ml-stack ml-core-roll-request">${header}${entries.map(([key, entry]) => {
    const choices = entry.choices.filter(option => option.id !== "decline");
    const identity = character ? "" : (entry.actorUuid ? actorIdentity(entry) : "<span>Game master</span>");
    return `<div class="ml-card ml-stack" data-ml-roll-entry="${escape(key)}">${identity}${entry.title !== request.title ? `<p>${escape(entry.title)}</p>` : ""}${entry.dc == null || commonDC != null ? "" : `<p>DC ${escape(entry.dc)}</p>`}${choices.length ? `<select data-ml-roll-choice aria-label="Roll choice">${choices.map(option => `<option value="${escape(option.id)}">${escape(option.label)}</option>`).join("")}</select>` : ""}${rollControls(mode => `data-ml-core-roll="${mode}"`, { modes: entry.modes, actionLabel: entry.actionLabel })}${entry.choices.some(option => option.id === "decline") ? '<button type="button" class="ml-button" data-ml-core-roll="normal" data-ml-roll-decline>Decline search</button>' : ""}</div>`;
  }).join("")}</section>`;
}

function patchRollEntry(card, entryKey, patch) {
  const apply = entry => {
    const next = { ...entry };
    for (const key of ENTRY_PATCH_KEYS) {
      if (!Object.hasOwn(patch, key)) continue;
      if (key === "data" && patch.data && typeof patch.data === "object" && !Array.isArray(patch.data)) {
        next.data = { ...(entry?.data && typeof entry.data === "object" && !Array.isArray(entry.data) ? entry.data : {}), ...patch.data };
      } else next[key] = patch[key];
    }
    return next;
  };
  if (card?.entries) {
    if (!Object.hasOwn(card.entries, entryKey)) throw new Error("That roll request entry does not exist.");
    return { ...card, entries: { ...card.entries, [entryKey]: apply(card.entries[entryKey]) } };
  }
  return apply(card);
}

function deepClone(value) {
  if (Array.isArray(value)) return value.map(deepClone);
  if (value && typeof value === "object") {
    const copy = {};
    for (const [key, item] of Object.entries(value)) copy[key] = deepClone(item);
    return copy;
  }
  return value;
}

function messageFlags(flags, card) {
  const merged = deepClone(flags ?? {});
  const moduleFlags = merged[ID] && typeof merged[ID] === "object" && !Array.isArray(merged[ID]) ? merged[ID] : {};
  moduleFlags.rollRequest = card;
  merged[ID] = moduleFlags;
  return merged;
}

/** Public request cards; domain handlers validate pending state and resolve on the GM. */
export class ChatRollRequests {
  handlers = new Map();
  preparers = new Map();
  preparing = new Set();
  creation = Promise.resolve();
  constructor(socket) {
    this.channel = socket.createChannel("morelord-core.roll-requests");
  }
  register(type, handler, { serialize = "morelord-core.roll-requests" } = {}) {
    const objectHandler = handler !== null && typeof handler === "object";
    const resolve = objectHandler ? handler.resolve : handler;
    const prepare = objectHandler ? handler.prepare ?? null : null;
    if (objectHandler && typeof resolve !== "function") throw new Error(`Roll request handler ${type} requires resolve.`);
    if (prepare != null && typeof prepare !== "function") throw new Error(`Roll request handler ${type} prepare must be a function.`);
    this.handlers.set(type, resolve);
    if (typeof prepare === "function") this.preparers.set(type, prepare);
    else this.preparers.delete(type);
    this.channel.on(type, async ({ messageId, entryKey, mode = "normal", choice, rollData }, execution) => {
      const message = game.messages.get(messageId), card = message?.getFlag(ID, "rollRequest");
      const request = card?.entries ? (Object.hasOwn(card.entries, entryKey) ? card.entries[entryKey] : null) : card;
      const actor = request?.actorUuid ? await fromUuid(request.actorUuid) : null;
      if (!message?.author?.isGM || card?.type !== type || !request || rollAuthority(message)?.id !== game.user.id
        || !canRollForActor(actor, game.users.get(execution.senderUserId))) return { accepted: false, reason: "This request is assigned to another user." };
      if (!["normal", "adv", "dis"].includes(mode) || (!request.modes && mode !== "normal")) return { accepted: false, reason: "Invalid roll mode." };
      if (request.completed) return { accepted: true, alreadyResolved: true };
      if (choice && !request.choices?.some(option => option.id === choice)) return { accepted: false, reason: "Invalid roll choice." };
      const context = { actor, mode, choice, senderUserId: execution.senderUserId, message };
      if (prepare) context.rollData = rollData;
      const result = await resolve(request.data, context);
      if (result?.accepted === false) return { accepted: false, reason: result.reason ?? "This request is no longer pending." };
      await completeChatRoll(message, entryKey);
      return { accepted: true }; // Never return totals or private outcome data to a player.
    }, { serialize });
  }
  create(options) {
    const operation = this.creation.then(() => this.createCard(options));
    this.creation = operation.catch(() => {});
    return operation;
  }
  async createCard({ type, key, groupKey = null, groupTitle = null, title, actorUuid = null, dc = null, modes = true, actionLabel = "Roll", choices = [], data = {}, speaker, whisper, flags }) {
    if (!game.user.isGM || isIgnored(game.user)) throw new Error("An eligible GM must create roll requests.");
    if (!this.handlers.has(type)) throw new Error(`Roll request handler ${type} is unavailable.`);
    const existing = game.messages.find(message => message.author?.isGM && message.getFlag(ID, "rollRequest")?.key === (groupKey ?? key) && message.getFlag(ID, "rollRequest")?.type === type);
    const request = { type, key, title, actorUuid, dc, modes, actionLabel, choices, data, completed: false };
    // Entry keys become document update paths, so keep caller identifiers out of them.
    const entryKey = groupKey ? Array.from(new TextEncoder().encode(key), byte => byte.toString(16).padStart(2, "0")).join("") : null;
    if (existing) {
      if (groupKey && !existing.getFlag(ID, "rollRequest").entries?.[entryKey]) {
        const card = existing.getFlag(ID, "rollRequest");
        await existing.update({ [`flags.${ID}.rollRequest.entries.${entryKey}`]: request,
          content: this.html({ ...card, entries: { ...card.entries, [entryKey]: request } }) });
      }
      ui.chat?.updateMessage(existing); return existing;
    }
    const card = groupKey ? { type, key: groupKey, title: groupTitle ?? title, entries: { [entryKey]: request } } : request;
    const messageData = { content: this.html(card), whisper: whisper ?? [], blind: false, flags: messageFlags(flags, card) };
    if (speaker != null) messageData.speaker = speaker;
    return ChatMessage.create(messageData, { messageMode: "public" });
  }
  async updateEntry(message, entryKey, patch = {}) {
    if (!game.user?.isGM || isIgnored(game.user)) throw new Error("An eligible GM must update roll requests.");
    const card = message?.getFlag?.(ID, "rollRequest");
    if (!card) throw new Error("This message has no roll request.");
    const next = patchRollEntry(card, entryKey, patch);
    await message.update({ content: renderRollRequest(next), [`flags.${ID}.rollRequest`]: next });
    ui.chat?.updateMessage?.(message);
    return next;
  }
  html(request) {
    return renderRollRequest(request);
  }
  start() {
    Hooks.on("renderChatMessageHTML", (message, html) => {
      const request = message.author?.isGM && message.getFlag(ID, "rollRequest");
      if (!request) return;
      for (const button of html.querySelectorAll("[data-ml-core-roll]")) {
        const row = button.closest("[data-ml-roll-entry]");
        const entryKey = row?.dataset.mlRollEntry;
        const entry = request.entries ? request.entries[entryKey] : request;
        if (entry?.completed || isRollSubmitted(message, entryKey)) { markRollCompleted(row ?? button.closest(".ml-card")); continue; }
        const actor = entry?.actorUuid ? fromUuidSync(entry.actorUuid) : null;
        button.disabled = !entry || entry.completed || !canRollForActor(actor);
        button.addEventListener("click", async () => {
          const choice = button.hasAttribute("data-ml-roll-decline") ? "decline" : (row ?? html).querySelector("[data-ml-roll-choice]")?.value;
          const mode = button.dataset.mlCoreRoll;
          const prepare = this.preparers.get(request.type);
          const payload = { messageId: message.id, entryKey, mode, choice };
          if (prepare) {
            const pendingKey = `${message.id}:${entryKey}`;
            if (this.preparing.has(pendingKey)) return;
            this.preparing.add(pendingKey);
            try {
              const rollData = await prepare(entry, choice, { mode, message });
              if (rollData == null) return;
              payload.rollData = rollData;
            } catch (error) {
              ui.notifications?.error?.(error?.message ?? String(error));
              return;
            } finally {
              this.preparing.delete(pendingKey);
            }
          }
          try {
            await submitChatRoll(message, entryKey, row, async () => {
              const result = await this.channel.executeAsUser(request.type, payload, rollAuthority(message)?.id);
              if (!result?.accepted) throw new Error(result?.reason ?? "No active GM can resolve this request.");
            });
          } catch (error) { ui.notifications.error(error.message); }
        });
      }
    });
    const refresh = () => { for (const message of game.messages) if (message.getFlag(ID, "rollRequest")) ui.chat?.updateMessage(message); };
    for (const hook of ["userConnected", "updateUser", "updateActor"]) Hooks.on(hook, refresh);
  }
}
