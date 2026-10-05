import test from "node:test";
import assert from "node:assert/strict";
import { listCharacterActors, listCharacterChoices } from "../scripts/ui/actor-participation.js";

test("NPC party members are opt-in, deduplicated, and obey ownership filters", () => {
  const hero = { type: "character", uuid: "Actor.hero", name: "Hero", hasPlayerOwner: true, isOwner: true };
  const pet = { type: "npc", id: "pet", uuid: "Actor.pet", name: "Pet", isOwner: false };
  const outsider = { type: "npc", uuid: "Actor.other", name: "Other", hasPlayerOwner: true };
  const party = { type: "group", system: { members: [{ actor: hero }, { actor: pet }, { uuid: pet.uuid }] } };
  const actors = [party, hero, pet, outsider];
  actors.party = party;
  assert.deepEqual(listCharacterActors({ actors }), [hero]);
  assert.deepEqual(listCharacterActors({ actors, includePartyNpcs: true }), [hero, pet]);
  assert.deepEqual(listCharacterActors({ actors, includePartyNpcs: true, ownedOnly: true }), [hero]);
  assert.deepEqual(listCharacterActors({ actors, includePartyNpcs: true, defaultParty: false }), [hero]);
  party.system.members = [{ actor: pet }];
  assert.deepEqual(listCharacterActors({ actors, includePartyNpcs: true }), [hero, pet]);
});

const character = (id, { player = true } = {}) => ({ id, uuid: `Actor.${id}`, name: id, type: "character", hasPlayerOwner: player, isOwner: player, img: `${id}.webp` });

test("ignored-only characters are excluded from party, fallback, and saved selections", () => {
  const previous = globalThis.game;
  const ignored = { id: "observer", isGM: false, active: true };
  const offline = { id: "player", isGM: false, active: false };
  const gm = { id: "gm", isGM: true };
  const hidden = character("Hidden");
  const shared = character("Shared");
  const assigned = character("Assigned", { player: false });
  const managed = character("Managed", { player: false });
  ignored.character = assigned;
  hidden.testUserPermission = user => user === ignored || user === gm;
  shared.testUserPermission = user => [ignored, offline, gm].includes(user);
  const party = { type: "group", system: { members: [hidden, shared, assigned, managed] } };
  const actors = [party, hidden, shared, assigned, managed]; actors.party = party;
  let ignoredIds = [ignored.id];
  globalThis.game = { users: [ignored, offline, gm], settings: {
    settings: new Map([["morelord-core.ignoredUserIds", {}]]), get: () => ignoredIds
  } };
  try {
    assert.deepEqual(listCharacterActors({ actors }), [managed, shared]);
    assert.deepEqual(listCharacterActors({ actors, defaultParty: false }), [shared]);
    assert.deepEqual(listCharacterChoices({ actors, selectedUuids: [hidden.uuid, assigned.uuid] }).filter(c => c.checked), []);
    ignoredIds = [];
    assert.equal(listCharacterActors({ actors }).length, 4);
  } finally { globalThis.game = previous; }
});

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


test("eligible choices combine player ownership with resolved party membership", () => {
  const owned = character("Owned");
  const member = character("Member", { player: false });
  const excluded = character("Excluded", { player: false });
  const party = { type: "group", system: { members: [{ uuid: member.uuid }, { actor: owned }] } };
  const actors = [party, owned, member, excluded]; actors.party = party;
  assert.deepEqual(listCharacterChoices({ actors }).map(choice => choice.uuid), [member.uuid, owned.uuid]);
  assert.deepEqual(listCharacterChoices({ actors, ownedOnly: true }).map(choice => choice.uuid), [owned.uuid]);
  assert.deepEqual(listCharacterChoices({ actors, selectedUuids: [excluded.uuid] }).filter(choice => choice.checked), []);
});
