import test from "node:test";
import assert from "node:assert/strict";
import { collectModuleDiagnostics } from "../scripts/services/module-diagnostics.js";

test("optional module diagnostics preserve old consumers and isolate private errors", () => {
  const report = collectModuleDiagnostics([
    { id: "morelord-core", active: true, api: { getDiagnostics() { throw Error("recursive"); } } },
    { id: "morelord-craftworks", active: true, api: { getDiagnostics: () => ({ catalog: { materials: 725 } }) } },
    { id: "morelord-old", active: true },
    { id: "morelord-disabled", active: false, api: { getDiagnostics: () => "secret" } },
    { id: "third-party", active: true, api: { getDiagnostics: () => "secret" } },
    { id: "morelord-failed", active: true, api: { getDiagnostics() { throw Error("secret actor and token"); } } }
  ]);
  assert.deepEqual(report, {
    "morelord-craftworks": { catalog: { materials: 725 } },
    "morelord-failed": { unavailable: true, reason: "diagnostics-collection-failed" }
  });
});
