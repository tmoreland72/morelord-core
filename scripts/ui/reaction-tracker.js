const MODULE_ID = 'morelord-core';

export const REACTION_STATUS_ID = 'reaction';
export const REACTION_ICON = 'modules/morelord-core/assets/icons/reaction-used.svg';
const ENCOUNTERS_MODULE = 'morelord-encounters';
const MASS_COMBAT_GROUP = 'massCombatGroup';

function list(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.contents)) return value.contents;
  if (typeof value.values === 'function') return Array.from(value.values());
  return [];
}

function uniqueActors(actors) {
  const seen = new Set();
  const result = [];
  for (const actor of actors) {
    if (!actor || seen.has(actor)) continue;
    seen.add(actor);
    result.push(actor);
  }
  return result;
}

/** Shared mob turn id from Morelord Encounters, when that combatant or token carries one. */
export function massCombatGroup(document) {
  if (!document) return '';
  const flagged = document.getFlag?.(ENCOUNTERS_MODULE, MASS_COMBAT_GROUP);
  if (flagged) return flagged;
  return document.flags?.[ENCOUNTERS_MODULE]?.[MASS_COMBAT_GROUP] ?? '';
}

export function registerReactionStatus(config = {}) {
  const dndEffects = config.DND5E?.statusEffects;
  if (dndEffects && typeof dndEffects === 'object') {
    dndEffects[REACTION_STATUS_ID] = {
      ...dndEffects[REACTION_STATUS_ID],
      name: 'Reaction',
      img: REACTION_ICON,
      icon: REACTION_ICON,
      special: dndEffects[REACTION_STATUS_ID]?.special || 'REACTION'
    };
  }
  const current = Array.isArray(config.statusEffects)
    ? config.statusEffects.find(effect => effect?.id === REACTION_STATUS_ID)
    : config.statusEffects?.[REACTION_STATUS_ID];
  const effect = {
    id: REACTION_STATUS_ID,
    name: 'Reaction',
    img: REACTION_ICON,
    icon: REACTION_ICON,
    hud: true,
    order: current?.order ?? 20,
    _id: current?._id || 'mlReactionUsed01'
  };
  if (Array.isArray(config.statusEffects)) {
    const index = config.statusEffects.findIndex(entry => entry?.id === REACTION_STATUS_ID);
    if (index >= 0) config.statusEffects[index] = effect;
    else config.statusEffects.push(effect);
    Object.defineProperty(config.statusEffects, REACTION_STATUS_ID, {
      value: effect, writable: true, configurable: true
    });
  } else {
    config.statusEffects ??= {};
    config.statusEffects[REACTION_STATUS_ID] = effect;
  }
  config.specialStatusEffects ??= {};
  if (!config.specialStatusEffects.REACTION) config.specialStatusEffects.REACTION = REACTION_STATUS_ID;
  return effect;
}

export function isReactionActivity(activity) {
  const type = activity?.activation?.type ?? activity?.system?.activation?.type;
  return type === 'reaction';
}

export function canUpdateActor(user, actor) {
  if (!user || !actor) return false;
  if (actor.isOwner === true) return true;
  if (typeof actor.testUserPermission !== 'function') return false;
  const owner = globalThis.CONST?.DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 'OWNER';
  return actor.testUserPermission(user, owner) === true;
}

export function isActiveGameMaster(game) {
  return game?.user?.isGM === true && game?.users?.activeGM?.isSelf === true;
}

export function hasReaction(actor) {
  if (actor?.statuses?.has?.(REACTION_STATUS_ID)) return true;
  for (const effect of list(actor?.effects)) {
    const statuses = effect?.statuses;
    if (typeof statuses?.has === 'function' && statuses.has(REACTION_STATUS_ID)) return true;
    if (Array.isArray(statuses) && statuses.includes(REACTION_STATUS_ID)) return true;
  }
  return false;
}

function sameActor(combatant, actor) {
  if (!combatant || !actor) return false;
  if (combatant.actor === actor || combatant.token?.actor === actor) return true;
  if (!actor.id) return false;
  return combatant.actorId === actor.id || combatant.actor?.id === actor.id || combatant.token?.actor?.id === actor.id;
}

export function actorInStartedCombat(actor, combats) {
  if (!actor) return false;
  return list(combats).some(combat => combat?.started === true && Number(combat.round) > 0
    && list(combat.combatants).some(combatant => sameActor(combatant, actor)));
}

export function incomingCombatant(combat) {
  if (!combat) return null;
  if (combat.combatant) return combat.combatant;
  const turns = list(combat.turns);
  return Number.isInteger(combat.turn) ? turns[combat.turn] ?? null : null;
}

