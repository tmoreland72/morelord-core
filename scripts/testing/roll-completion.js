import { assert } from "./in-game.js";

export async function untilRollCheck(test, description, timeout = 60000) {
  const end = Date.now() + timeout;
  while (!test() && Date.now() < end) await new Promise(resolve => setTimeout(resolve, 50));
  assert(test(), description);
}

/** Hold only disposable test messages at the optional-animation boundary, on this client. */
export function holdTestRollAnimations(matches) {
  assert(game.world?.id === "dev1", "Dev1 is required.");
  const held = new Map();
  const original = Hooks.callAll;
  const created = Hooks.on("createChatMessage", message => {
    if (!message.rolls?.length || !matches(message)) return;
    held.set(message.id, message);
    message._dice3danimating = true;
  });
  const intercept = function(name, ...args) {
    if (name === "diceSoNiceRollComplete" && held.has(args[0])) {
      held.get(args[0])._dice3danimating = true;
      return;
    }
    return original.call(this, name, ...args);
  };
  Hooks.callAll = intercept;
  const release = id => {
    const message = held.get(id);
    if (!message) return;
    held.delete(id);
    delete message._dice3danimating;
    original.call(Hooks, "diceSoNiceRollComplete", id, []);
  };
  return {
    held,
    release,
    stop() {
      for (const id of [...held.keys()]) release(id);
      Hooks.off("createChatMessage", created);
      if (Hooks.callAll === intercept) Hooks.callAll = original;
    }
  };
}
