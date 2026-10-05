import { assert } from './in-game.js';
import { DocumentationApp } from '../documentation/documentation-app.js';

export const documentationGuideCheck = {
  id: 'morelord-core.actual-documentation',
  async run() {
    const original = window.open;
    const calls = [];
    window.open = (...args) => calls.push(args);
    try {
      const documentation = game.modules.get('morelord-core').api.ui.documentation;
      for (const id of ['morelord-core', 'morelord-craftworks', 'morelord-downtime', 'morelord-encounters', 'morelord-journeys', 'morelord-marketplace']) {
        documentation.open(id);
        assert(calls.at(-1)[0] === `https://morelordgaming.com/docs/${id}`, `${id} opens its website documentation.`);
        assert(calls.at(-1)[1] === '_blank', 'Documentation opens a new browser tab.');
        new DocumentationApp({ productId: id }).render({ force: true });
        assert(calls.at(-1)[0] === `https://morelordgaming.com/docs/${id}`, 'Direct callers use the same link.');
      }
    } finally { window.open = original; }
  }
};
