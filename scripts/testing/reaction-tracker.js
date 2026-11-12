import { assert } from './in-game.js';
import { REACTION_ICON, REACTION_STATUS_ID } from '../ui/reaction-tracker.js';

export const reactionStatusCheck = {
  id: 'core.reaction-status-registry',
  run() {
    const statuses = CONFIG.statusEffects;
    // Enumerate the real Foundry registry, which throws on duplicate proxy keys.
    Object.keys(statuses);
    const reactions = (Array.isArray(statuses) ? statuses : Object.values(statuses))
      .filter(status => status?.id === REACTION_STATUS_ID);
    assert(reactions.length === 1, `Expected one reaction status, found ${reactions.length}.`);
    const image = reactions[0].img ?? reactions[0].icon;
    const expected = game.modules.get('midi-qol')?.active ? 'modules/midi-qol/icons/reaction.svg' : REACTION_ICON;
    assert(image === expected, `Expected the reaction icon ${expected}, found ${image}.`);
  }
};
