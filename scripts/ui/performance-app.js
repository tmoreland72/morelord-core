import { PERFORMANCE_PRESETS, applyPerformancePreset } from '../services/performance-presets.js';
import { createChoiceGroup } from './choice-group.js';
import { setDisabled } from './disabled-reason.js';

const MODULE_ID = 'morelord-core';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class PerformanceApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: 'morelord-core-performance', classes: ['ml-window'], tag: 'form',
    window: {title: 'Performance Setup', resizable: true},
    position: {width: 580},
    actions: {skip: PerformanceApp.skip, openDocumentation: PerformanceApp.openDocumentation},
    form: {closeOnSubmit: false, handler: PerformanceApp.save}
  };
  static PARTS = {content: {template: 'modules/morelord-core/templates/performance.hbs'}};

  async _prepareContext() {
    return {diceSoNice: Boolean(game.modules.get('dice-so-nice')?.active)};
  }

  _onRender() {
    const slot = this.element.querySelector('[data-performance-choices]');
    slot.replaceChildren(createChoiceGroup({name: 'preset', label: 'Choose a performance preset', value: game.settings.get(MODULE_ID, 'performancePreset'), choices: PERFORMANCE_PRESETS}));
    const submit = this.element.querySelector('[type="submit"]');
    const update = () => setDisabled(submit, this.element.querySelector('[name="preset"]:checked') ? '' : 'Choose a performance preset\nSelect a preset before applying settings.');
    slot.addEventListener('change', update);
    update();
  }

  async _onClose(options) {
    await super._onClose(options);
    await game.settings.set(MODULE_ID, 'performancePromptSeen', true);
  }

  static async skip() { await this.close(); }

  static openDocumentation(event) {
    event?.preventDefault();
    game.modules.get(MODULE_ID).api.ui.documentation.open(MODULE_ID, 'personal-performance');
  }

  static async save(event, form) {
    if (this.saving) return;
    const value = new FormData(form).get('preset');
    this.saving = true;
    const button = this.element.querySelector('[type="submit"]');
    setDisabled(button, 'Applying performance settings\nPlease wait.');
    try {
      await applyPerformancePreset(value);
      await game.settings.set(MODULE_ID, 'performancePreset', value);
      await this.close();
      ui.notifications.info('Performance settings applied. Reload Foundry when convenient to finish applying graphics changes.');
    } catch (error) { ui.notifications.error(error.message); }
    finally { this.saving = false; setDisabled(button, ''); }
  }
}

export function registerPerformanceSettings() {
  game.settings.register(MODULE_ID, 'promptPerformance', {
    name: 'Offer Performance Setup', hint: 'Show players the performance setup feature one time to automatically make game settings changes appropriate for their devices.',
    scope: 'world', restricted: true, config: true, type: Boolean, default: true
  });
  // Personal hardware choices are the player-facing exception to Core's world settings.
  game.settings.register(MODULE_ID, 'performancePromptSeen', {scope: 'client', config: false, type: Boolean, default: false});
  game.settings.register(MODULE_ID, 'performancePreset', {scope: 'client', config: false, type: String, default: ''});
  game.settings.registerMenu(MODULE_ID, 'performance', {
    name: 'Personal Performance', label: 'Open Performance Setup', icon: 'fa-solid fa-laptop',
    hint: 'Apply graphics settings for this browser.', type: PerformanceApp, restricted: false
  });
}

export function offerPerformanceSetup() {
  if (game.settings.get(MODULE_ID, 'promptPerformance') && !game.settings.get(MODULE_ID, 'performancePromptSeen')) {
    return new PerformanceApp().render({force: true});
  }
}
