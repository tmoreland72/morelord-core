import test from "node:test";
import assert from "node:assert/strict";
import { actorIdentity } from "../scripts/ui/actor-identity.js";

test("actor identities escape names and image attributes and retain a saved portrait", () => {
  const html = actorIdentity({ name: '<A & B>', img: 'portraits/hero" onerror="bad.webp' });
  assert.ok(html.includes('&lt;A &amp; B&gt;'));
  assert.ok(html.includes('src="portraits/hero&quot; onerror=&quot;bad.webp"'));
  assert.ok(html.includes('alt=""'));
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
