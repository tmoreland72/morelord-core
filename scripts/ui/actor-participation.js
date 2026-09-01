function characterMembers(group) {
  const direct = Array.from(group?.system?.playerCharacters ?? []).filter(actor => actor?.type === "character");
  if (direct.length) return direct;
  return Array.from(group?.system?.members ?? []).map(member => member?.actor ?? member).filter(actor => actor?.type === "character");
}

export function primaryPartyGroup(actors = game.actors) {
  const groups = Array.from(actors ?? []).filter(actor => actor.type === "group");
  const ordered = [actors?.party, ...groups].filter((group, index, entries) => group && entries.indexOf(group) === index);
  return ordered.find(group => characterMembers(group).length) ?? null;
}

/** Shared character participation model for Morelord workflows. */
export function listCharacterChoices({ selectedUuids = null, ownedOnly = false, defaultParty = true, actors = game.actors } = {}) {
  const explicitSelection = selectedUuids !== null;
  const selected = new Set(Array.from(selectedUuids ?? [], String));
  const party = defaultParty ? primaryPartyGroup(actors) : null;
  const partyMemberUuids = new Set(characterMembers(party).map(actor => actor.uuid));
  const candidates = new Map();
  for (const actor of characterMembers(party)) candidates.set(actor.uuid, actor);
  for (const actor of Array.from(actors ?? []).filter(actor => actor.type === "character" && actor.hasPlayerOwner)) candidates.set(actor.uuid, actor);
  for (const actor of Array.from(actors ?? []).filter(actor => actor.type === "character" && selected.has(actor.uuid))) candidates.set(actor.uuid, actor);
  if (ownedOnly) for (const [uuid, actor] of candidates) if (!actor.isOwner) candidates.delete(uuid);
  return Array.from(candidates.values())
    .sort((left, right) => left.name.localeCompare(right.name))
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
