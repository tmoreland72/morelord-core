import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { confirm } from "../scripts/ui/confirm-dialog.js";

test("confirm opens a compact DialogV2 with equal Yes and No buttons", async () => {
  const calls = [];
  const dialog = {
    confirm: async config => {
      calls.push(config);
      return config.yes.label === "Delete";
    }
  };
  const accepted = await confirm({
    title: "Delete Morelord Location",
    content: "<p>Delete <strong>Phandalin</strong>?</p>",
    yesLabel: "Delete",
    noLabel: "No",
    danger: true
  }, dialog);
  assert.equal(accepted, true);
  const config = calls[0];
  assert.deepEqual(config.position, { width: 400, height: "auto" });
  assert.deepEqual(config.classes, ["ml-window", "ml-confirm-dialog", "ml-confirm-dialog--danger"]);
  assert.equal(config.window.title, "Delete Morelord Location");
  assert.equal(config.rejectClose, false);
  assert.equal(config.yes.label, "Delete");
  assert.equal(config.yes.default, false);
  assert.equal(config.no.label, "No");
  assert.equal(config.no.default, true);
  assert.match(config.content, /^<div><div class="ml-app ml-app-shell ml-dialog-shell">/);
  assert.match(config.content, /Delete <strong>Phandalin<\/strong>\?/);
  assert.equal(config.content.startsWith("<div class="), false);

  const declined = await confirm({ content: "<p>Keep it?</p>" }, dialog);
  assert.equal(declined, false);
  assert.deepEqual(calls[1].classes, ["ml-window", "ml-confirm-dialog"]);
  assert.equal(calls[1].yes.label, "Yes");
  assert.equal(calls[1].yes.default, true);
  assert.equal(calls[1].no.label, "No");
  assert.equal(calls[1].no.default, false);
  assert.equal(calls[1].window.title, "Confirm");

  const css = readFileSync(new URL("../styles/morelord-components.css", import.meta.url), "utf8");
  assert.match(css, /\.ml-window\.ml-confirm-dialog \{ height: auto; \}/);
  assert.match(css, /\.ml-window\.ml-confirm-dialog \.form-footer > button \{\s*flex: 1 1 0;/);
  assert.match(css, /\.ml-window\.ml-confirm-dialog--danger \.form-footer button\[data-action="yes"\]/);
});
