import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  REACTION_ICON, REACTION_STATUS_ID, actorsForIncomingTurn, actorsOnCombatScene, applyReactionUsed,
  canUpdateActor, clearReactionUsed, hasReaction, isActiveGameMaster, isReactionActivity,
  massCombatGroup, reactionClearActors, registerReactionStatus, registerReactionTracker
} from '../scripts/ui/reaction-tracker.js';

function actor(id, {owner = true, marked = false, permit = null} = {}) {
  const calls = [];
  const document = {
    id, calls, isOwner: owner,
    statuses: new Set(marked ? [REACTION_STATUS_ID] : []),
    effects: [],
    testUserPermission(user, level) { return permit === true && user?.id === 'permitted' && level === 'OWNER'; },
    async toggleStatusEffect(status, options) {
      calls.push({status, ...options});
      if (options.active) this.statuses.add(status);
      else this.statuses.delete(status);
    }
  };
  return document;
}

function groupFlag(group) {
  return (namespace, key) => namespace === 'morelord-encounters' && key === 'massCombatGroup' ? group : null;
}

function combatant(document, group, actorId = document?.id) {
  return {actor: document, actorId, token: {actor: document, actorId}, getFlag: groupFlag(group)};
}

function token(document, {group = '', actorId = document?.id} = {}) {
  return {actor: document, actorId, getFlag: groupFlag(group)};
}

function startedCombat({combatants, tokens, current, round = 1, turn = 0, started = true}) {
  return {
    started, round, turn, combatant: current ?? combatants[0],
    combatants, scene: {tokens}
  };
}

function hooksMock() {
  const handlers = {};
  return {
    handlers,
    once(event, fn) { (handlers[event] ??= []).push(fn); },
    on(event, fn) { (handlers[event] ??= []).push(fn); },
    async call(event, ...args) {
      for (const fn of handlers[event] ?? []) await fn(...args);
    }
  };
}

