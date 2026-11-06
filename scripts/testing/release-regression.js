import { assert } from "./in-game.js";
import { completeChatRoll } from "../services/chat-roll-requests.js";

const TYPE = "morelord-core.regression";
const regression = { calls: 0, completeOn: 0, gate: null, settled: 0 };

function gmSkip() {
  return game.user?.isGM ? null : "GM creates the fixtures. Run this check as Chuck.";
}

function sameIds(message, expected) {
  const actual = [...(message?.whisper ?? [])].map(id => typeof id === "string" ? id : id?.id).sort();
  assert(actual.join() === [...expected].sort().join(), `Whisper was ${actual.join(",") || "(empty)"}.`);
}

function registerRegression(requests) {
  if (requests.handlers.has(TYPE)) return;
  requests.register(TYPE, async () => {
    regression.calls += 1;
    const gate = regression.gate;
    regression.gate = null;
    if (gate) await gate;
    regression.settled = regression.calls;
    return regression.completeOn > 0 && regression.calls >= regression.completeOn ? { complete: true } : {};
  }, { serialize: "morelord-core.regression" });
}

async function rendered(message) {
  try { ui.sidebar?.activateTab?.("chat"); } catch { /* The sidebar tab API varies by Foundry build. */ }
  const end = Date.now() + 5000;
  while (Date.now() < end && !document.querySelector(`[data-message-id="${message.id}"]`)) {
    ui.chat?.updateMessage?.(message);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  const row = document.querySelector(`[data-message-id="${message.id}"]`);
  assert(row, "Open the Chat tab so the request card can render.");
  return row;
}

function rollButton(message) {
  return document.querySelector(`[data-message-id="${message.id}"] [data-ml-core-roll="normal"]:not([data-ml-roll-decline])`);
}

function completedText(message) {
  return document.querySelector(`[data-message-id="${message.id}"] .ml-roll-completed`);
}

async function deleteMessages(messages) {
  const ids = messages.filter(message => message?.id).map(message => message.id);
  if (ids.length && typeof ChatMessage.deleteDocuments === "function") await ChatMessage.deleteDocuments(ids);
  else for (const message of messages) await message?.delete?.();
}

/** Stacks one loot pile, rejects a mixed invalid add without a partial grant, then grants the retry once. */
export const inventoryGrantCheck = {
  id: "core.inventory-add-items",
  get skip() { return gmSkip(); },
  async run() {
    assert(game.world?.id?.toLowerCase() === "dev1", "Dev1 is required.");
    const addItems = MorelordCore.inventory?.addItems;
    assert(typeof addItems === "function", "Reload the world so MorelordCore.inventory.addItems is loaded.");
    const actor = await Actor.create({ name: "Core inventory regression", type: "character", ownership: { default: 0 } });
    const rations = { name: "Core Regression Rations", type: "loot", system: { quantity: 2 } };
    try {
      const first = await addItems(actor, [rations, { name: "Core Regression Rations", type: "loot", system: { quantity: 1 } }]);
      const pile = actor.items.find(item => item.name === "Core Regression Rations");
      assert(pile?.system?.quantity === 3 && first.created.length === 1, "Two compatible loot grants become one pile of 3.");
      const again = await addItems(actor, [rations]);
      assert(actor.items.filter(item => item.name === "Core Regression Rations").length === 1, "Granting the same loot again does not create a second item.");
      assert(pile.system.quantity === 5 && again.created.length === 0 && again.updated.length === 1, "The second grant only raises the existing quantity.");
      const before = actor.items.map(item => [item.id, item.name, item.system?.quantity]);
      let rejected = false;
      try {
        await addItems(actor, [rations, { name: "Core Regression Bad", type: "loot", system: { quantity: 0 } }]);
      } catch (error) {
        rejected = /positive whole number/.test(error?.message ?? "");
      }
      assert(rejected, "One invalid quantity rejects the add.");
      const after = actor.items.map(item => [item.id, item.name, item.system?.quantity]);
      assert(JSON.stringify(before) === JSON.stringify(after), "The rejected add leaves the earlier grant unchanged.");
      await addItems(actor, [{ name: "Core Regression Backpack", type: "container", system: { quantity: 1 } }, { name: "Core Regression Backpack", type: "container", system: { quantity: 1 } }]);
      assert(actor.items.filter(item => item.name === "Core Regression Backpack").length === 2, "Containers stay separate.");
      await addItems(actor, [rations]);
      assert(pile.system.quantity === 7, "A valid retry after the rejection grants once.");
    } finally {
      await actor.delete();
    }
  }
};

/** Posts through ChatMessage.create and reads the saved whisper back. */
export const rollRequestVisibilityCheck = {
  id: "core.roll-request-visibility",
  get skip() { return gmSkip(); },
  async run() {
    assert(game.world?.id?.toLowerCase() === "dev1", "Dev1 is required.");
    const requests = MorelordCore.chatRequests;
    assert(typeof requests?.create === "function", "Reload the world so chat request create is loaded.");
    const player = game.users.find(user => user.active && !user.isGM);
    assert(player, "Log in the temporary player before this check.");
    registerRegression(requests);
    const whisper = [game.user.id, player.id];
    const messages = [];
    try {
      const kept = await requests.create({
        type: TYPE, key: foundry.utils.randomID(), title: "Core regression private",
        modes: false, preserveMessageMode: true, whisper, blind: false
      });
      messages.push(kept);
      sameIds(kept, whisper);
      assert(kept.blind === false, "The preserved card stays not blind.");
      const cleared = await requests.create({
        type: TYPE, key: foundry.utils.randomID(), title: "Core regression public",
        modes: false, whisper, blind: true, messageMode: "blind"
      });
      messages.push(cleared);
      sameIds(cleared, []);
      assert(cleared.blind === false, "Without the opt-in, the card is still posted public.");
    } finally {
      await deleteMessages(messages);
    }
  }
};

/** Held steps stay open, reopen restores the button, and the last step completes once. */
export const rollRequestStepsCheck = {
  id: "core.roll-request-steps",
  get skip() { return gmSkip(); },
  async run() {
    assert(game.world?.id?.toLowerCase() === "dev1", "Dev1 is required.");
    const requests = MorelordCore.chatRequests;
    assert(typeof requests?.create === "function", "Reload the world so chat request create is loaded.");
    registerRegression(requests);
    regression.calls = 0;
    regression.completeOn = 0;
    regression.gate = null;
    regression.settled = 0;
    const messages = [];
    try {
      const message = await requests.create({
        type: TYPE, key: foundry.utils.randomID(), title: "Core regression steps",
        modes: false, actionLabel: "Roll", holdCompletion: true
      });
      messages.push(message);
      await rendered(message);
      let release;
      regression.gate = new Promise(resolve => { release = resolve; });
      const first = rollButton(message);
      assert(first, "The first step renders a Roll button.");
      first.click();
      first.click();
      await new Promise(resolve => setTimeout(resolve, 0));
      assert(regression.calls === 1, "Two clicks while a step is open resolve once.");
      assert(!completedText(message), "A held step does not show Completed.");
      let hook;
      const refreshed = new Promise(resolve => {
        hook = doc => {
          if (doc?.id !== message.id) return;
          Hooks.off("renderChatMessageHTML", hook);
          resolve();
        };
        Hooks.on("renderChatMessageHTML", hook);
      });
      release();
      await Promise.race([refreshed, new Promise(resolve => setTimeout(resolve, 5000))]);
      Hooks.off("renderChatMessageHTML", hook);
      const entry = () => message.getFlag("morelord-core", "rollRequest");
      assert(regression.settled === 1 && entry().completed === false && regression.calls === 1, "The held step stays incomplete.");
      assert(!completedText(message) && rollButton(message), "The row still offers Roll after the held step.");

      regression.completeOn = 2;
      rollButton(message).click();
      const done = Date.now() + 5000;
      while (entry().completed !== true && Date.now() < done) await new Promise(resolve => setTimeout(resolve, 50));
      assert(entry().completed === true && regression.calls === 2, "The last step completes once.");
      await rendered(message);
      assert(completedText(message)?.textContent === "Completed" && !rollButton(message), "Completed replaces the button only after the last step.");

      await completeChatRoll(message, "", { reopen: true, title: "Again", actionLabel: "Roll" });
      const reopened = Date.now() + 5000;
      while (!rollButton(message) && Date.now() < reopened) await new Promise(resolve => setTimeout(resolve, 50));
      assert(entry().completed === false && !completedText(message) && rollButton(message), "Reopen restores the button without leaving Completed.");
      regression.completeOn = 3;
      const again = rollButton(message);
      again.click();
      again.click();
      const closed = Date.now() + 5000;
      while (entry().completed !== true && Date.now() < closed) await new Promise(resolve => setTimeout(resolve, 50));
      await new Promise(resolve => setTimeout(resolve, 100));
      assert(regression.calls === 3 && entry().completed === true, "The reopened step completes once.");
      assert(completedText(message)?.textContent === "Completed" && !rollButton(message), "The finished row stays completed.");
    } finally {
      regression.gate = null;
      regression.completeOn = 0;
      await deleteMessages(messages);
    }
  }
};

export const releaseRegressionChecks = [inventoryGrantCheck, rollRequestVisibilityCheck, rollRequestStepsCheck];
