import { test } from "node:test";
import assert from "node:assert/strict";
import { runChecks } from "../scripts/testing/in-game.js";

test("in-game reports retain failures, skips, and continue to later asynchronous checks", async () => {
  let completed = false;
  const results = await runChecks([
    { id: "failure", async run() { throw new Error("render failed"); } },
    { id: "unavailable", skip: "GM required", run() { throw new Error("must not run"); } },
    { id: "later", async run() { await Promise.resolve(); completed = true; } }
  ]);
  assert.deepEqual(results.map(r => r.status), ["fail", "skip", "pass"]);
  assert.equal(results[0].reason, "render failed");
  assert.equal(results[1].reason, "GM required");
  assert.equal(completed, true);
});
