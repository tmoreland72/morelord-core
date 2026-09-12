import test from "node:test";
import assert from "node:assert/strict";
import { actorIdentity, decorateActorSelect } from "../scripts/ui/actor-identity.js";

test("actor identities escape names and image attributes and retain a saved portrait", () => {
  const html = actorIdentity({ name: '<A & B>', img: 'portraits/hero" onerror="bad.webp' });
  assert.ok(html.includes('&lt;A &amp; B&gt;'));
  assert.ok(html.includes('src="portraits/hero&quot; onerror=&quot;bad.webp"'));
  assert.ok(html.includes('alt=""'));
});

test("ID-valued actor selects resolve portraits without changing stored values", () => {
  const previous = globalThis.fromUuidSync;
  const resolved = [];
  const preview = { hasAttribute: () => true, querySelector: () => null };
  const select = { value: "hero", selectedOptions: [{ textContent: "Hero" }], nextElementSibling: preview };
  try {
    globalThis.fromUuidSync = uuid => { resolved.push(uuid); return { img: "hero.webp" }; };
    decorateActorSelect(select, id => `Actor.${id}`);
    assert.deepEqual(resolved, ["Actor.hero"]);
    assert.equal(select.value, "hero");
    assert.match(preview.innerHTML, /hero.webp/);
    select.value = "";
    decorateActorSelect(select);
    assert.equal(preview.hidden, true);
    assert.equal(preview.innerHTML, "");
  } finally { globalThis.fromUuidSync = previous; }
});

test("actor identities resolve current portraits and fall back for deleted actors", () => {
  const prior = globalThis.fromUuidSync;
  try {
    globalThis.fromUuidSync = () => ({ name: 'Current name', img: 'portraits/hero.webp' });
    assert.ok(actorIdentity({ actorUuid: 'Actor.a' }).includes('portraits/hero.webp'));
    globalThis.fromUuidSync = () => { throw new Error('Deleted'); };
    const html = actorIdentity({ actorUuid: 'Actor.a', actorName: 'Saved name' });
    assert.ok(html.includes('icons/svg/mystery-man.svg'));
    assert.ok(html.includes('Saved name'));
  } finally { globalThis.fromUuidSync = prior; }
});
