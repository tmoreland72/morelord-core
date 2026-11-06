import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ChatRollRequests, canRollForActor, completeChatRoll, rollAuthority, rollControls } from "../scripts/services/chat-roll-requests.js";
import { ContextualSocketService } from "../scripts/services/contextual-socket-service.js";

test("chat requests authorize owners and fallback GMs, serialize resolution, and keep private outcomes out of acknowledgments", async t => {
  const keys = ["game", "foundry", "socketlib", "fromUuid"];
  const saved = keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  t.after(() => { for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; });
  const gm = { id: "gm", active: true, isGM: true }, fallback = { id: "fallback", active: true, isGM: true };
  const player = { id: "player", active: true }, stranger = { id: "stranger", active: true };
  const actor = { uuid: "Actor.hero", testUserPermission: user => user === player };
  const users = [gm, fallback, player, stranger];
  users.get = id => users.find(user => user.id === id);
  let ignored = [], request = { type: "test", actorUuid: actor.uuid, modes: true, choices: [], data: {} }, resolutions = 0;
  const message = { author: gm, getFlag: () => request, async setFlag(_id, _key, value) { request = value; } };
  globalThis.game = { user: gm, users, messages: new Map([["request", message]]), settings: { settings: new Map([["morelord-core.ignoredUserIds", {}]]), get: () => ignored } };
  globalThis.foundry = { utils: { deepClone: structuredClone, randomID: () => crypto.randomUUID() } };
  globalThis.fromUuid = async () => actor;
  let dispatch;
  globalThis.socketlib = { registerModule: () => ({ register: (_name, handler) => { dispatch = handler; } }) };
  const socket = new ContextualSocketService();
  socket.start();
  const service = new ChatRollRequests(socket);
  service.register("test", async () => { resolutions++; await new Promise(resolve => setTimeout(resolve, 5)); return { secretTotal: 19 }; });
  const send = (user, data = {}) => dispatch({ namespace: "morelord-core.roll-requests", type: "test", senderUserId: user.id, targetUserId: game.user.id, data: { messageId: "request", ...data } });
  assert.equal((await send(stranger)).accepted, false);
  assert.equal((await send(player, { mode: "forged" })).accepted, false);
  assert.equal((await send(player, { choice: "forged" })).accepted, false);
  const results = await Promise.all([send(player), send(gm)]);
  assert.equal(resolutions, 1);
  assert.deepEqual(results, [{ accepted: true }, { accepted: true, alreadyResolved: true }]);
  request = { ...request, completed: false };
  player.active = false;
  assert.equal(canRollForActor(actor, player), false);
  assert.equal(canRollForActor(actor, gm), true);
  assert.equal((await send(player)).accepted, false);
  gm.active = false;
  game.user = fallback;
  assert.equal(rollAuthority(message), fallback);
  assert.equal((await send(fallback)).accepted, true);
  assert.equal(resolutions, 2);
  ignored = [fallback.id];
  assert.equal(canRollForActor(actor, fallback), false);
  assert.equal(rollAuthority(message), undefined);
});

