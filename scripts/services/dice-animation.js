/** Wait for this client's optional Dice So Nice animation before revealing outcomes. */
export async function waitForDiceAnimation(message) {
  if (!message?._dice3danimating) return;
  await new Promise(resolve => {
    const finish = id => {
      if (id !== message.id) return;
      Hooks.off("diceSoNiceRollComplete", completed);
      Hooks.off("deleteChatMessage", deleted);
      resolve();
    };
    const completed = Hooks.on("diceSoNiceRollComplete", finish);
    const deleted = Hooks.on("deleteChatMessage", document => finish(document.id));
    if (!message._dice3danimating) finish(message.id);
  });
}

/** Call without awaiting inside a socket handler; only the final commit joins its queue. */
export async function afterDiceAnimation(messages, callback, serialize) {
  await Promise.all((Array.isArray(messages) ? messages : [messages]).map(waitForDiceAnimation));
  return globalThis.MorelordCore.socket.runSerialized(serialize, callback);
}
