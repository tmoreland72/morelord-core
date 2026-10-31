import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Morelord windows retain outer scrolling and visible bottom breathing room", async () => {
  const css = await readFile(new URL("../styles/morelord-primitives.css", import.meta.url), "utf8");
  assert.match(css, /\.ml-window \.window-content\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /scroll-padding-block-end:\s*var\(--ml-space-5\)/);
  assert.match(css, /\.ml-window \.window-content > \.ml-app-shell::after\s*\{[^}]*min-height:\s*var\(--ml-space-5\)/s);
  assert.match(css, /select optgroup\s*\{[^}]*background:\s*var\(--ml-color-window\);[^}]*color:\s*var\(--ml-color-accent\);[^}]*font-weight:\s*var\(--ml-font-weight-bold\);/s);
  assert.match(css, /select optgroup option\s*\{[^}]*background:\s*var\(--ml-color-window\);[^}]*color:\s*var\(--ml-color-text\);[^}]*font-weight:\s*var\(--ml-font-weight-normal\);/s);
  assert.match(css, /select option\s*\{[^}]*background:\s*var\(--ml-color-window\);[^}]*color:\s*var\(--ml-color-text\);[^}]*font-weight:\s*var\(--ml-font-weight-normal\);/s);
  const components = await readFile(new URL("../styles/morelord-components.css", import.meta.url), "utf8");
  assert.match(components, /:is\(\.ml-window \.window-content, \.ml-app, \.ml-chat-card\) \.ml-multi-select__heading\s*\{[^}]*background:\s*var\(--ml-color-window\);[^}]*color:\s*var\(--ml-color-accent\);[^}]*font-weight:\s*var\(--ml-font-weight-bold\);/s);
  assert.match(components, /\.ml-window \.window-content \.ml-multi-select__summary\s*\{[^}]*min-width:\s*0;[^}]*height:\s*var\(--ml-control-height\);[^}]*overflow:\s*hidden;/s);
  assert.match(components, /\.ml-multi-select__summary > span\s*\{[^}]*min-width:\s*0;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s);
  assert.match(components, /\.ml-multi-select__summary > i\s*\{[^}]*flex:\s*0 0 auto;/s);
  const coreCss = await readFile(new URL("../styles/morelord-core.css", import.meta.url), "utf8");
  assert.match(coreCss, /\.ml-location-manager__capability\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.2fr\)\s*minmax\(0,\s*1fr\)\s*minmax\(0,\s*1\.4fr\)\s*minmax\(0,\s*1\.2fr\)\s*auto;/s);
});
