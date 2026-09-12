import test from "node:test";
import assert from "node:assert/strict";
import { isIgnored, listUsers, activePlayerForActor } from "../scripts/services/user-service.js";
import { ContextualSocketService } from "../scripts/services/contextual-socket-service.js";

test("ignored observers never replace players or receive forms, including broadcasts and GM routing", async t => {
  const obs = { id: "obs", active: true };
  const player = { id: "player", active: true, character: { uuid: "Actor.hero" } };
  const recorderGM = { id: "recorder-gm", active: true, isGM: true };
  const gm = { id: "gm", active: true, isGM: true };
  let ignored = [obs.id, recorderGM.id, "deleted-user"];
  const users = [obs, recorderGM, gm, player];
  const actor = { uuid: "Actor.hero", testUserPermission: () => true };
  const game = { user: gm, users, settings: {
    settings: new Map([["morelord-core.ignoredUserIds", {}]]),
    get: () => ignored
  } };
  const saved = Object.fromEntries(["game", "MorelordCore", "foundry", "socketlib"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => { for (const [key, descriptor] of Object.entries(saved)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  globalThis.game = game;

  assert.deepEqual(listUsers(), [gm, player]);
  assert.equal(activePlayerForActor(actor), player);
  player.character = null;
  assert.equal(activePlayerForActor(actor), player);
  player.active = false;
  assert.equal(activePlayerForActor(actor), null);
  ignored.push(gm.id);
  assert.equal(listUsers().some(user => user.active && user.isGM), false);
  ignored = [obs.id, recorderGM.id];
  let receive;
  const sent = [];
  const broadcasts = [];
  globalThis.foundry = { utils: { deepClone: structuredClone, randomID: () => "message" } };
  globalThis.socketlib = { registerModule: () => ({
    register: (name, handler) => { receive = handler; },
    executeAsUser: (name, id, payload) => { sent.push(id); },
    executeForUsers: (name, ids) => { broadcasts.push(ids); }
  }) };
  const service = new ContextualSocketService();
  service.start();
  const channel = service.createChannel("test");
  let opened = 0;
  channel.on("open", () => { opened++; });
  await channel.executeAsUser("open", {}, obs.id);
  assert.deepEqual(sent, []);
  await channel.executeAsGM("open", {});
  assert.deepEqual(sent, [gm.id]);
  await channel.emit("open", {}, { target: "everyone" });
  await channel.emit("open");
  assert.deepEqual(broadcasts, [[gm.id], []]);
  const payload = { namespace: "test", type: "open", senderUserId: gm.id };
  game.user = obs;
  await receive(payload);
  assert.equal(opened, 0);
  game.user = player;
  await receive(payload);
  assert.equal(opened, 1);
  ignored = [];
  assert.equal(isIgnored(obs), false);
  assert.equal(listUsers().length, 4);
});
