import { assert } from './in-game.js';

export const tokenDistanceCheck = {
  id: 'core.token-distance',
  async run() {
    assert(game.user.isGM && canvas.ready, 'Run as GM with an active scene in Dev1.');
    const selected = [...canvas.tokens.controlled];
    const enabled = game.settings.get('morelord-core', 'tokenDistanceIndicator');
    const scene = canvas.scene;
    let fixtures = [];
    try {
      await game.settings.set('morelord-core', 'tokenDistanceIndicator', true);
      fixtures = await scene.createEmbeddedDocuments('Token', [
        {name: 'Distance test source', x: scene.dimensions.sceneX + 100, y: scene.dimensions.sceneY + 100},
        {name: 'Distance test target', x: scene.dimensions.sceneX + 100 + scene.grid.size * 3, y: scene.dimensions.sceneY + 100}
      ]);
      await new Promise(resolve => setTimeout(resolve, 300));
      const [source, target] = fixtures.map(doc => canvas.tokens.get(doc.id));
      assert(source && target, 'Fixture tokens must be drawn.');
      source.control({releaseOthers: true});
      target._onHoverIn({buttons: 0});
      const badge = () => document.querySelector('.ml-core-token-distance .ml-badge');
      const distance = Math.max(5, Math.ceil((canvas.grid.measurePath([source.center, target.center]).distance - 1e-8) / 5) * 5);
      const expected = `${new Intl.NumberFormat(game.i18n.lang, {maximumFractionDigits: 2}).format(distance)} ${scene.grid.units ?? ''}`.trim();
      assert(badge()?.textContent === expected, 'Hover must display the native scene distance and units.');
      assert(getComputedStyle(badge()).getPropertyValue('--ml-color-info').trim(), 'Core badge tokens must load.');
      for (const width of [0.5, 1, 2, 3, 4]) {
        await source.document.update({width, height: width}, {animate: false});
        await target.document.update({x: source.document.x + scene.grid.size * width, y: source.document.y}, {animate: false});
        await new Promise(resolve => setTimeout(resolve, 100));
        assert(badge()?.textContent === `5 ${scene.grid.units ?? ''}`.trim(), `Adjacent tokens of size ${width} must show 5.`);
        await target.document.update({x: source.document.x + scene.grid.size * (width + 1)}, {animate: false});
        await new Promise(resolve => setTimeout(resolve, 100));
        assert(badge()?.textContent === `10 ${scene.grid.units ?? ''}`.trim(), `One-square gap at size ${width} must show 10.`);
      }
      target._onHoverOut({});
      assert(!badge(), 'Leaving the target must clear the indicator.');
      target._onHoverIn({buttons: 0});
      await game.settings.set('morelord-core', 'tokenDistanceIndicator', false);
      assert(!badge(), 'Disabling the feature must clear a pending hover immediately.');
      await game.settings.set('morelord-core', 'tokenDistanceIndicator', true);
      assert(badge(), 'Enabling the feature must restore a pending hover.');
      source.release();
      assert(!badge(), 'GM without a selection must see no distance.');
      source.control({releaseOthers: true});
      target.control({releaseOthers: false});
      assert(!badge(), 'Multiple selections must not choose an arbitrary source.');
    } finally {
      for (const doc of fixtures) canvas.tokens.get(doc.id)?._onHoverOut({});
      await scene.deleteEmbeddedDocuments('Token', fixtures.map(doc => doc.id));
      for (const token of selected) token.control({releaseOthers: false});
      await game.settings.set('morelord-core', 'tokenDistanceIndicator', enabled);
    }
  }
};
