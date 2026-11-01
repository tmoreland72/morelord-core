/**
 * Current-place lookup shared by Craftworks and Marketplace.
 * The viewed scene's location is resolved first.
 * An active Downtime session with a location id wins (`source: "downtime"`).
 * A session with a blank location id keeps that scene location (`source: "scene"`) and the session id.
 * On the Road is used only when that session and the viewed scene are both empty.
 * With no active session, the result is the viewed scene. `user` chooses that scene.
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
  const sceneId = sceneIdForUser(user, { localUserId, localSceneId });
  const sceneLocation = sceneId ? (forScene(sceneId) ?? null) : null;
  if (downtimeActive) {
    const active = activeSession(downtimeState);
    if (active) {
      const locationId = String(active.session.locationId ?? "").trim();
      if (locationId) {
        return { location: getLocation(locationId) ?? null, source: "downtime", sessionId: active.sessionId };
      }
      if (sceneLocation) return { location: sceneLocation, source: "scene", sessionId: active.sessionId };
      return { location: roadLocation(), source: "road", sessionId: active.sessionId };
    }
  }
  return { location: sceneLocation, source: sceneLocation ? "scene" : "none", sessionId: null };
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
