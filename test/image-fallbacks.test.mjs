import test from "node:test";
import assert from "node:assert/strict";
import { activateImageFallbacks } from "../scripts/ui/image-fallbacks.js";

test("image fallback repairs already-failed and later-failed images without retry loops", () => {
  const image = complete => ({ complete, naturalWidth: 0, src: "missing.webp", dataset: { mlImageFallback: "icons/svg/item-bag.svg" }, listeners: [],
    addEventListener(name, handler, options) { this.listeners.push({ name, handler, options }); },
    getAttribute() { return this.src; }, setAttribute(_name, value) { this.src = value; } });
  const first = image(true), later = image(false);
  const root = { querySelectorAll: () => [first, later] };
  activateImageFallbacks(root);
  assert.equal(first.src, first.dataset.mlImageFallback);
  assert.equal(later.src, "missing.webp");
  later.listeners[0].handler();
  assert.equal(later.src, later.dataset.mlImageFallback);
  assert.equal(later.listeners[0].options.once, true);
  activateImageFallbacks(root);
  assert.equal(later.listeners.length, 1);
});
