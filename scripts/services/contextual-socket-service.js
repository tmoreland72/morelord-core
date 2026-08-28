class SerialExecutor {
  #tails = new Map();

  run(key, callback) {
    if (!key) return callback();
    const prior = this.#tails.get(key) ?? Promise.resolve();
    const operation = prior.then(callback, callback);
    const tail = operation.catch(() => undefined);
    this.#tails.set(key, tail);
    void tail.finally(() => { if (this.#tails.get(key) === tail) this.#tails.delete(key); });
    return operation;
  }
}

export function createSocketMessageId(utils = globalThis.foundry?.utils) {
  if (typeof utils?.randomID === "function") return utils.randomID(24);
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  throw new Error("Morelord Core could not generate a socket message ID.");
}

export class ContextualSocketService {
  #socket = null;
  #started = false;
  #ready = false;
  #handlers = new Map();
  #pending = new Map();
  #serial = new SerialExecutor();

  start() {
    if (this.#started) return;
    this.#started = true;
    const initialize = () => {
      if (this.#ready) return;
      this.#socket = globalThis.socketlib?.registerModule("morelord-core") ?? null;
      if (!this.#socket) throw new Error("Morelord Core could not initialize Socketlib.");
      this.#socket.register("dispatch", payload => this.#receive(payload));
      this.#ready = true;
    };
    if (globalThis.socketlib) initialize();
    else Hooks.once("socketlib.ready", initialize);
  }

  createChannel(namespace) {
    if (!namespace?.trim()) throw new Error("A contextual socket namespace is required.");
    return Object.freeze({
      namespace,
      on: (type, handler, options = {}) => this.#on(namespace, type, handler, options),
      emit: (type, data = {}, options = {}) => this.#emit(namespace, type, data, options),
      executeAsUser: (type, data, userId, options = {}) => this.#emit(namespace, type, data, { ...options, targetUserId: userId }),
      executeAsGM: (type, data, options = {}) => this.#emit(namespace, type, data, { ...options, target: "gm" })
    });
  }

  get ready() { return this.#ready; }

  #on(namespace, type, handler, { serialize = null } = {}) {
    const key = `${namespace}:${type}`;
    this.#handlers.set(key, { handler, serialize });
    const queued = this.#pending.get(key) ?? [];
    this.#pending.delete(key);
    for (const payload of queued) queueMicrotask(() => void this.#invoke(payload));
    return () => this.#handlers.delete(key);
  }

  async #emit(namespace, type, data, { targetUserId = null, target = "others", context = {} } = {}) {
    if (!this.#ready || !this.#socket) throw new Error("Morelord Core socket transport is not ready.");
    const payload = { namespace, type, data: foundry.utils.deepClone(data ?? {}), context: foundry.utils.deepClone(context ?? {}), senderUserId: game.user.id, targetUserId, target, sentAt: Date.now(), messageId: createSocketMessageId() };
    if (targetUserId) return this.#socket.executeAsUser("dispatch", targetUserId, payload);
    if (target === "gm") return this.#socket.executeAsGM("dispatch", payload);
    if (target === "everyone") return this.#socket.executeForEveryone("dispatch", payload);
    return this.#socket.executeForOthers("dispatch", payload);
  }

  async #receive(payload) {
    if (!payload?.namespace || !payload?.type) return undefined;
    if (payload.targetUserId && payload.targetUserId !== game.user.id) return undefined;
    const key = `${payload.namespace}:${payload.type}`;
    if (!this.#handlers.has(key)) {
      const queued = this.#pending.get(key) ?? [];
      queued.push(foundry.utils.deepClone(payload));
      this.#pending.set(key, queued);
      return { queued: true, messageId: payload.messageId };
    }
    return this.#invoke(payload);
  }

  async #invoke(payload) {
    const registration = this.#handlers.get(`${payload.namespace}:${payload.type}`);
    if (!registration) return undefined;
    const execution = Object.freeze({ ...payload.context, namespace: payload.namespace, type: payload.type, messageId: payload.messageId, senderUserId: payload.senderUserId, targetUserId: payload.targetUserId, localUserId: game.user.id, localUserIsGM: game.user.isGM, sentAt: payload.sentAt, receivedAt: Date.now() });
    const serialKey = typeof registration.serialize === "function" ? registration.serialize(payload.data, execution) : registration.serialize;
    return this.#serial.run(serialKey, () => registration.handler(payload.data ?? {}, execution));
  }
}
