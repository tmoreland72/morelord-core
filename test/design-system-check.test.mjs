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
  writeFileSync(card, '<section class="ml-chat-card">Result</section>');
  const settings = join(root, "templates", "example-settings.hbs");
  writeFileSync(settings, '<section class="ml-app ml-app-shell"><header class="ml-hero"><h2>Settings</h2></header></section>');
  assert.match(check().stderr, /complete Core hero/);
  assert.match(check().stderr, /Core page footer/);
  writeFileSync(settings, '<section class="ml-app ml-app-shell"><header class="ml-hero"><i class="ml-hero__icon"></i><div class="ml-hero__body"><h1>Settings</h1><p>Description</p></div></header><footer class="ml-page-footer ml-actions"><button>Save</button></footer></section>');
  assert.equal(check().status, 0);
});
