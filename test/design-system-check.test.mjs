import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

test("design checks scan modules without styles and distinguish chat cards from applications", t => {
  const root = mkdtempSync(join(tmpdir(), "morelord-design-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const chat = join(root, "templates", "chat");
  mkdirSync(chat, { recursive: true });
  const card = join(chat, "result.hbs");
  writeFileSync(card, '<section class="ml-chat-card">Result</section>');
  const check = () => spawnSync(process.execPath, [fileURLToPath(new URL("../tools/check-design-system.mjs", import.meta.url)), root], { encoding: "utf8" });
  assert.equal(check().status, 0);
  writeFileSync(card, '<section>Result</section>');
  assert.match(check().stderr, /chat templates must use the ml-chat-card root/);
  writeFileSync(card, '<section class="ml-chat-card"><button class="ml-icon-button"><i></i></button></section>');
  assert.match(check().stderr, /requires an aria-label/);
});
