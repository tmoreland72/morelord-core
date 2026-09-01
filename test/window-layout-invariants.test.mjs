import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Morelord windows retain outer scrolling and visible bottom breathing room", async () => {
  const css = await readFile(new URL("../styles/morelord-primitives.css", import.meta.url), "utf8");
  assert.match(css, /\.ml-window \.window-content\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /scroll-padding-block-end:\s*var\(--ml-space-5\)/);
  assert.match(css, /\.ml-window \.window-content > \.ml-app-shell::after\s*\{[^}]*min-height:\s*var\(--ml-space-5\)/s);
});
