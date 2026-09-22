import { actorIdentity } from "../ui/actor-identity.js";
import { activePlayerForActor, isIgnored, listUsers } from "./user-service.js";

const ID = "morelord-core";
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
export function rollControls(attributes, { modes = true } = {}) {
  return `<div class="ml-roll-controls">${(modes ? [["dis", "DIS"], ["normal", "Roll"], ["adv", "ADV"]] : [["normal", "Roll"]]).map(([mode, label]) =>
    `<button type="button" ${attributes(mode)} aria-label="${mode === "dis" ? "Roll with disadvantage" : mode === "adv" ? "Roll with advantage" : "Roll"}">${label}</button>`).join("")}</div>`;
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
export async function completeChatRoll(message, entryKey) {
  const card = message.getFlag(ID, "rollRequest");
  if (card.entries) await message.update({ [`flags.${ID}.rollRequest.entries.${entryKey}.completed`]: true });
  else await message.setFlag(ID, "rollRequest", { ...card, completed: true });
}

/** Public request cards; domain handlers validate pending state and resolve on the GM. */
export class ChatRollRequests {
  handlers = new Map();
  creation = Promise.resolve();
  constructor(socket) {
    this.channel = socket.createChannel("morelord-core.roll-requests");
  }
  register(type, resolve, { serialize = "morelord-core.roll-requests" } = {}) {
    this.handlers.set(type, resolve);
    this.channel.on(type, async ({ messageId, entryKey, mode = "normal", choice }, execution) => {
      const message = game.messages.get(messageId), card = message?.getFlag(ID, "rollRequest");
      const request = card?.entries ? (Object.hasOwn(card.entries, entryKey) ? card.entries[entryKey] : null) : card;
      const actor = request?.actorUuid ? await fromUuid(request.actorUuid) : null;
      if (!message?.author?.isGM || card?.type !== type || !request || rollAuthority(message)?.id !== game.user.id
        || !canRollForActor(actor, game.users.get(execution.senderUserId))) return { accepted: false, reason: "This request is assigned to another user." };
      if (!["normal", "adv", "dis"].includes(mode) || (!request.modes && mode !== "normal")) return { accepted: false, reason: "Invalid roll mode." };
      if (request.completed) return { accepted: true, alreadyResolved: true };
      if (choice && !request.choices?.some(option => option.id === choice)) return { accepted: false, reason: "Invalid roll choice." };
      const result = await resolve(request.data, { actor, mode, choice, senderUserId: execution.senderUserId, message });
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
  async createCard({ type, key, groupKey = null, groupTitle = null, title, actorUuid = null, dc = null, modes = true, choices = [], data = {} }) {
    if (!game.user.isGM || isIgnored(game.user)) throw new Error("An eligible GM must create roll requests.");
    if (!this.handlers.has(type)) throw new Error(`Roll request handler ${type} is unavailable.`);
    const existing = game.messages.find(message => message.author?.isGM && message.getFlag(ID, "rollRequest")?.key === (groupKey ?? key) && message.getFlag(ID, "rollRequest")?.type === type);
    const request = { type, key, title, actorUuid, dc, modes, choices, data, completed: false };
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
    return ChatMessage.create({ content: this.html(card), whisper: [], blind: false, flags: { [ID]: { rollRequest: card } } }, { messageMode: "public" });
  }
  html(request) {
    const entries = request.entries ? Object.entries(request.entries) : [["", request]];
    const commonDC = entries.every(([, entry]) => entry.dc === entries[0][1].dc) ? entries[0][1].dc : null;
    return `<section class="ml-chat-card ml-stack ml-core-roll-request"><h3>${escape(request.title)}</h3>${commonDC == null ? "" : `<p>DC ${escape(commonDC)}</p>`}${entries.map(([key, entry]) => {
      const choices = entry.choices.filter(option => option.id !== "decline");
      return `<div class="ml-card ml-stack" data-ml-roll-entry="${escape(key)}">${entry.actorUuid ? actorIdentity(entry) : "<span>Game master</span>"}${entry.title !== request.title ? `<p>${escape(entry.title)}</p>` : ""}${entry.dc == null || commonDC != null ? "" : `<p>DC ${escape(entry.dc)}</p>`}${choices.length ? `<select data-ml-roll-choice aria-label="Roll choice">${choices.map(option => `<option value="${escape(option.id)}">${escape(option.label)}</option>`).join("")}</select>` : ""}${rollControls(mode => `data-ml-core-roll="${mode}"`, { modes: entry.modes })}${entry.choices.some(option => option.id === "decline") ? '<button type="button" data-ml-core-roll="normal" data-ml-roll-decline>Decline search</button>' : ""}</div>`;
    }).join("")}</section>`;
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
          try {
            await submitChatRoll(message, entryKey, row, async () => {
              const result = await this.channel.executeAsUser(request.type, { messageId: message.id, entryKey, mode: button.dataset.mlCoreRoll, choice }, rollAuthority(message)?.id);
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
