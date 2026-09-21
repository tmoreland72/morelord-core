import { test } from "node:test";
import assert from "node:assert/strict";
import { logLabel, logValue } from "../scripts/ui/log-formatting.js";

test("structured log fallback produces text and preserves false and zero", () => {
  assert.equal(logLabel("participantActorUuid"), "Participant Actor Uuid");
  assert.equal(logValue({ success: false, total: 0, result: { items: ["Rope", "Torch"] }, missing: null }),
    "Success: No; Total: 0; Result: Items: Rope; Torch; Missing: Not recorded");
  assert.equal(logValue([]), "None");
});
