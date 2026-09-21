function characterMembers(group, actors, includeNpcs = false) {
  const eligible = actor => actor?.type === "character" || (includeNpcs && actor?.type === "npc");
  const resolve = member => {
    const candidate = member?.actor ?? member;
    if (eligible(candidate)) return candidate;
    const id = typeof candidate === "string" ? candidate : candidate?.actorUuid ?? candidate?.uuid ?? candidate?.actorId ?? candidate?.id ?? candidate?._id;
    return Array.from(actors ?? []).find(actor => eligible(actor) && (actor.uuid === id || actor.id === id));
  };
  return [...(group?.system?.playerCharacters ?? []), ...(group?.system?.members ?? [])].map(resolve).filter(Boolean);
}

export function primaryPartyGroup(actors = game.actors, { includeNpcs = false } = {}) {
  const groups = Array.from(actors ?? []).filter(actor => actor.type === "group");
  const ordered = [actors?.party, ...groups].filter((group, index, entries) => group && entries.indexOf(group) === index);
  return ordered.find(group => characterMembers(group, actors, includeNpcs).length) ?? null;
}

export function listCharacterActors({ ownedOnly = false, defaultParty = true, includePartyNpcs = false, actors = game.actors } = {}) {
  const party = defaultParty ? primaryPartyGroup(actors, { includeNpcs: includePartyNpcs }) : null;
  const candidates = [...characterMembers(party, actors, includePartyNpcs), ...Array.from(actors ?? []).filter(actor => actor.type === "character" && actor.hasPlayerOwner)];
  return [...new Map(candidates.map(actor => [actor.uuid, actor])).values()]
    .filter(actor => !ownedOnly || actor.isOwner)
    .sort((left, right) => left.name.localeCompare(right.name));
}

/** Shared character participation model for Morelord workflows. */
export function listCharacterChoices({ selectedUuids = null, ownedOnly = false, defaultParty = true, actors = game.actors } = {}) {
  const explicitSelection = selectedUuids !== null;
  const selected = new Set(Array.from(selectedUuids ?? [], String));
  const party = defaultParty ? primaryPartyGroup(actors) : null;
  const partyMemberUuids = new Set(characterMembers(party, actors).map(actor => actor.uuid));
  return listCharacterActors({ ownedOnly, defaultParty, actors })
    .map(actor => ({
      uuid: actor.uuid,
      name: actor.name,
      img: actor.prototypeToken?.texture?.src || actor.img || "icons/svg/mystery-man.svg",
      hasPlayerOwner: actor.hasPlayerOwner,
      groupId: partyMemberUuids.has(actor.uuid) ? party?.id ?? null : null,
      groupName: partyMemberUuids.has(actor.uuid) ? party?.name ?? null : null,
      checked: explicitSelection ? selected.has(actor.uuid) : party ? partyMemberUuids.has(actor.uuid) : Boolean(actor.hasPlayerOwner)
    }));
}

export function selectedCharacterUuids(formData, fieldName = "actorUuids") {
  return formData.getAll(fieldName).map(String).filter(Boolean);
}

export function participantRecords(actorUuids, { actors = game.actors } = {}) {
  return Array.from(actorUuids, String).map(actorUuid => ({
    actorUuid,
    name: actors?.get?.(actorUuid.split(".").at(-1))?.name ?? null
  }));
}
