import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function loadHelpers() {
  const source = readFileSync(new URL("../scripts/main.js", import.meta.url), "utf8");
  const start = source.indexOf("function approvalPageUrl");
  const end = source.indexOf("async function beginActivation");
  assert.ok(start >= 0 && end > start, "activation helpers must stay beside beginActivation");
  return new Function(`${source.slice(start, end)}\nreturn { approvalPageUrl, copyPlainText };`)();
}

test("approval link uses the same http(s) address window.open receives", () => {
  const { approvalPageUrl } = loadHelpers();
  const url = "https://morelordgaming.com/account/foundry?code=ABCD-1234";
  assert.equal(approvalPageUrl(url), url);
  assert.equal(approvalPageUrl("http://localhost:3000/approve"), "http://localhost:3000/approve");
  assert.equal(approvalPageUrl("javascript:alert(1)"), "");
  assert.equal(approvalPageUrl("  https://morelordgaming.com"), "");
  assert.equal(approvalPageUrl(undefined), "");
});

test("activation code copy uses the clipboard and falls back to a selected textarea", async () => {
  const { copyPlainText } = loadHelpers();
  const clipboard = [];
  const secure = {
    navigator: { clipboard: { async writeText(value) { clipboard.push(value); } } },
    document: { body: {}, createElement() { throw new Error("fallback unused"); }, execCommand() { return false; } }
  };
  assert.equal(await copyPlainText("ABCD-1234", secure), true);
  assert.deepEqual(clipboard, ["ABCD-1234"]);

  let selected = "";
  let removed = false;
  const area = {
    value: "",
    style: {},
    setAttribute() {},
    focus() {},
    select() { selected = this.value; },
    remove() { removed = true; }
  };
  const denied = {
    navigator: { clipboard: { writeText: async () => { throw new Error("denied"); } } },
    document: {
      body: { appendChild() {} },
      createElement() { return area; },
      execCommand(command) { return command === "copy" && selected === "ABCD-1234"; }
    }
  };
  assert.equal(await copyPlainText("ABCD-1234", denied), true);
  assert.equal(removed, true);

  const missingClipboard = {
    navigator: {},
    document: denied.document
  };
  removed = false;
  assert.equal(await copyPlainText("ABCD-1234", missingClipboard), true);
  assert.equal(await copyPlainText("ABCD-1234", { navigator: {}, document: null }), false);
});

test("pending connection window shows the code, copy action, and approval link", () => {
  const template = readFileSync(new URL("../templates/connection.hbs", import.meta.url), "utf8");
  const source = readFileSync(new URL("../scripts/main.js", import.meta.url), "utf8");
  const activationStart = template.indexOf("{{#if activation}}");
  const pending = template.slice(activationStart, template.indexOf("{{else}}", activationStart));
  const codeAt = pending.indexOf('class="ml-core-account__code"');
  const stepsAt = pending.indexOf("ml-core-account__steps");
  assert.ok(codeAt >= 0 && stepsAt > codeAt);
  assert.match(pending, /It should already be filled in on that page; if not, paste it\./);
  assert.doesNotMatch(template, /prefilled|Reopen Approval Page/);
  assert.match(pending, /data-action="copyActivationCode"/);
  assert.match(pending, /<button type="button" data-action="copyActivationCode">/);
  assert.match(pending, /href="\{\{approvalPageUrl\}\}" target="_blank" rel="noopener noreferrer"/);
  assert.match(pending, /Open approval page/);
  assert.match(source, /copyActivationCode: MorelordConnectionApp\.copyActivationCode/);
  assert.match(source, /window\.open\(result\.verificationUrl, "_blank", "noopener,noreferrer"\)/);
  assert.match(source, /approvalPageUrl\(this\.activation\?\.verificationUrl\)/);
});