test('reaction status registers a colored icon without replacing core effects', () => {
  const svg = readFileSync(new URL('../assets/icons/reaction-used.svg', import.meta.url), 'utf8');
  assert.match(svg, /#ffc233/i);
  assert.match(svg, /#100c08/i);
  assert.match(svg, /L112 292/);
  assert.equal(svg.includes('A 150'), false);
  assert.equal(svg.includes('icons/svg/'), false);
  const objectConfig = {
    statusEffects: {dead: {id: 'dead', name: 'Dead', _id: 'coreDeadStatus01'}},
    specialStatusEffects: {DEFEATED: 'dead'},
    DND5E: {statusEffects: {dead: {name: 'Dead'}}}
  };
  const effect = registerReactionStatus(objectConfig);
  assert.equal(effect.id, REACTION_STATUS_ID);
  assert.equal(effect.name, 'Reaction');
  assert.equal(objectConfig.DND5E.statusEffects.reaction.name, 'Reaction');
  assert.equal(effect.img, REACTION_ICON);
  assert.equal(effect.icon, REACTION_ICON);
  assert.equal(effect.hud, true);
  assert.equal(objectConfig.statusEffects.reaction, effect);
  assert.equal(objectConfig.statusEffects.dead.id, 'dead');
  assert.equal(objectConfig.specialStatusEffects.DEFEATED, 'dead');
  assert.equal(objectConfig.specialStatusEffects.REACTION, 'reaction');
  assert.equal(objectConfig.DND5E.statusEffects.reaction.img, REACTION_ICON);
  assert.equal(objectConfig.DND5E.statusEffects.reaction.special, 'REACTION');
  registerReactionStatus(objectConfig);
  assert.equal(Object.values(objectConfig.statusEffects).filter(entry => entry.id === 'reaction').length, 1);

  const arrayConfig = {statusEffects: [{id: 'dead', name: 'Dead'}], specialStatusEffects: {DEFEATED: 'dead'}};
  registerReactionStatus(arrayConfig);
  registerReactionStatus(arrayConfig);
  assert.equal(arrayConfig.statusEffects.filter(entry => entry.id === 'reaction').length, 1);
  assert.equal(arrayConfig.statusEffects.reaction.name, 'Reaction');
  assert.equal(arrayConfig.specialStatusEffects.DEFEATED, 'dead');
});

test('reaction activities apply only in a started combat from a client that can update the actor', async () => {
  const hero = actor('hero');
  const user = {id: 'player', isGM: false};
  const combat = {started: true, round: 1, combatants: {contents: [{actorId: 'hero'}]}};
  const activity = {activation: {type: 'reaction'}, actor: hero};
  assert.equal(isReactionActivity(activity), true);
  assert.equal(isReactionActivity({activation: {type: 'action'}, actor: hero}), false);
  assert.equal(await applyReactionUsed(activity, {user, combats: {contents: [combat]}, enabled: true}), true);
  assert.deepEqual(hero.calls, [{status: 'reaction', active: true}]);
  assert.equal(hasReaction(hero), true);
  hero.calls.length = 0;
  assert.equal(await applyReactionUsed(activity, {user, combats: [combat], enabled: true}), false);
  assert.equal(hero.calls.length, 0);

  const other = actor('other');
  assert.equal(await applyReactionUsed({system: {activation: {type: 'reaction'}}, item: {actor: other}}, {
    user, combats: [combat], enabled: true
  }), false);
  const ownCombat = {started: true, round: 2, combatants: [combatant(other)]};
  assert.equal(await applyReactionUsed({system: {activation: {type: 'reaction'}}, item: {actor: other}}, {
    user, combats: [ownCombat], enabled: true
  }), true);
  assert.equal(other.calls[0].active, true);

  const outsider = actor('outsider');
  assert.equal(await applyReactionUsed({activation: {type: 'reaction'}, actor: outsider}, {
    user, combats: [{started: false, round: 1, combatants: [combatant(outsider)]}], enabled: true
  }), false);
  assert.equal(await applyReactionUsed({activation: {type: 'reaction'}, actor: outsider}, {
    user, combats: [{started: true, round: 0, combatants: [combatant(outsider)]}], enabled: true
  }), false);
  assert.equal(await applyReactionUsed({activation: {type: 'bonus'}, actor: outsider}, {
    user, combats: [ownCombat], enabled: true
  }), false);
  assert.equal(await applyReactionUsed(activity, {user, combats: [combat], enabled: false}), false);
  assert.equal(outsider.calls.length, 0);

  const locked = actor('locked', {owner: false});
  locked.toggleStatusEffect = async () => { throw new Error('lack permission to update'); };
  const lockedCombat = {started: true, round: 1, combatants: [combatant(locked)]};
  assert.equal(canUpdateActor(user, locked), false);
  assert.equal(await applyReactionUsed({activation: {type: 'reaction'}, actor: locked}, {
    user, combats: [lockedCombat], enabled: true
  }), false);

  const shared = actor('shared', {owner: false, permit: true});
  assert.equal(canUpdateActor({id: 'permitted'}, shared), true);
  assert.equal(await applyReactionUsed({activation: {type: 'reaction'}, actor: shared}, {
    user: {id: 'permitted'}, combats: [{started: true, round: 1, combatants: [combatant(shared)]}], enabled: true
  }), true);
  assert.equal(shared.calls.length, 1);
});

test('the active GM clears the incoming turn, a mob group, and the scene when combat ends', async () => {
  const fighter = actor('fighter', {marked: true});
  const wolfA = actor('wolf-a', {marked: true});
  const wolfB = actor('wolf-b', {marked: true});
  const extraWolf = actor('wolf-extra', {marked: true});
  const bear = actor('bear', {marked: true});
  const bystander = actor('bystander', {marked: true});
  const unmarked = actor('unmarked');
  const sameActorToken = actor('linked');
  const wolves = startedCombat({
    current: combatant(wolfA, 'wolves'),
    combatants: [combatant(wolfA, 'wolves'), combatant(wolfB, 'wolves'), combatant(bear, 'bears'), combatant(fighter)],
    tokens: [
      token(wolfA, {group: 'wolves'}), token(wolfB, {group: 'wolves'}),
      token(extraWolf, {group: 'wolves'}), token(bear, {group: 'bears'}),
      token(fighter), token(bystander), token(unmarked)
    ]
  });
  assert.deepEqual(actorsForIncomingTurn(wolves).map(entry => entry.id), ['wolf-a', 'wolf-b', 'wolf-extra']);
  assert.deepEqual((await clearReactionUsed(reactionClearActors(wolves, {turn: 1}), {allowed: true})).map(entry => entry.id),
    ['wolf-a', 'wolf-b', 'wolf-extra']);
  assert.equal(bear.calls.length, 0);
  assert.equal(fighter.calls.length, 0);
  assert.equal(bystander.calls.length, 0);
  assert.equal(unmarked.calls.length, 0);
  assert.equal(wolfA.calls.length, 1);
  assert.equal(wolfA.calls[0].active, false);

  const lone = startedCombat({
    combatants: [combatant(fighter), combatant(bear, 'bears')],
    tokens: [token(fighter), token(bear, {group: 'bears'}), token(bystander)],
    current: combatant(fighter), turn: 1
  });
  fighter.statuses.add(REACTION_STATUS_ID);
  bear.calls.length = 0;
  bystander.calls.length = 0;
  assert.deepEqual((await clearReactionUsed(reactionClearActors(lone, {round: 2, turn: 0}), {allowed: true})).map(entry => entry.id), ['fighter']);
  assert.equal(bear.calls.length, 0);
  assert.equal(bystander.calls.length, 0);

  const packActor = actor('pack-body', {marked: true});
  const packTwin = actor('pack-twin', {marked: true});
  const other = actor('other', {marked: true});
  const pack = startedCombat({
    current: {actor: packActor, actorId: 'pack-body', getFlag: groupFlag('pack'), token: {actor: packActor}},
    combatants: [{actor: packActor, actorId: 'pack-body', getFlag: groupFlag('pack'), token: {actor: packActor}}],
    tokens: [token(packTwin, {actorId: 'pack-body'}), token(other, {actorId: 'other'})]
  });
  assert.equal(massCombatGroup(pack.combatant), 'pack');
  assert.deepEqual(actorsForIncomingTurn(pack).map(entry => entry.id).sort(), ['pack-body', 'pack-twin']);

  const scene = startedCombat({
    combatants: [combatant(fighter), combatant(sameActorToken)],
    tokens: [token(fighter), token(sameActorToken), token(bystander), token(unmarked)]
  });
  fighter.statuses.add(REACTION_STATUS_ID);
  sameActorToken.statuses.add(REACTION_STATUS_ID);
  bystander.statuses.add(REACTION_STATUS_ID);
  const ended = await clearReactionUsed(reactionClearActors(scene, {round: 0}), {allowed: true});
  assert.deepEqual(ended.map(entry => entry.id).sort(), ['bystander', 'fighter', 'linked']);
  assert.equal(unmarked.calls.length, 0);
  const reset = await clearReactionUsed(reactionClearActors(scene, {round: null, turn: null}), {allowed: true});
  assert.equal(reset.length, 0);
  assert.equal(reactionClearActors(scene, {initiative: 15}).length, 0);
  assert.equal(reactionClearActors({...scene, started: false}, {turn: 1}).length, 0);
  assert.equal(actorsOnCombatScene(scene).some(entry => entry.id === 'unmarked'), true);

  const elsewhere = actor('elsewhere', {marked: true});
  const removed = startedCombat({
    combatants: [combatant(fighter)],
    tokens: [token(fighter), token(bystander)]
  });
  fighter.statuses.add(REACTION_STATUS_ID);
  bystander.statuses.add(REACTION_STATUS_ID);
  const deleted = await clearReactionUsed(reactionClearActors(removed, null, {deleted: true}), {allowed: true});
  assert.deepEqual(deleted.map(entry => entry.id).sort(), ['bystander', 'fighter']);
  assert.equal(elsewhere.calls.length, 0);

  const denied = actor('denied', {marked: true});
  let deniedCalls = 0;
  denied.toggleStatusEffect = async () => { deniedCalls += 1; };
  assert.deepEqual(await clearReactionUsed([denied], {allowed: false}), []);
  assert.equal(deniedCalls, 0);
  const duplicate = actor('duplicate', {marked: true});
  assert.equal((await clearReactionUsed([duplicate, duplicate, duplicate.token], {allowed: true})).length, 1);
  assert.equal(duplicate.calls.length, 1);
});

test('non-GM clients never clear reactions, and only an owner applies one', async () => {
  assert.equal(isActiveGameMaster({user: {isGM: false}, users: {activeGM: {isSelf: false}}}), false);
  assert.equal(isActiveGameMaster({user: {isGM: true}, users: {activeGM: {isSelf: false}}}), false);
  assert.equal(isActiveGameMaster({user: {isGM: true}, users: {activeGM: {isSelf: true}}}), true);

  const hero = actor('hero', {owner: true, marked: true});
  let unauthorized = 0;
  hero.toggleStatusEffect = async () => { unauthorized += 1; throw new Error('lack permission to update'); };
  const hooks = hooksMock();
  let tracker = true;
  const game = {
    user: {isGM: false, id: 'player'},
    users: {activeGM: {isSelf: false}},
    combat: null,
    combats: [{started: true, round: 1, combatants: [combatant(hero)]}],
    settings: {
      register() {},
      get: () => tracker
    }
  };
  const config = {statusEffects: {}};
  registerReactionTracker({hooks, game, config});
  await hooks.call('i18nInit');
  await hooks.call('setup');
  assert.equal(config.statusEffects.reaction.name, 'Reaction');
  const combat = startedCombat({combatants: [combatant(hero)], tokens: [token(hero)], turn: 1});
  await hooks.call('updateCombat', combat, {turn: 1});
  await hooks.call('deleteCombat', combat);
  await hooks.call('dnd5e.postUseActivity', {activation: {type: 'reaction'}, actor: hero});
  game.user = {isGM: true, id: 'gm-2'};
  await hooks.call('updateCombat', combat, {turn: 2});
  await hooks.call('deleteCombat', combat);

  assert.equal(unauthorized, 0);
  hero.isOwner = true;
  hero.statuses.delete(REACTION_STATUS_ID);
  const applied = [];
  hero.toggleStatusEffect = async (status, options) => applied.push(options.active);
  await hooks.call('dnd5e.postUseActivity', {activation: {type: 'reaction'}, actor: hero});
  assert.deepEqual(applied, [true]);
  hero.statuses.add(REACTION_STATUS_ID);
  tracker = false;
  await hooks.call('dnd5e.postUseActivity', {activation: {type: 'reaction'}, actor: hero});
  game.user = {isGM: true, id: 'gm'};
  game.users.activeGM = {isSelf: true};
  await hooks.call('updateCombat', combat, {turn: 1});
  await hooks.call('deleteCombat', combat);
  assert.deepEqual(applied, [true]);

  tracker = true;
  await hooks.call('updateCombat', combat, {turn: 1});
  assert.deepEqual(applied, [true, false]);
});

test('core settings register and save the world reaction tracker', () => {
  const template = readFileSync(new URL('../templates/connection.hbs', import.meta.url), 'utf8');
  const main = readFileSync(new URL('../scripts/main.js', import.meta.url), 'utf8');
  const tracker = readFileSync(new URL('../scripts/ui/reaction-tracker.js', import.meta.url), 'utf8');
  assert.match(template, /name="reactionTracker"/);
  assert.match(template, /Reaction Used/);
  assert.match(main, /registerReactionTracker\(\)/);
  assert.match(main, /reactionTracker: game\.settings\.get\(MODULE_ID, "reactionTracker"\)/);
  assert.match(main, /game\.settings\.set\(MODULE_ID, "reactionTracker", data\.has\("reactionTracker"\)\)/);
  assert.match(tracker, /scope: 'world'/);
  assert.match(tracker, /config: true/);
  assert.match(tracker, /default: true/);
  assert.match(tracker, /dnd5e\.postUseActivity/);
  assert.match(tracker, /updateCombat/);
  assert.match(tracker, /deleteCombat/);
});
