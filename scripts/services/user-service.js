export const IGNORED_USERS_SETTING = "ignoredUserIds";

export function isIgnored(user) {
  const id = typeof user === "string" ? user : user?.id;
  const settings = globalThis.game?.settings;
  if (!id || !settings?.settings?.has(`morelord-core.${IGNORED_USERS_SETTING}`)) return false;
  return (settings.get("morelord-core", IGNORED_USERS_SETTING) ?? []).includes(id);
}

export function listUsers(users = globalThis.game?.users) {
  return Array.from(users ?? []).filter(user => user && !isIgnored(user));
}

export function activePlayerForActor(actor, { users = globalThis.game?.users } = {}) {
  if (!actor) return null;
  const players = listUsers(users).filter(user => user.active && !user.isGM);
  return players.find(user => user.character?.uuid === actor.uuid)
    ?? players.find(user => actor.testUserPermission?.(user, "OWNER"))
    ?? null;
}
