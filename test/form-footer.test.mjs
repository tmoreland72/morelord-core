import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}

test("ml-form-footer right-aligns natural-width actions and confirm stays equal width", () => {
  const css = read("styles/morelord-components.css");
  assert.match(css, /\.ml-form-footer,\s*\.ml-window \.ml-page-footer,\s*\.ml-window \.ml-form-footer,\s*\.ml-window:not\(\.ml-confirm-dialog\) \.form-footer \{[^}]*justify-content:\s*flex-end;[^}]*gap:\s*var\(--ml-space-2\);[^}]*border-top:\s*1px solid var\(--ml-color-border\);/s);
  assert.match(css, /\.ml-window :is\(\.ml-form-footer, \.ml-page-footer\) > button,\s*\.ml-window:not\(\.ml-confirm-dialog\) \.form-footer > button \{\s*flex:\s*0 0 auto;\s*width:\s*auto;/);
  assert.match(css, /\.ml-window\.ml-confirm-dialog \.form-footer > button \{\s*flex:\s*1 1 0;/);
  assert.doesNotMatch(css, /grid-auto-columns:\s*minmax\(0,\s*1fr\)/);

  for (const file of [
    "templates/location-manager.hbs",
    "templates/connection.hbs",
    "templates/ignored-users.hbs",
    "templates/settings-transfer.hbs",
    "templates/option-picker.hbs"
  ]) {
    assert.match(read(file), /class="[^"]*\bml-form-footer\b/, file);
  }
  assert.match(read("AGENTS.md"), /ml-form-footer/);
  assert.match(read("scripts/ui/page-layout.js"), /\.ml-form-footer, \.ml-page-footer/);
});