test("group creation keeps one message, independent rows, resend completion, and separate batches", async t => {
  const keys = ["game", "foundry", "ChatMessage", "ui", "fromUuid"];
  const saved = keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  t.after(() => { for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; });
  const gm={id:"gm",isGM:true,active:true}, player={id:"player",active:true};
  const users=[gm,player];users.get=id=>users.find(user=>user.id===id);
  const actors=[{uuid:"Actor.a",testUserPermission:user=>user===player},{uuid:"Actor.b",testUserPermission:()=>false}];
  const messages=[];messages.get=id=>messages.find(message=>message.id===id);
  globalThis.game={user:gm,users,messages,settings:{settings:new Map()}};
  globalThis.foundry={utils:{escapeHTML:String}};
  globalThis.ui={chat:{updateMessage(){}}};
  globalThis.fromUuid=async uuid=>actors.find(actor=>actor.uuid===uuid);
  globalThis.ChatMessage={async create(data){
    const message={...data,id:String(messages.length),author:gm,getFlag:(id,key)=>message.flags[id][key],async update(changes){
      for(const [path,value] of Object.entries(changes)){const parts=path.split('.');let target=message;for(const part of parts.slice(0,-1))target=target[part]??={};target[parts.at(-1)]=value;}
    }};messages.push(message);return message;
  }};
  let resolve;const calls=[];
  const service=new ChatRollRequests({createChannel:()=>({on:(_type,handler)=>{resolve=handler;}})});
  service.register("group",async(data,context)=>{calls.push(context.actor.uuid);return {privateTotal:20};});
  const options={type:"group",title:"Party Check",groupKey:"batch",choices:[{id:"sur",label:"Survival"},{id:"decline",label:"Decline search"}]};
  const [first,second]=await Promise.all(actors.map((actor,index)=>service.create({...options,key:`request.${index}`,actorUuid:actor.uuid})));
  assert.equal(first,second);assert.equal(messages.length,1);
  const entries=first.getFlag("morelord-core","rollRequest").entries, [a,b]=Object.keys(entries);
  assert.equal(Object.keys(entries).length,2);
  assert.equal((first.content.match(/data-ml-roll-entry=/g)??[]).length,2);
  assert.equal((first.content.match(/data-ml-roll-decline/g)??[]).length,2);
  assert.match(first.content, /<section class="ml-chat-card ml-stack ml-core-roll-request">/);
  assert.match(first.content, /ml-award-card__header/);
  assert.match(first.content, /ml-award-card__icon"><i class="fa-solid fa-dice-d20">/);
  assert.match(first.content, /ml-award-card__title">Party Check</);
  assert.doesNotMatch(first.content, /ml-award-card__recipient/);
  assert.match(first.content, /<button type="button" class="ml-button" data-ml-core-roll="dis"/);
  assert.match(first.content, /<button type="button" class="ml-button" data-ml-core-roll="normal" data-ml-roll-decline>Decline search<\/button>/);
  assert.match(first.content, />Roll<\/button>/);
  assert.equal((await resolve({messageId:first.id,entryKey:b},{senderUserId:player.id})).accepted,false);
  assert.equal((await resolve({messageId:first.id,entryKey:"__proto__"},{senderUserId:gm.id})).accepted,false);
  assert.deepEqual(await resolve({messageId:first.id,entryKey:a,choice:"sur"},{senderUserId:player.id}),{accepted:true});
  assert.equal(entries[a].completed,true);assert.equal(entries[b].completed,false);
  await service.create({...options,key:"request.0",actorUuid:actors[0].uuid});
  assert.equal(entries[a].completed,true);assert.equal(messages.length,1);
  assert.equal((await resolve({messageId:first.id,entryKey:a},{senderUserId:gm.id})).alreadyResolved,true);
  await resolve({messageId:first.id,entryKey:b,choice:"decline"},{senderUserId:gm.id});
  assert.deepEqual(calls,["Actor.a","Actor.b"]);
  await service.create({...options,groupKey:"next-batch",key:"new",actorUuid:actors[0].uuid});
  assert.equal(messages.length,2);
  const rest = await service.create({ type: "group", key: "rest", title: "Long Rest", modes: false, actionLabel: "Long Rest" });
  assert.ok(rest.content.includes('class="ml-button" data-ml-core-roll="normal" aria-label="Long Rest">Long Rest</button>'));
  assert.match(rest.content, /ml-award-card__recipient"><i class="fa-solid fa-user"><\/i>Game master/);
  assert.equal((rest.content.match(/Game master/g) ?? []).length, 1);
  assert.doesNotMatch(rest.content, /<span>Game master<\/span>/);
  assert.ok(!rest.content.includes('data-ml-core-roll="adv"'));
  assert.ok(!rest.content.includes(">DIS<") && !rest.content.includes(">ADV<"));
});

test("a single character card puts the shared DC in the award header and keeps roll attributes", t => {
  const previous = {
    foundry: Object.getOwnPropertyDescriptor(globalThis, "foundry"),
    fromUuidSync: Object.getOwnPropertyDescriptor(globalThis, "fromUuidSync")
  };
  t.after(() => {
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const service = new ChatRollRequests({ createChannel: () => ({ on() {} }) });
  globalThis.foundry = { utils: { escapeHTML: value => String(value ?? "").replaceAll("<", "&lt;") } };
  globalThis.fromUuidSync = () => ({ name: "Ada <Bee>" });
  const html = service.html({
    title: "Watch <Checks>",
    dc: 14,
    actorUuid: "Actor.ada",
    modes: false,
    actionLabel: "Roll",
    choices: [{ id: "sur", label: "Survival" }, { id: "decline", label: "Decline search" }]
  });
  assert.match(html, /ml-award-card__title">Watch &lt;Checks&gt;/);
  assert.match(html, /ml-award-card__subtitle">DC 14/);
  assert.match(html, /ml-award-card__recipient"><i class="fa-solid fa-user"><\/i>Ada &lt;Bee&gt;/);
  assert.doesNotMatch(html, /ml-actor-identity/);
  assert.equal((html.match(/Ada &lt;Bee&gt;/g) ?? []).length, 1);
  assert.match(html, /data-ml-roll-entry=""/);
  assert.match(html, /data-ml-roll-choice/);
  assert.match(html, /<option value="sur">Survival<\/option>/);
  assert.match(html, /class="ml-button" data-ml-core-roll="normal" aria-label="Roll">Roll<\/button>/);
  assert.match(html, /class="ml-button" data-ml-core-roll="normal" data-ml-roll-decline>Decline search<\/button>/);
  assert.equal((html.match(/data-ml-core-roll="adv"/g) ?? []).length, 0);
  const controls = rollControls(mode => `data-ml-core-roll="${mode}"`, { modes: true });
  assert.match(controls, /class="ml-button" data-ml-core-roll="dis" aria-label="Roll with disadvantage">DIS<\/button>/);
  assert.match(controls, /class="ml-button" data-ml-core-roll="normal" aria-label="Roll">Roll<\/button>/);
  assert.match(controls, /class="ml-button" data-ml-core-roll="adv" aria-label="Roll with advantage">ADV<\/button>/);
});

test("roll request styles share the award frame and give every button the same height", async () => {
  const css = await readFile(new URL("../styles/morelord-components.css", import.meta.url), "utf8");
  assert.match(css, /\.chat-message :is\(\.ml-award-card, \.ml-core-roll-request\)/);
  assert.match(css, /\.ml-core-roll-request > \[data-ml-roll-entry\]/);
  assert.match(css, /\.ml-core-roll-request \.ml-roll-controls \{ align-items: stretch; \}/);
  assert.match(css, /\.ml-core-roll-request \.ml-roll-completed \{[^}]*text-align: center;/s);
  const buttons = css.match(/\.ml-core-roll-request \.ml-button \{[^}]+\}/);
  const chatButtons = css.match(/\.chat-message \.ml-core-roll-request button\.ml-button \{[^}]+\}/);
  assert.ok(buttons);
  assert.ok(chatButtons);
  for (const block of [buttons[0], chatButtons[0]]) {
    assert.match(block, /height:\s*var\(--ml-control-height\)/);
    assert.match(block, /min-height:\s*var\(--ml-control-height\)/);
    assert.match(block, /max-height:\s*var\(--ml-control-height\)/);
  }
  assert.match(css, /\.ml-core-roll-request \.ml-button\[data-ml-core-roll="normal"\]:not\(\[data-ml-roll-decline\]\)/);
});

test("one character is named in the header only, and a party keeps a name on each row", t => {
  const previous = {
    foundry: Object.getOwnPropertyDescriptor(globalThis, "foundry"),
    fromUuidSync: Object.getOwnPropertyDescriptor(globalThis, "fromUuidSync")
  };
  t.after(() => {
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  globalThis.foundry = { utils: { escapeHTML: String } };
  globalThis.fromUuidSync = uuid => ({ name: uuid === "Actor.ada" ? "Ada" : "Bea" });
  const service = new ChatRollRequests({ createChannel: () => ({ on() {} }) });
  const single = service.html({ title: "Long Rest", actorUuid: "Actor.ada", modes: false, actionLabel: "Long Rest", choices: [] });
  assert.match(single, /ml-award-card__recipient"><i class="fa-solid fa-user"><\/i>Ada/);
  assert.equal((single.match(/Ada/g) ?? []).length, 1);
  assert.doesNotMatch(single, /ml-actor-identity/);
  const steps = service.html({
    title: "Treasure",
    entries: {
      coins: { title: "Coins", actorUuid: "Actor.ada", modes: false, actionLabel: "Roll", choices: [], dc: null },
      gems: { title: "Gems", actorUuid: "Actor.ada", modes: false, actionLabel: "Roll", choices: [], dc: null }
    }
  });
  assert.match(steps, /ml-award-card__recipient"><i class="fa-solid fa-user"><\/i>Ada/);
  assert.equal((steps.match(/Ada/g) ?? []).length, 1);
  assert.doesNotMatch(steps, /ml-actor-identity/);
  assert.match(steps, />Coins</);
  assert.match(steps, />Gems</);
  const party = service.html({
    title: "Party Check",
    dc: 12,
    entries: {
      ada: { title: "Party Check", actorUuid: "Actor.ada", modes: true, choices: [], dc: 12 },
      bea: { title: "Party Check", actorUuid: "Actor.bea", modes: true, choices: [], dc: 12 }
    }
  });
  assert.doesNotMatch(party, /ml-award-card__recipient/);
  assert.equal((party.match(/class="ml-actor-identity"/g) ?? []).length, 2);
  assert.match(party, />Ada</);
  assert.match(party, />Bea</);
});

test("a bare function register path ignores rollData and sends the original click payload", async t => {
  const keys = ["game", "foundry", "ui", "Hooks", "fromUuid", "fromUuidSync", "document"];
  const saved = keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  t.after(() => { for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; });
  globalThis.document = { createElement: () => ({ className: "", setAttribute() {}, textContent: "" }) };
  const gm = { id: "gm", active: true, isGM: true }, player = { id: "player", active: true, isGM: false };
  const actor = { uuid: "Actor.hero", testUserPermission: user => user === player };
  const users = [gm, player];
  users.get = id => users.find(user => user.id === id);
  const request = { type: "plain", actorUuid: actor.uuid, modes: true, choices: [], data: { requestId: "keep" }, completed: false };
  const message = { id: "request", author: gm, getFlag: () => request, async setFlag(_id, _key, value) { Object.assign(request, value); } };
  const messages = [message];
  messages.get = id => messages.find(item => item.id === id);
  globalThis.game = { user: gm, users, messages, settings: { settings: new Map() } };
  globalThis.foundry = { utils: { escapeHTML: String } };
  globalThis.fromUuid = async () => actor;
  globalThis.fromUuidSync = () => actor;
  const sent = [];
  let handler;
  const service = new ChatRollRequests({ createChannel: () => ({
    on(_type, fn) { handler = fn; },
    executeAsUser: async (type, data, userId) => {
      sent.push({ type, data, userId });
      const previous = game.user;
      game.user = users.get(userId);
      try { return await handler(data, { senderUserId: previous.id }); }
      finally { game.user = previous; }
    }
  }) });
  const contexts = [];
  service.register("plain", (data, context) => {
    contexts.push({ data, keys: Object.keys(context), hasRollData: Object.hasOwn(context, "rollData") });
    return { accepted: true };
  });
  assert.deepEqual(await handler({ messageId: "request", mode: "normal", rollData: { injected: true } }, { senderUserId: player.id }), { accepted: true });
  assert.deepEqual(contexts[0].data, { requestId: "keep" });
  assert.deepEqual(contexts[0].keys.sort(), ["actor", "choice", "message", "mode", "senderUserId"]);
  assert.equal(contexts[0].hasRollData, false);
  request.completed = false;
  const hooks = [];
  globalThis.ui = { notifications: { error() {} }, chat: { updateMessage() {} } };
  globalThis.Hooks = { on(_name, fn) { hooks.push(fn); } };
  service.start();
  const harness = rollButton();
  game.user = player;
  hooks[0](message, harness.html);
  await harness.click();
  assert.deepEqual(Object.keys(sent[0].data).sort(), ["choice", "entryKey", "messageId", "mode"]);
  assert.equal(sent[0].userId, gm.id);
  assert.equal(sent[0].data.mode, "normal");
});

test("prepare runs on the clicking client, and cancel or throw leaves the row open", async t => {
  const keys = ["game", "foundry", "ui", "Hooks", "fromUuid", "fromUuidSync", "document"];
  const saved = keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  t.after(() => { for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; });
  globalThis.document = { createElement: () => ({ className: "", setAttribute() {}, textContent: "" }) };
  const gm = { id: "gm", active: true, isGM: true }, player = { id: "player", active: true, isGM: false }, stranger = { id: "stranger", active: true, isGM: false };
  const actor = { uuid: "Actor.hero", testUserPermission: user => user === player };
  const users = [gm, player, stranger];
  users.get = id => users.find(user => user.id === id);
  let request = { type: "prepared", actorUuid: actor.uuid, modes: true, choices: [], data: { requestId: "roll" }, completed: false };
  const message = { id: "m1", author: gm, getFlag: () => request, async setFlag(_id, _key, value) { request = value; } };
  const messages = [message];
  messages.get = id => messages.find(item => item.id === id);
  globalThis.game = { user: player, users, messages, settings: { settings: new Map() } };
  globalThis.foundry = { utils: { escapeHTML: String } };
  globalThis.fromUuid = async () => actor;
  globalThis.fromUuidSync = () => actor;
  const notices = [];
  globalThis.ui = { notifications: { error(messageText) { notices.push(messageText); } }, chat: { updateMessage() {} } };
  const sent = [];
  const resolved = [];
  let handler, handlerOptions, outcome = { total: 18 };
  const service = new ChatRollRequests({ createChannel: () => ({
    on(_type, fn, options) { handler = fn; handlerOptions = options; },
    executeAsUser: async (type, data, userId) => {
      sent.push({ type, data, userId });
      const previous = game.user;
      game.user = users.get(userId);
      try { return await handler(data, { senderUserId: previous.id }); }
      finally { game.user = previous; }
    }
  }) });
  const prepares = [];
  service.register("prepared", {
    prepare: async (entry, choice, info) => {
      prepares.push({ userId: game.user.id, entry, choice, mode: info.mode, message: info.message });
      if (outcome instanceof Error) throw outcome;
      return outcome;
    },
    resolve: (data, context) => {
      resolved.push({ data, rollData: context.rollData, senderUserId: context.senderUserId });
      return { accepted: true, secret: context.rollData.total };
    }
  }, { serialize: "table.queue" });
  assert.equal(handlerOptions.serialize, "table.queue");
  game.user = gm;
  assert.equal((await handler({ messageId: "m1", mode: "normal", rollData: { total: 4 } }, { senderUserId: stranger.id })).accepted, false);
  game.user = player;
  assert.equal(resolved.length, 0);
  const hooks = [];
  globalThis.Hooks = { on(_name, fn) { hooks.push(fn); } };
  service.start();
  const harness = rollButton();
  hooks[0](message, harness.html);
  const open = request;
  await harness.click();
  assert.equal(prepares[0].userId, player.id);
  assert.equal(prepares[0].message, message);
  assert.equal(prepares[0].mode, "normal");
  assert.equal(prepares[0].entry, open);
  assert.deepEqual(sent[0].data.rollData, { total: 18 });
  assert.deepEqual(sent[0].data.messageId, "m1");
  assert.equal(sent[0].userId, gm.id);
  assert.deepEqual(resolved[0].rollData, { total: 18 });
  assert.equal(resolved[0].senderUserId, player.id);
  assert.equal(resolved[0].data.requestId, "roll");
  assert.equal(Object.hasOwn(resolved[0], "secret"), false);
  request = { ...request, completed: false };
  outcome = null;
  const cancelled = rollButton();
  hooks[0](message, cancelled.html);
  await cancelled.click();
  assert.equal(sent.length, 1);
  assert.equal(cancelled.completed(), false);
  outcome = new Error("The roll dialog closed.");
  const failed = rollButton();
  hooks[0](message, failed.html);
  await failed.click();
  assert.equal(sent.length, 1);
  assert.equal(failed.completed(), false);
  assert.deepEqual(notices, ["The roll dialog closed."]);
});

test("create passes speaker, whisper, and flags without replacing the roll request", async t => {
  const keys = ["game", "foundry", "ChatMessage", "ui"];
  const saved = keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  t.after(() => { for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; });
  const gm = { id: "gm", isGM: true, active: true };
  const messages = [];
  messages.get = id => messages.find(message => message.id === id);
  globalThis.game = { user: gm, users: [gm], messages, settings: { settings: new Map() } };
  globalThis.foundry = { utils: { escapeHTML: String } };
  globalThis.ui = { chat: { updateMessage() {} } };
  globalThis.ChatMessage = { async create(data) {
    const message = { ...data, id: "card", author: gm, getFlag: (id, key) => message.flags[id][key] };
    messages.push(message);
    return message;
  } };
  const service = new ChatRollRequests({ createChannel: () => ({ on() {} }) });
  service.register("posted", () => ({ accepted: true }));
  const plain = await service.create({ type: "posted", key: "plain", title: "Check" });
  assert.equal(Object.hasOwn(plain, "speaker"), false);
  assert.deepEqual(plain.whisper, []);
  assert.deepEqual(Object.keys(plain.flags), ["morelord-core"]);
  assert.deepEqual(Object.keys(plain.flags["morelord-core"]), ["rollRequest"]);
  const callerFlags = { "morelord-gm": { nested: { step: 1 } }, "morelord-core": { note: "keep", rollRequest: { hacked: true } } };
  const posted = await service.create({
    type: "posted", key: "private", title: "Private Check",
    speaker: { alias: "GM" }, whisper: [gm.id], flags: callerFlags
  });
  assert.deepEqual(posted.speaker, { alias: "GM" });
  assert.deepEqual(posted.whisper, [gm.id]);
  assert.equal(posted.flags["morelord-core"].note, "keep");
  assert.equal(posted.flags["morelord-core"].rollRequest.hacked, undefined);
  assert.equal(posted.flags["morelord-core"].rollRequest.key, "private");
  callerFlags["morelord-gm"].nested.step = 9;
  assert.equal(posted.flags["morelord-gm"].nested.step, 1);
});

test("updateEntry re-renders a GM patch, and completeChatRoll can reopen without changing a normal close", async t => {
  const keys = ["game", "foundry", "ui", "fromUuidSync"];
  const saved = keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  t.after(() => { for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; });
  const gm = { id: "gm", isGM: true, active: true }, player = { id: "player", active: true, isGM: false };
  globalThis.game = { user: player, users: [gm, player], messages: [], settings: { settings: new Map() } };
  globalThis.foundry = { utils: { escapeHTML: String } };
  globalThis.fromUuidSync = () => ({ name: "Ada" });
  const updates = [];
  globalThis.ui = { chat: { updateMessage(message) { updates.push(["refresh", message.id]); } } };
  const entryKey = "aa";
  let card = { type: "steps", key: "batch", title: "Treasure", entries: { [entryKey]: { type: "steps", key: "one", title: "Coins", actorUuid: "Actor.ada", dc: 10, modes: false, actionLabel: "Roll", choices: [], data: { requestId: "one", step: 1 }, completed: false } } };
  const message = { id: "hoard", author: gm, getFlag: () => card, async update(changes) {
    updates.push(changes);
    if (changes.content) message.content = changes.content;
    const flag = changes["flags.morelord-core.rollRequest"];
    if (flag) card = flag;
    const completed = changes[`flags.morelord-core.rollRequest.entries.${entryKey}.completed`];
    if (completed !== undefined) card.entries[entryKey].completed = completed;
  }, async setFlag() { throw new Error("A grouped card closes through update."); } };
  const service = new ChatRollRequests({ createChannel: () => ({ on() {} }) });
  await assert.rejects(() => service.updateEntry(message, entryKey, { title: "Nope" }), /eligible GM/);
  assert.equal(updates.length, 0);
  game.user = gm;
  card.entries[entryKey].holdCompletion = true;
  const next = await service.updateEntry(message, entryKey, { title: "Gems", actionLabel: "Confirm", dc: 15, data: { step: 2 }, completed: false });
  assert.equal(next.entries[entryKey].holdCompletion, true);
  assert.equal(next.entries[entryKey].title, "Gems");
  assert.equal(next.entries[entryKey].data.requestId, "one");
  assert.equal(next.entries[entryKey].data.step, 2);
  assert.equal(next.entries[entryKey].dc, 15);
  assert.equal(next.type, "steps");
  assert.match(message.content, />Gems</);
  assert.match(message.content, /aria-label="Confirm">Confirm</);
  assert.match(message.content, /DC 15/);
  await assert.rejects(() => service.updateEntry(message, "missing", { title: "Lost" }), /does not exist/);
  updates.length = 0;
  await completeChatRoll(message, entryKey);
  assert.deepEqual(Object.keys(updates[0]), [`flags.morelord-core.rollRequest.entries.${entryKey}.completed`]);
  assert.equal(updates[0][`flags.morelord-core.rollRequest.entries.${entryKey}.completed`], true);
  assert.equal(card.entries[entryKey].completed, true);
  updates.length = 0;
  await completeChatRoll(message, entryKey, { reopen: true, title: "Art", actionLabel: "Keep rolling" });
  assert.equal(card.entries[entryKey].completed, false);
  assert.equal(card.entries[entryKey].title, "Art");
  assert.equal(card.entries[entryKey].actionLabel, "Keep rolling");
  assert.equal(card.entries[entryKey].holdCompletion, true);
  assert.match(message.content, /aria-label="Keep rolling">Keep rolling</);
  assert.equal(updates.some(entry => entry[0] === "refresh"), true);
});

test("message visibility stays public unless the caller opts in to preserving it", async t => {
  const keys = ["game", "foundry", "ChatMessage", "ui"];
  const saved = keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  t.after(() => { for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; });
  const gm = { id: "gm", isGM: true, active: true };
  const messages = [];
  messages.get = id => messages.find(message => message.id === id);
  const calls = [];
  globalThis.game = { user: gm, users: [gm], messages, settings: { settings: new Map() } };
  globalThis.foundry = { utils: { escapeHTML: String } };
  globalThis.ui = { chat: { updateMessage() {} } };
  globalThis.ChatMessage = { async create(data, options) {
    calls.push({ whisper: data.whisper, blind: data.blind, options });
    const message = {
      ...data, id: `card-${messages.length}`, author: gm, options,
      getFlag: (id, key) => message.flags[id][key],
      async update(changes) {
        const flag = changes["flags.morelord-core.rollRequest"];
        if (flag) message.flags["morelord-core"].rollRequest = flag;
      }
    };
    messages.push(message);
    return message;
  } };
  const service = new ChatRollRequests({ createChannel: () => ({ on() {} }) });
  service.register("posted", () => ({ accepted: true }));
  const forced = await service.create({
    type: "posted", key: "forced", title: "Check", whisper: [gm.id], blind: true, messageMode: "blind"
  });
  assert.deepEqual(calls[0], { whisper: [gm.id], blind: false, options: { messageMode: "public" } });
  assert.equal(forced.getFlag("morelord-core", "rollRequest").holdCompletion, undefined);
  const preserved = await service.create({
    type: "posted", key: "kept", title: "Private", whisper: [gm.id], blind: false, preserveMessageMode: true
  });
  assert.deepEqual(calls[1], { whisper: [gm.id], blind: false, options: {} });
  assert.equal(preserved.blind, false);
  const blind = await service.create({
    type: "posted", key: "blind", title: "Blind", whisper: ["gm"], blind: true, messageMode: "blind", preserveMessageMode: true, holdCompletion: true
  });
  assert.deepEqual(calls[2], { whisper: ["gm"], blind: true, options: { messageMode: "blind" } });
  assert.equal(blind.getFlag("morelord-core", "rollRequest").holdCompletion, true);
  const grouped = await service.create({
    type: "posted", key: "ada", groupKey: "batch", title: "Party", preserveMessageMode: true, whisper: ["secret"], messageMode: "gm", holdCompletion: true
  });
  assert.equal(calls.length, 4);
  assert.equal(grouped.getFlag("morelord-core", "rollRequest").entries[Object.keys(grouped.getFlag("morelord-core", "rollRequest").entries)[0]].holdCompletion, true);
  const joined = await service.create({
    type: "posted", key: "bea", groupKey: "batch", title: "Party", preserveMessageMode: true, whisper: ["other"], messageMode: "blind"
  });
  assert.equal(joined, grouped);
  assert.equal(calls.length, 4);
  assert.equal(calls[3].options.messageMode, "gm");
  assert.deepEqual(calls[3].whisper, ["secret"]);
});

test("holdCompletion keeps a step open, and a normal handler still completes", async t => {
  const keys = ["game", "foundry", "ui", "Hooks", "fromUuid", "fromUuidSync", "document"];
  const saved = keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  t.after(() => { for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; });
  globalThis.document = { createElement: () => ({ className: "", setAttribute() {}, textContent: "" }) };
  const gm = { id: "gm", active: true, isGM: true }, player = { id: "player", active: true, isGM: false };
  const actor = { uuid: "Actor.hero", testUserPermission: user => user === player };
  const users = [gm, player];
  users.get = id => users.find(user => user.id === id);
  let request = { type: "steps", actorUuid: actor.uuid, modes: true, choices: [], data: {}, completed: false, holdCompletion: true };
  const message = { id: "steps", author: gm, getFlag: () => request, async setFlag(_id, _key, value) { request = value; } };
  const messages = [message];
  messages.get = id => messages.find(item => item.id === id);
  globalThis.game = { user: gm, users, messages, settings: { settings: new Map() } };
  globalThis.foundry = { utils: { escapeHTML: String } };
  globalThis.fromUuid = async () => actor;
  globalThis.fromUuidSync = () => actor;
  const notices = [];
  globalThis.ui = { notifications: { error(text) { notices.push(text); } }, chat: { updateMessage() {} } };
  let handler;
  let outcome = {};
  const service = new ChatRollRequests({ createChannel: () => ({
    on(_type, fn) { handler = fn; },
    executeAsUser: async (_type, data, userId) => {
      const previous = game.user;
      game.user = users.get(userId);
      try { return await handler(data, { senderUserId: previous.id }); }
      finally { game.user = previous; }
    }
  }) });
  service.register("steps", () => outcome);
  assert.deepEqual(await handler({ messageId: "steps", mode: "normal" }, { senderUserId: player.id }), { accepted: true, held: true });
  assert.equal(request.completed, false);
  outcome = { complete: false };
  assert.equal((await handler({ messageId: "steps", mode: "normal" }, { senderUserId: player.id })).held, true);
  assert.equal(request.completed, false);
  outcome = { complete: true };
  assert.deepEqual(await handler({ messageId: "steps", mode: "normal" }, { senderUserId: player.id }), { accepted: true });
  assert.equal(request.completed, true);
  request = { type: "steps", actorUuid: actor.uuid, modes: true, choices: [], data: {}, completed: false };
  assert.deepEqual(await handler({ messageId: "steps", mode: "normal" }, { senderUserId: player.id }), { accepted: true });
  assert.equal(request.completed, true);
  request = { ...request, completed: false };
  outcome = { accepted: false, reason: "Not this step." };
  request.holdCompletion = true;
  assert.equal((await handler({ messageId: "steps", mode: "normal" }, { senderUserId: player.id })).accepted, false);
  assert.equal(request.completed, false);

  const hooks = [];
  globalThis.Hooks = { on(_name, fn) { hooks.push(fn); } };
  service.start();
  let release;
  let entered = false;
  outcome = new Promise(resolve => { release = resolve; });
  service.register("steps", async () => { entered = true; return outcome; });
  request = { type: "steps", actorUuid: actor.uuid, modes: true, choices: [], data: {}, completed: false, holdCompletion: true };
  const open = rollButton();
  hooks[0](message, open.html);
  const pending = open.click();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(entered, true);
  assert.equal(open.completed(), false);
  const during = rollButton();
  hooks[0](message, during.html);
  assert.equal(during.disabled(), true);
  assert.equal(during.completed(), false);
  release({ accepted: true });
  await pending;
  assert.equal(open.completed(), false);
  assert.equal(request.completed, false);
  assert.deepEqual(notices, []);

  request = { type: "steps", actorUuid: actor.uuid, modes: true, choices: [], data: {}, completed: false };
  let started;
  const gate = new Promise(resolve => { started = resolve; });
  service.register("steps", () => gate);
  const immediate = rollButton();
  hooks[0](message, immediate.html);
  const waiting = immediate.click();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(immediate.completed(), true);
  started({ accepted: true });
  await waiting;
  assert.equal(request.completed, true);
});

function rollButton() {
  let completed = false;
  const row = {
    dataset: { mlRollEntry: "" },
    querySelector(selector) { return selector === ".ml-roll-completed" && completed ? {} : null; },
    querySelectorAll() { return [{ remove() {} }]; },
    append() { completed = true; }
  };
  const listeners = [];
  const button = {
    dataset: { mlCoreRoll: "normal" },
    disabled: false,
    hasAttribute: () => false,
    closest: () => row,
    addEventListener(_type, fn) { listeners.push(fn); }
  };
  return { html: { querySelectorAll: () => [button] }, click: () => listeners[0](), completed: () => completed, disabled: () => button.disabled };
}
