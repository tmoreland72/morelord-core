import test from "node:test";
import assert from "node:assert/strict";
import { renderPreservingScroll } from "../scripts/ui/scroll-preservation.js";

const panel = (key, top = 0, left = 0) => ({ dataset: key ? { mlScrollKey: key } : {}, tagName: "DIV", classList: ["panel"], scrollTop: top, scrollLeft: left });
const root = elements => ({ isConnected: true, querySelectorAll: () => elements });

test("Core restores keyed panels after reorder and remembers a temporarily absent tab", async () => {
  const positions = new Map();
  const app = { element: root([panel("buy", 120, 9), panel("sell", 45)]) };
  const buy = panel("buy");
  await renderPreservingScroll(app, () => { app.element = root([buy]); return "rendered"; }, { positions });
  assert.equal(buy.scrollTop, 120);
  assert.equal(buy.scrollLeft, 9);
  const sell = panel("sell");
  await renderPreservingScroll(app, () => { app.element = root([sell, panel("buy")]); }, { positions });
  assert.equal(sell.scrollTop, 45);
});

test("phase reset clears saved offsets and resets newly rendered panels", async () => {
  const positions = new Map();
  const app = { element: root([panel("old", 50)]) };
  const next = panel("next", 100, 20);
  await renderPreservingScroll(app, () => { app.element = root([next]); }, { positions, reset: true });
  assert.equal(next.scrollTop, 0);
  assert.equal(next.scrollLeft, 0);
});

test("wildcard capture retains nested positions without confusing repeated element signatures", async () => {
  const app = { element: root([panel(null), panel(null, 70, 12)]) };
  const replacements = [panel(null), panel(null)];
  await renderPreservingScroll(app, () => { app.element = root(replacements); }, { selector: "*" });
  assert.equal(replacements[0].scrollTop, 0);
  assert.equal(replacements[1].scrollTop, 70);
  assert.equal(replacements[1].scrollLeft, 12);
});

test("deferred restoration ignores a superseded render on the same root", async t => {
  const frames = [];
  const previous = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = callback => frames.push(callback);
  t.after(() => { if (previous) globalThis.requestAnimationFrame = previous; else delete globalThis.requestAnimationFrame; });
  const element = panel("page", 60);
  const app = { element: root([element]) };
  await renderPreservingScroll(app, () => {}, { deferred: true });
  element.scrollTop = 100;
  await renderPreservingScroll(app, () => {});
  while (frames.length) frames.shift()();
  assert.equal(element.scrollTop, 100);
});

test("failed renders propagate their error without restoring stale DOM", async () => {
  const element = panel("page", 5);
  const app = { element: root([element]) };
  await assert.rejects(renderPreservingScroll(app, () => { element.scrollTop = 10; throw new Error("failed"); }), /failed/);
  assert.equal(element.scrollTop, 10);
});
