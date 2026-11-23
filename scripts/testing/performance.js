import {assert} from './in-game.js';
import {PerformanceApp} from '../ui/performance-app.js';
import {presetSettings, applyPerformancePreset} from '../services/performance-presets.js';

export const performanceMenuCheck = {
  id: 'core.personal-performance-settings-menu',
  async run() {
    assert(game.world.id === 'dev1', 'Performance menu checks require Dev1.');
    const seen = game.settings.get('morelord-core', 'performancePromptSeen');
    const menu = game.settings.menus.get('morelord-core.performance');
    assert(menu?.restricted === false, 'Performance menu is available to players.');
    const settings = new game.settings.sheet.constructor();
    let app;
    const waitFor = async predicate => {
      for (let i = 0; i < 200; i++) {
        if (predicate()) return;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      assert(false, 'Settings menu did not finish opening Performance Setup.');
    };
    try {
      await settings.render({force: true});
      const category = settings.element.querySelector('[data-action="tab"][data-tab="morelord-core"]');
      assert(category, 'Morelord Core is listed in Configure Settings.');
      category.click();
      const button = settings.element.querySelector('[data-key="morelord-core.performance"]');
      assert(button?.textContent.includes('Open Performance Setup') && !button.disabled && button.getClientRects().length, 'Open Performance Setup is visible and enabled.');
      for (let repeat = 0; repeat < 2; repeat++) {
        button.click();
        await waitFor(() => {
          app = foundry.applications.instances.get('morelord-core-performance');
          return app?.rendered && app.element.querySelectorAll('[name="preset"]').length === 3;
        });
        assert(app.element.classList.contains('ml-window'), 'Menu opens the shared Core window.');
        await app.close();
        await waitFor(() => game.settings.get('morelord-core', 'performancePromptSeen'));
      }
    } finally {
      if (app?.rendered) await app.close();
      await settings.close();
      await game.settings.set('morelord-core', 'performancePromptSeen', seen);
    }
  }
};

export const performanceCheck = {
  id: 'core.personal-performance',
  async run() {
    assert(game.world.id === 'dev1', 'Performance checks require Dev1.');
    const keys = Object.keys(presetSettings('low'));
    const saved = keys.map(key => [key, game.settings.get('core', key)]);
    const personal = ['performancePreset', 'performancePromptSeen'].map(key => [key, game.settings.get('morelord-core', key)]);
    const dice = game.modules.get('dice-so-nice')?.active ? game.dice3d?.persistent : null;
    const diceSettings = dice ? structuredClone(game.user.getFlag('dice-so-nice', 'settings') ?? {}) : {};
    const SettingsConfig = foundry.applications.settings.SettingsConfig;
    const reloadConfirm = SettingsConfig.reloadConfirm;
    // Native Dice So Nice asks for a reload across Hide all; tests defer it and restore preferences.
    if (dice) SettingsConfig.reloadConfirm = async () => {};
    let app;
    try {
      await game.settings.set('morelord-core', 'performancePreset', '');
      app = new PerformanceApp();
      await app.render({force: true});
      assert(app.element.isConnected && app.element.querySelectorAll('[name="preset"]').length === 3, 'Performance window finished rendering without a competing startup offer.');
      assert(app.element.querySelector('[type="submit"]').disabled, 'A choice is required.');
      const documentation = app.element.querySelector('.ml-hero [data-action="openDocumentation"]');
      assert(documentation?.textContent.includes('Documentation'), 'Standard header Documentation button is available.');
      const open = window.open;
      let target;
      try {
        window.open = (...args) => {target = args;};
        documentation.click();
        const url = new URL(target?.[0]);
        assert(url.origin === 'https://morelordgaming.com' && url.pathname === '/docs/morelord-core' && url.hash === '#personal-performance' && target[1] === '_blank', 'Documentation opens the performance section in a new tab.');
        game.modules.get('morelord-core').api.ui.documentation.open('morelord-core', 'locations');
        assert(new URL(target[0]).hash === '#locations', 'Existing Locations documentation consumer preserves its section too.');
      } finally {window.open = open;}
      const low = app.element.querySelector('[value="low"]');
      low.click();
      assert(!app.element.querySelector('[type="submit"]').disabled, 'Native choice enables Apply.');
      for (const width of [580, 360]) {
        app.setPosition({width});
        await new Promise(resolve => requestAnimationFrame(resolve));
        const content = app.element.querySelector('.window-content');
        assert(content.scrollWidth <= content.clientWidth + 1, `No overflow at ${width}px.`);
        assert(content.querySelector(':scope > .ml-form-footer'), 'Footer is outside scrolling body.');
      }
      await PerformanceApp.save.call(app, null, app.element);
      for (const [key, value] of Object.entries(presetSettings('low'))) assert(game.settings.get('core', key) === value, `${key} applied.`);
      if (dice) assert(game.user.getFlag('dice-so-nice', 'settings').visibility === 'none', 'Low hides all Dice So Nice rolls.');
      assert(game.settings.get('morelord-core', 'performancePromptSeen'), 'Dismissal remembered.');
      app = new PerformanceApp();
      await app.render({force: true});
      assert(app.element.querySelector('[value="low"]').checked, 'Saved choice is selected.');
      app.element.querySelector('[value="high"]').click();
      await PerformanceApp.skip.call(app);
      assert(game.settings.get('core', 'maxFPS') === 10, 'Keep My Settings does not apply selection.');
      for (const [preset, visibility] of [['balanced', 'mine'], ['high', 'all']]) {
        await applyPerformancePreset(preset);
        for (const [key, value] of Object.entries(presetSettings(preset))) assert(game.settings.get('core', key) === value, `${preset}: ${key} applied.`);
        if (dice) assert(game.user.getFlag('dice-so-nice', 'settings').visibility === visibility, `${preset}: Dice So Nice visibility applied.`);
      }
      if (dice) {
        const {visibility, ...other} = game.user.getFlag('dice-so-nice', 'settings');
        const {visibility: originalVisibility, ...originalOther} = diceSettings;
        assert(JSON.stringify(other) === JSON.stringify(originalOther), 'Other Dice So Nice preferences are preserved.');
      }
    } finally {
      if (app?.rendered) await app.close();
      for (const [key, value] of saved) await game.settings.set('core', key, value);
      for (const [key, value] of personal) await game.settings.set('morelord-core', key, value);
      try {
        if (dice) {
          await dice.setVisibility(diceSettings.visibility ?? 'all');
          if (!Object.hasOwn(diceSettings, 'visibility')) await game.user.update({'flags.dice-so-nice.settings.-=visibility': null});
        }
      } finally {SettingsConfig.reloadConfirm = reloadConfirm;}
    }
  }
};