export function actorsOnCombatScene(combat) {
  return uniqueActors([
    ...list(combat?.combatants).flatMap(combatant => [combatant?.actor, combatant?.token?.actor]),
    ...list(combat?.scene?.tokens).map(token => token?.actor)
  ]);
}

export function actorsForIncomingTurn(combat) {
  const combatant = incomingCombatant(combat);
  if (!combatant) return [];
  const group = massCombatGroup(combatant);
  if (!group) return uniqueActors([combatant.actor, combatant.token?.actor]);
  const grouped = list(combat.combatants).filter(entry => massCombatGroup(entry) === group);
  const actorIds = new Set();
  for (const entry of grouped) {
    const id = entry.actorId ?? entry.actor?.id;
    if (id) actorIds.add(id);
  }
  const ownId = combatant.actorId ?? combatant.actor?.id;
  if (ownId) actorIds.add(ownId);
  const tokens = list(combat.scene?.tokens).filter(token => massCombatGroup(token) === group
    || massCombatGroup(token?.actor) === group
    || actorIds.has(token?.actorId)
    || actorIds.has(token?.actor?.id));
  return uniqueActors([
    ...grouped.flatMap(entry => [entry.actor, entry.token?.actor]),
    ...tokens.map(token => token?.actor),
    combatant.actor,
    combatant.token?.actor
  ]);
}

export function reactionClearActors(combat, changed, {deleted = false} = {}) {
  if (!combat) return [];
  if (deleted) return actorsOnCombatScene(combat);
  if (!changed || typeof changed !== 'object') return [];
  const roundChanged = Object.prototype.hasOwnProperty.call(changed, 'round');
  const turnChanged = Object.prototype.hasOwnProperty.call(changed, 'turn');
  if (!roundChanged && !turnChanged) return [];
  if (roundChanged && (changed.round === 0 || changed.round === null)) return actorsOnCombatScene(combat);
  if (combat.started !== true) return [];
  return actorsForIncomingTurn(combat);
}

async function setReaction(actor, active) {
  if (!actor || typeof actor.toggleStatusEffect !== 'function') return false;
  if (hasReaction(actor) === active) return false;
  await actor.toggleStatusEffect(REACTION_STATUS_ID, {active});
  return true;
}

export async function applyReactionUsed(activity, {user, combats, enabled} = {}) {
  if (enabled === false) return false;
  if (!isReactionActivity(activity)) return false;
  const actor = activity?.actor ?? activity?.item?.actor ?? null;
  if (!actorInStartedCombat(actor, combats)) return false;
  if (!canUpdateActor(user, actor)) return false;
  return setReaction(actor, true);
}

export async function clearReactionUsed(actors, {allowed} = {}) {
  if (allowed !== true) return [];
  const cleared = [];
  for (const actor of uniqueActors(actors)) {
    if (await setReaction(actor, false)) cleared.push(actor);
  }
  return cleared;
}

function reportFailure(error) {
  console.error(`${MODULE_ID} | Reaction Used`, error);
}

export function registerReactionTracker({
  hooks = globalThis.Hooks,
  game = globalThis.game,
  config = globalThis.CONFIG
} = {}) {
  game.settings.register(MODULE_ID, 'reactionTracker', {
    name: 'Reaction Used',
    hint: 'Mark a token when it uses a reaction during a started combat. The active GM clears it on that creature\'s next turn and when combat ends.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    restricted: true
  });
  const enabled = () => {
    try { return game.settings.get(MODULE_ID, 'reactionTracker') !== false; }
    catch { return true; }
  };
  // dnd5e 6 replaces CONFIG.statusEffects during i18nInit, so install again on setup.
  const install = () => registerReactionStatus(config);
  hooks.once('i18nInit', install);
  hooks.once('setup', install);
  hooks.on('dnd5e.postUseActivity', activity => Promise.resolve(applyReactionUsed(activity, {
    user: game.user,
    combats: game.combats ?? (game.combat ? [game.combat] : []),
    enabled: enabled()
  })).catch(reportFailure));
  const clearCombat = (combat, changed, deleted) => Promise.resolve(clearReactionUsed(
    reactionClearActors(combat, changed, {deleted}),
    {allowed: enabled() && isActiveGameMaster(game)}
  )).catch(reportFailure);
  hooks.on('updateCombat', (combat, changed) => clearCombat(combat, changed, false));
  hooks.on('deleteCombat', combat => clearCombat(combat, null, true));
}
