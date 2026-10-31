import test from "node:test";
import assert from "node:assert/strict";
import { DocumentationService } from "../scripts/documentation/documentation-service.js";
import { DocumentationApp } from "../scripts/documentation/documentation-app.js";

test('Documentation entry points open the corresponding website in a new tab', () => {
  const previous = globalThis.window;
  const calls = [];
  globalThis.window = { open: (...args) => calls.push(args) };
  try {
    const service = new DocumentationService();
    DocumentationApp.configure(service);
    for (const id of ['morelord-character-export', 'morelord-core', 'morelord-craftworks', 'morelord-downtime', 'morelord-encounters', 'morelord-journeys', 'morelord-marketplace']) {
      new DocumentationApp({ productId: id }).render({ force: true });
      assert.deepEqual(calls.at(-1), [`https://morelordgaming.com/docs/${id}`, '_blank', 'noopener,noreferrer']);
    }
    service.open('morelord-game-master');
    assert.equal(calls.at(-1)[0], 'https://morelordgaming.com/docs');
    service.open('../../untrusted');
    assert.equal(calls.at(-1)[0], 'https://morelordgaming.com/docs');
    service.open('morelord-core', 'locations');
    assert.deepEqual(calls.at(-1), ['https://morelordgaming.com/docs/morelord-core#locations', '_blank', 'noopener,noreferrer']);
    service.open('morelord-core', '../locations');
    assert.equal(calls.at(-1)[0], 'https://morelordgaming.com/docs/morelord-core');
  } finally { globalThis.window = previous; }
});

test("product documentation registers, lists, and returns defensive copies", () => {
  const service = new DocumentationService();
  service.register({ id: "morelord-test", title: "Test", sections: [{ id: "purpose", title: "Purpose" }] });
  const product = service.get("morelord-test");
  product.sections[0].title = "Changed";
  assert.equal(service.get("morelord-test").sections[0].title, "Purpose");
  assert.deepEqual(service.list().map(entry => entry.id), ["morelord-test"]);
  service.register({ id: 'guide', source: { gm: 'modules/guide/docs/gm.md', player: 'modules/guide/docs/player.md' } });
  assert.equal(service.get('guide').source.player, 'modules/guide/docs/player.md');
  assert.throws(() => service.register({ id: 'empty' }), /requires a guide source/);
});
