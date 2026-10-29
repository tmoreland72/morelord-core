/**
 * Current-place lookup shared by Craftworks and Marketplace.
 * An active Downtime session wins. A session with no location is the virtual On the Road place.
 * Otherwise the result is the location for the scene that user is viewing.
 * Downtime keeps one active session for the world; `user` chooses the viewed scene when no session is active.
 */

export function roadLocation() {
  return {
    id: "road",
    name: "On the Road",
    settlementType: "road",
    sceneIds: [],
    capabilities: [],
    notes: "",
    metadata: { virtual: true }
  };
}

function sceneIdForUser(user, { localUserId = null, localSceneId = null } = {}) {
  if (user?.viewedScene) return String(user.viewedScene);
  const sameUser = user?.id && localUserId && String(user.id) === String(localUserId);
  if (sameUser || !user) return localSceneId ? String(localSceneId) : null;
  return null;
}

function activeSession(downtimeState) {
  const sessions = downtimeState?.sessions;
  if (!sessions || typeof sessions !== "object" || Array.isArray(sessions)) return null;
  const found = Object.entries(sessions).find(([, session]) => session?.status === "active");
  if (!found) return null;
  const [key, session] = found;
  return { session, sessionId: String(session.id ?? key) };
}

/**
 * @returns {{ location: object|null, source: "downtime"|"road"|"scene"|"none", sessionId: string|null }}
 */
export function activeLocationContext({
  user = null,
  localUserId = null,
  localSceneId = null,
  forScene = () => null,
  getLocation = () => null,
  downtimeActive = false,
  downtimeState = null
} = {}) {
  if (downtimeActive) {
    const active = activeSession(downtimeState);
    if (active) {
      const locationId = String(active.session.locationId ?? "").trim();
      if (!locationId) return { location: roadLocation(), source: "road", sessionId: active.sessionId };
      return { location: getLocation(locationId) ?? null, source: "downtime", sessionId: active.sessionId };
    }
  }
  const sceneId = sceneIdForUser(user, { localUserId, localSceneId });
  const location = sceneId ? (forScene(sceneId) ?? null) : null;
  return { location, source: location ? "scene" : "none", sessionId: null };
}

export function readDowntimeProjectState(game = globalThis.game) {
  try {
    const downtime = game?.modules?.get?.("morelord-downtime");
    if (!downtime?.active) return { downtimeActive: false, downtimeState: null };
    return { downtimeActive: true, downtimeState: game.settings.get("morelord-downtime", "projectState") };
  } catch {
    return { downtimeActive: false, downtimeState: null };
  }
}
