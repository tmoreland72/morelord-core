import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ChatRollRequests, canRollForActor, rollAuthority, rollControls } from "../scripts/services/chat-roll-requests.js";
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
  assert.match(rest.content, /<span>Game master<\/span>/);
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
