import test from 'node:test';
import assert from 'node:assert/strict';
import { openItemPreview } from '../scripts/ui/item-preview.js';

test('restricted source opens a transient read-only Observer preview without changing ownership', async () => {
  const source = { _id: 'source', folder: 'private', name: 'Example Item', ownership: { default: 0 }, system: { description: { value: 'Public description' } } };
  let data, options;
  globalThis.game = { user: { id: 'player' } };
  globalThis.CONST = { DOCUMENT_OWNERSHIP_LEVELS: { NONE: 0, OBSERVER: 2 } };
  globalThis.CONFIG = { Item: { documentClass: class { constructor(value) { data = value; this.sheet = { render: value => { options = value; } }; } } } };
  await openItemPreview({ documentName: 'Item', testUserPermission: () => false, toObject: () => structuredClone(source) });
  assert.deepEqual(data.ownership, { default: 0, player: 2 });
  assert.equal(data._id, undefined); assert.equal(data.folder, undefined);
  assert.deepEqual(options, { force: true, editable: false });
  assert.deepEqual(source.ownership, { default: 0 });
  let rendered = false;
  await openItemPreview({ documentName: 'Item', testUserPermission: () => true, sheet: { render: () => { rendered = true; } } });
  assert(rendered);
  await assert.rejects(openItemPreview(null), /no longer available/);
});
