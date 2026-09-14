import test from "node:test";
import assert from "node:assert/strict";
import { exportSettings, importSettings } from "../scripts/services/settings-transfer.js";

test("settings round trip skips missing modules and protects records, validates before writing, and restores failures", async () => {
  const definitions = [
    ["morelord-core", "shareUsageStatistics", Boolean, true],
    ["morelord-core", "installationToken", String, "secret"],
    ["morelord-core", "locations", Object, {}],
    ["morelord-marketplace", "buyRate", Number, 1],
    ["morelord-marketplace", "shops", Array, []],
    ["morelord-journeys", "dcConfiguration", Object, { pressOn: 12 }],
    ["morelord-journeys", "activeJourney", Object, {}],
    ["morelord-craftworks", "recipePackEnabled_test", Boolean, true],
    ["morelord-encounters", "defaultPartyUuids", Object, ["Actor.a"]]
  ].map(([namespace, key, type, value]) => ({ namespace, key, type, default: value }));
  const values = new Map(definitions.map(s => [s.namespace + "." + s.key, structuredClone(s.default)]));
  const writes = []; let fail = false;
  globalThis.game = {
    user: { isGM: true },
    modules: new Map(definitions.map(s => [s.namespace, { active: true }])),
    settings: {
      settings: new Map(definitions.map(s => [s.namespace + "." + s.key, s])),
      get: (n, k) => values.get(n + "." + k),
      set: async (n, k, v) => { if (fail && k === "buyRate") { fail = false; throw Error("write failed"); } writes.push(k); values.set(n + "." + k, v); }
    }
  };
  try {
    const file = exportSettings();
    assert.equal(file.modules["morelord-core"].installationToken, undefined);
    assert.equal(file.modules["morelord-core"].locations, undefined);
    assert.equal(file.modules["morelord-marketplace"].shops, undefined);
    assert.equal(file.modules["morelord-journeys"].activeJourney, undefined);
    file.modules["morelord-core"].shareUsageStatistics = false;
    file.modules["morelord-marketplace"].buyRate = 2;
    file.modules["morelord-missing"] = null;
    file.modules["morelord-core"].installationToken = "overwrite";
    const result = await importSettings(JSON.parse(JSON.stringify(file)));
    assert.equal(result.skipped, 2);
    assert.equal(values.get("morelord-core.installationToken"), "secret");
    assert.equal(values.get("morelord-marketplace.buyRate"), 2);
    assert.deepEqual(exportSettings().modules["morelord-encounters"].defaultPartyUuids, ["Actor.a"]);
    writes.length = 0;
    file.modules["morelord-marketplace"].buyRate = 0;
    await assert.rejects(importSettings(file), /at least 1/);
    assert.equal(writes.length, 0);
    file.modules["morelord-marketplace"].buyRate = 3;
    file.modules["morelord-core"].shareUsageStatistics = true;
    fail = true;
    await assert.rejects(importSettings(file), /Previous settings restored/);
    assert.equal(values.get("morelord-core.shareUsageStatistics"), false);
    assert.equal(values.get("morelord-marketplace.buyRate"), 2);
    game.modules.get("morelord-marketplace").active = false;
    await importSettings(file);
    assert.equal(values.get("morelord-marketplace.buyRate"), 2);
    await assert.rejects(importSettings({}), /supported/);
    game.user.isGM = false;
    assert.throws(exportSettings, /Only a GM/);
    await assert.rejects(importSettings(file), /Only a GM/);
  } finally { delete globalThis.game; }
});
