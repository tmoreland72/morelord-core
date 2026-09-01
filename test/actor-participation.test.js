import test from "node:test";
import assert from "node:assert/strict";
import { listCharacterChoices } from "../scripts/ui/actor-participation.js";

const character = (id, { player = true } = {}) => ({ id, uuid: `Actor.${id}`, name: id, type: "character", hasPlayerOwner: player, isOwner: player, img: `${id}.webp` });

test("participant defaults prefer members of the primary group Actor", () => {
  const aric = character("Aric");
  const brom = character("Brom");
  const outsider = character("Outsider");
  const party = { id: "party", name: "Heroes", type: "group", system: { members: [{ actor: aric }, { actor: brom }] } };
  const actors = [party, aric, brom, outsider];
  actors.party = party;
  const choices = listCharacterChoices({ actors });
  assert.deepEqual(choices.filter(choice => choice.checked).map(choice => choice.uuid), ["Actor.Aric", "Actor.Brom"]);
  assert.equal(choices.find(choice => choice.uuid === "Actor.Outsider").checked, false);
});

test("participant defaults use player-owned characters when no populated group exists", () => {
  const aric = character("Aric");
  const npc = character("NPC", { player: false });
  const choices = listCharacterChoices({ actors: [aric, npc] });
  assert.deepEqual(choices.map(choice => [choice.uuid, choice.checked]), [["Actor.Aric", true]]);
});

test("an explicit saved selection overrides party defaults", () => {
  const aric = character("Aric");
  const outsider = character("Outsider");
  const party = { id: "party", name: "Heroes", type: "group", system: { playerCharacters: [aric] } };
  const actors = [party, aric, outsider];
  actors.party = party;
  const choices = listCharacterChoices({ actors, selectedUuids: [outsider.uuid] });
  assert.deepEqual(choices.filter(choice => choice.checked).map(choice => choice.uuid), ["Actor.Outsider"]);
});
