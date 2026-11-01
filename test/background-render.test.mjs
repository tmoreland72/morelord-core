import test from "node:test";
import assert from "node:assert/strict";
import { guardApplicationRender, renderInBackground } from "../scripts/ui/background-render.js";

function trackedApplication() {
  const calls = [];
  class App {
    rendered = false;
    bringToFront() { calls.push("front"); }
    render(options = {}) {
      const force = options === true || options?.force === true;
      if (force || !this.rendered) this.bringToFront();
      this.rendered = true;
      return Promise.resolve().then(() => this);
    }
  }
  assert.equal(guardApplicationRender(App), true);
  assert.equal(guardApplicationRender(App), false);
  return { App, calls };
}

test("re-rendering an open window does not bring it to the front", async () => {
  const { App, calls } = trackedApplication();
  const open = new App();
  open.rendered = true;
  await open.render({ force: true });
  await open.render(true);
  assert.deepEqual(calls, []);
  await open.render({ force: true, focus: true });
  assert.deepEqual(calls, ["front"]);
  open.bringToFront();
  assert.deepEqual(calls, ["front", "front"]);
});

test("the first render of a closed window still comes forward", async () => {
  const { App, calls } = trackedApplication();
  const fresh = new App();
  await fresh.render({ force: true });
  assert.deepEqual(calls, ["front"]);
});

test("a background render passes force false and focus false and skips a closed window", async () => {
  const seen = [];
  const open = {
    rendered: true,
    render(options) { seen.push(options); return Promise.resolve("refreshed"); }
  };
  assert.equal(await renderInBackground(open, { parts: ["body"] }), "refreshed");
  assert.deepEqual(seen, [{ parts: ["body"], force: false, focus: false }]);
  const closed = { rendered: false, render() { throw new Error("should not render"); } };
  assert.equal(await renderInBackground(closed), closed);
});
