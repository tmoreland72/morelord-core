import test from "node:test";
import assert from "node:assert/strict";
import { activeLocationContext } from "../scripts/location/location-context.js";
import { LocationService } from "../scripts/location/location-service.js";

const keep = { id: "keep", name: "Keep", settlementType: "town", sceneIds: ["scene-keep"], capabilities: [{ type: "marketplace", tier: "rare" }] };
const camp = { id: "camp", name: "Camp", settlementType: "road", sceneIds: ["scene-camp"], capabilities: [] };

function context(overrides = {}) {
  return activeLocationContext({
    forScene: sceneId => (sceneId === "scene-keep" ? keep : sceneId === "scene-camp" ? camp : null),
    getLocation: id => (id === "keep" ? keep : null),
    localUserId: "user-gm",
    localSceneId: "scene-camp",
    ...overrides
  });
}

test("an active Downtime session location replaces the viewed scene", () => {
  const result = context({
    user: { id: "user-player", viewedScene: "scene-camp" },
    downtimeActive: true,
    downtimeState: { sessions: { week: { id: "week", status: "active", locationId: "keep" }, later: { id: "later", status: "upcoming", locationId: "camp" } } }
  });
  assert.equal(result.source, "downtime");
  assert.equal(result.sessionId, "week");
  assert.equal(result.location, keep);
});

test("a blank session location keeps the viewed scene, and On the Road is only both empty", () => {
  const phandalin = {
    id: "phandalin",
    name: "Phandalin",
    settlementType: "village",
    sceneIds: ["scene-phandalin"],
    capabilities: [{ type: "alchemist", tier: "common" }]
  };
  const scenes = [];
  const viewed = activeLocationContext({
    user: { id: "user-gm", viewedScene: "scene-phandalin" },
    localUserId: "user-gm",
    localSceneId: "scene-camp",
    forScene: sceneId => {
      scenes.push(sceneId);
      return sceneId === "scene-phandalin" ? phandalin : null;
    },
    getLocation: () => { throw new Error("a blank session location must not replace the scene"); },
    downtimeActive: true,
    downtimeState: { sessions: { week: { id: "week", status: "active", locationId: "" } } }
  });
  assert.deepEqual(scenes, ["scene-phandalin"]);
  assert.equal(viewed.source, "scene");
  assert.equal(viewed.sessionId, "week");
  assert.equal(viewed.location, phandalin);

  for (const locationId of [null, undefined, "   "]) {
    const blank = context({
      user: { id: "user-player", viewedScene: "scene-keep" },
      downtimeActive: true,
      downtimeState: { sessions: { travel: { id: "travel", status: "active", locationId } } }
    });
    assert.equal(blank.source, "scene", `locationId ${JSON.stringify(locationId)}`);
    assert.equal(blank.sessionId, "travel");
    assert.equal(blank.location, keep);
  }

  const road = context({
    user: { id: "user-player", viewedScene: "scene-empty" },
    downtimeActive: true,
    downtimeState: { sessions: { travel: { id: "travel", status: "active", locationId: "" } } }
  });
  assert.equal(road.source, "road");
  assert.equal(road.sessionId, "travel");
  assert.equal(road.location.name, "On the Road");
  assert.equal(road.location.metadata.virtual, true);
  assert.deepEqual(road.location.capabilities, []);

  const missing = context({
    user: { id: "user-player", viewedScene: "scene-keep" },
    downtimeActive: true,
    downtimeState: { sessions: { gone: { status: "active", locationId: "missing-place" } } }
  });
  assert.equal(missing.source, "downtime");
  assert.equal(missing.sessionId, "gone");
  assert.equal(missing.location, null);
});

test("without an active Downtime session the viewed scene is used, including for another user", () => {
  const viewed = context({ user: { id: "user-player", viewedScene: "scene-keep" }, downtimeActive: true, downtimeState: { sessions: {} } });
  assert.equal(viewed.source, "scene");
  assert.equal(viewed.location, keep);
  assert.equal(viewed.sessionId, null);

  const otherUser = context({ user: { id: "user-player" }, downtimeActive: false, downtimeState: { sessions: { week: { id: "week", status: "active", locationId: "keep" } } } });
  assert.deepEqual(otherUser, { location: null, source: "none", sessionId: null });

  const local = context({ user: { id: "user-gm" } });
  assert.equal(local.source, "scene");
  assert.equal(local.location, camp);

  const omitted = context({ user: null });
  assert.equal(omitted.location, camp);
  assert.equal(omitted.source, "scene");
});

test("location service uses the session while Downtime is active and the scene when it is not", () => {
  const locations = {
    keep: { ...keep },
    camp: { ...camp }
  };
  const downtimeState = { sessions: { week: { id: "week", status: "active", locationId: null } } };
  let downtimeActive = false;
  let downtimeThrows = false;
  globalThis.foundry = { utils: { deepClone: value => structuredClone(value) } };
  globalThis.canvas = { scene: { id: "scene-camp" } };
  globalThis.game = {
    user: { id: "user-gm", viewedScene: null },
    modules: { get: id => (id === "morelord-downtime" ? { active: downtimeActive } : null) },
    scenes: { current: { id: "scene-keep" } },
    settings: {
      get: (namespace, key) => {
        if (namespace === "morelord-core" && key === "locations") return locations;
        if (namespace === "morelord-downtime" && key === "projectState") {
          if (downtimeThrows) throw new Error("setting unavailable");
          return downtimeState;
        }
        return undefined;
      }
    }
  };
  try {
    const service = new LocationService({ moduleId: "morelord-core", settingKey: "locations" });
    const scene = service.activeContext({ id: "user-player", viewedScene: "scene-keep" });
    assert.equal(scene.source, "scene");
    assert.equal(scene.location.id, "keep");
    assert.notEqual(scene.location, locations.keep);

    downtimeActive = true;
    const duringSession = service.activeContext();
    assert.equal(duringSession.source, "scene");
    assert.equal(duringSession.sessionId, "week");
    assert.equal(duringSession.location.id, "camp");

    globalThis.canvas = { scene: { id: "scene-nowhere" } };
    const road = service.activeContext();
    assert.equal(road.source, "road");
    assert.equal(road.sessionId, "week");
    assert.equal(road.location.name, "On the Road");
    assert.equal(road.location.metadata.virtual, true);
    globalThis.canvas = { scene: { id: "scene-camp" } };

    downtimeState.sessions.week.locationId = "keep";
    const sessionPlace = service.activeContext({ id: "user-player", viewedScene: "scene-camp" });
    assert.equal(sessionPlace.source, "downtime");
    assert.equal(sessionPlace.location.name, "Keep");

    downtimeThrows = true;
    const recovered = service.activeContext({ id: "user-gm" });
    assert.equal(recovered.source, "scene");
    assert.equal(recovered.location.id, "camp");

    globalThis.canvas = { scene: null };
    const currentScene = service.activeContext({ id: "user-gm" });
    assert.equal(currentScene.source, "scene");
    assert.equal(currentScene.location.id, "keep");
  } finally {
    delete globalThis.game;
    delete globalThis.canvas;
    delete globalThis.foundry;
  }
});
