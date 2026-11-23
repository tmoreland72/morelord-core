export const PERFORMANCE_PRESETS = Object.freeze([
  {value: 'low', label: 'Low', icon: 'fa-gauge-simple', description: 'Older laptops and computers that struggle with busy scenes.', mode: 'LOW', fps: 10, scaling: false},
  {value: 'balanced', label: 'Balanced', icon: 'fa-laptop', description: 'Everyday computers: moderate graphics and frame rate.', mode: 'MED', fps: 30, scaling: true},
  {value: 'high', label: 'High', icon: 'fa-display', description: 'Gaming computers: maximum graphics, resolution, and frame rate.', mode: 'MAX', fps: 60, scaling: true}
]);

export function presetSettings(value, modes = CONST.CANVAS_PERFORMANCE_MODES) {
  const preset = PERFORMANCE_PRESETS.find(entry => entry.value === value);
  if (!preset || !Number.isInteger(modes[preset.mode])) throw new Error('Choose a supported performance preset.');
  const low = value === 'low';
  return {performanceMode: modes[preset.mode], maxFPS: preset.fps, pixelRatioResolutionScaling: preset.scaling,
    photosensitiveMode: low, mipmap: !low, visionAnimation: !low, lightAnimation: !low};
}

/** Only explicitly selected presets write settings; later logins preserve manual tuning. */
export async function applyPerformancePreset(value, settings = game.settings, modes = CONST.CANVAS_PERFORMANCE_MODES, dice = globalThis.game?.modules?.get('dice-so-nice')?.active ? (globalThis.game.dice3d?.persistent ?? {}) : null) {
  const updates = Object.entries(presetSettings(value, modes));
  for (const [key] of updates) {
    if (settings.settings.get(`core.${key}`)?.scope !== 'client') throw new Error(`Personal performance setting unavailable: ${key}`);
  }
  const previous = new Map(updates.map(([key]) => [key, settings.get('core', key)]));
  if (dice && typeof dice.setVisibility !== 'function') throw new Error('Update Dice So Nice to a version supporting Dice visibility before applying this preset.');
  const previousDiceVisibility = dice ? (globalThis.game?.user?.getFlag('dice-so-nice', 'settings')?.visibility ?? 'all') : null;
  let diceAttempted = false;
  const written = [];
  try {
    for (const [key, next] of updates) {
      written.push(key);
      await settings.set('core', key, next);
    }
    if (dice) {
      diceAttempted = true;
      await dice.setVisibility({low: 'none', balanced: 'mine', high: 'all'}[value]);
    }
  } catch (error) {
    const rollback = await Promise.allSettled(written.reverse().map(key => settings.set('core', key, previous.get(key))));
    if (diceAttempted) rollback.push(...await Promise.allSettled([dice.setVisibility(previousDiceVisibility)]));
    if (rollback.some(result => result.status === 'rejected')) throw new Error('Performance settings could not be restored completely. Review Foundry graphics settings.', {cause: error});
    throw error;
  }
}
