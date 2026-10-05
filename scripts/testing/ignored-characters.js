import { assert } from "./in-game.js";

export const ignoredCharactersCheck = {
  id: "core.ignored-character-selection",
  async run() {
    assert(game.user.isGM, "Run this regression as GM.");
    const player = game.users.find(user => !user.isGM);
    assert(player, "A player account is required.");
    const saved = game.settings.get("morelord-core", "ignoredUserIds");
    const fixtures = [];
    try {
      const character = await Actor.create({ name: "Ignored character regression", type: "character", ownership: { default: 0, [player.id]: 3 } });
      fixtures.push(character);
      const group = await Actor.create({ name: "Ignored party regression", type: "group", system: { members: [{ actor: character.id }] } });
      fixtures.push(group);
      const actors = [group, character]; actors.party = group;
      const participation = MorelordCore.ui.participation;
      await game.settings.set("morelord-core", "ignoredUserIds", saved.filter(id => id !== player.id));
      assert(participation.listCharacterActors({ actors }).includes(character), "Non-ignored party character is available.");
      await game.settings.set("morelord-core", "ignoredUserIds", [...new Set([...saved, player.id])]);
      assert(!participation.listCharacterActors({ actors }).includes(character), "Ignored owner is excluded from the party list.");
      assert(!participation.listCharacterActors({ actors, defaultParty: false }).includes(character), "Ignored owner is excluded from fallback choices.");
      assert(!participation.listCharacterChoices({ actors, selectedUuids: [character.uuid] }).length, "Saved selections cannot restore an ignored character.");
    } finally {
      await game.settings.set("morelord-core", "ignoredUserIds", saved);
      for (const actor of fixtures.reverse()) await actor.delete();
    }
  }
};
