const MODULE_ID = 'morelord-core';
const TOKEN_DISTANCE_KEY = 'tokenDistanceIndicator';
const TOKEN_DISTANCE_ID = `${MODULE_ID}.${TOKEN_DISTANCE_KEY}`;

export function distanceSource(user, tokens) {
  const controlled = tokens.filter(token => token.controlled);
  if (controlled.length) return controlled.length === 1 && (user.isGM || controlled[0].isOwner) ? controlled[0] : null;
  if (user.isGM || !user.character) return null;
  const characters = tokens.filter(token => token.isOwner && token.actor?.id === user.character.id && token.visible);
  return characters.length === 1 ? characters[0] : null;
}

function nearestBoundsPoints(source, target, grid) {
  const inset = token => {
    const {x, y, width, height} = token.bounds;
    const dx = Math.min(width, grid.size) / 2, dy = Math.min(height, grid.size) / 2;
    return {left: x + dx, right: x + width - dx, top: y + dy, bottom: y + height - dy};
  };
  const a = inset(source), b = inset(target);
  const axis = (minA, maxA, minB, maxB) => maxA < minB ? [maxA, minB]
    : maxB < minA ? [minA, maxB] : [Math.max(minA, minB), Math.max(minA, minB)];
  const [ax, bx] = axis(a.left, a.right, b.left, b.right);
  const [ay, by] = axis(a.top, a.bottom, b.top, b.bottom);
  return [{x: ax, y: ay}, {x: bx, y: by}];
}

export function tokenDistance(source, target, grid, user) {
  if (!source || !target || source === target || !source.visible || !target.visible
    || (!user.isGM && (target.document.hidden || source.document.hidden))) return null;
  // Ignore elevation and walls: this is range between occupied spaces, not a movement route.
  const spaces = token => !grid.isGridless && token.document.getOccupiedGridSpaceOffsets?.({level: null});
  const from = spaces(source), to = spaces(target);
  let distance = Infinity;
  if (from?.length && to?.length) {
    // ponytail: pairwise occupied-space scan; cache footprints if very large tokens cause measurable lag.
    for (const a of from) for (const b of to) {
      distance = Math.min(distance, grid.measurePath([
        grid.getCenterPoint({i: a.i, j: a.j}), grid.getCenterPoint({i: b.i, j: b.j})
      ]).distance);
    }
  } else distance = grid.measurePath(nearestBoundsPoints(source, target, grid)).distance;
  return Number.isFinite(distance) ? Math.max(5, Math.ceil((distance - 1e-8) / 5) * 5) : null;
}

function readStoredBoolean(storage) {
  let raw;
  try { raw = storage?.getItem?.(TOKEN_DISTANCE_ID); }
  catch { return {stored: false}; }
  if (raw == null) return {stored: false};
  try {
    const value = JSON.parse(raw);
    return typeof value === 'boolean' ? {stored: true, value} : {stored: false};
  } catch { return {stored: false}; }
}

/** Old per-client values live in localStorage, or on Foundry's client settings backend. */
export function readLegacyClientTokenDistance(storage, clientBackend) {
  const local = readStoredBoolean(storage);
  if (local.stored) return local;
  if (!clientBackend || clientBackend === storage) return {stored: false};
  try {
    const doc = clientBackend.getSetting?.(TOKEN_DISTANCE_ID);
    if (doc && typeof doc.value === 'boolean') return {stored: true, value: doc.value};
  } catch { /* Fall through to a storage-shaped backend. */ }
  return readStoredBoolean(clientBackend);
}

export function tokenDistanceWorldStored(settings) {
  const world = settings?.storage?.get?.('world');
  if (!world) return false;
  try {
    if (typeof world.getSetting === 'function') return world.getSetting(TOKEN_DISTANCE_ID) != null;
  } catch { /* Fall through to a key scan. Document id is not the setting key. */ }
  const docs = typeof world.values === 'function' ? world.values() : world;
  for (const doc of docs ?? []) if (doc?.key === TOKEN_DISTANCE_ID) return true;
  return false;
}

/**
 * The world has one GM choice. A GM records a previous client value, or the default on,
 * the first time the world has no saved setting. Players never write it. A saved world
 * value is left alone. Each browser then drops its old client value.
 */
export function tokenDistanceMigration({worldStored, legacy, isGM}) {
  const clearLegacy = legacy?.stored === true;
  if (worldStored || isGM !== true) return {write: false, clearLegacy};
  if (legacy?.stored === true) return {write: true, value: legacy.value === true, clearLegacy};
  return {write: true, value: true, clearLegacy: false};
}

export async function migrateTokenDistanceSetting(settings, {storage, clientBackend, isGM} = {}) {
  const legacy = readLegacyClientTokenDistance(storage, clientBackend);
  const decision = tokenDistanceMigration({
    worldStored: tokenDistanceWorldStored(settings),
    legacy,
    isGM
  });
  if (decision.write) await settings.set(MODULE_ID, TOKEN_DISTANCE_KEY, decision.value);
  if (decision.clearLegacy) {
    try { storage?.removeItem?.(TOKEN_DISTANCE_ID); }
    catch { /* The world value remains authoritative. */ }
    try { clientBackend?.removeItem?.(TOKEN_DISTANCE_ID); }
    catch { /* Same key, if the client backend is storage-shaped. */ }
  }
  return decision;
}

/** Canvas readout on every client. The GM's world choice turns it on or off for the table. */
export function registerTokenDistance() {
  let target = null, readout = null;
  let pointer = {x: 0, y: 0};
  const clear = () => { readout?.remove(); readout = null; };
  const update = () => {
    const canvas = globalThis.canvas;
    if (!canvas?.ready || !game.settings.get(MODULE_ID, 'tokenDistanceIndicator')) return clear();
    const source = distanceSource(game.user, canvas.tokens.placeables);
    const distance = tokenDistance(source, target, canvas.grid, game.user);
    if (distance === null) return clear();
    if (!readout) {
      readout = document.createElement('div');
      readout.className = 'ml-window ml-core-token-distance';
      readout.setAttribute('role', 'tooltip');
      readout.innerHTML = '<div class="window-content"><span class="ml-badge" data-tone="info"></span></div>';
      document.body.append(readout);
    }
    readout.querySelector('.ml-badge').textContent = `${new Intl.NumberFormat(game.i18n.lang, {maximumFractionDigits: 2}).format(distance)} ${canvas.scene.grid.units ?? ''}`.trim();
    readout.style.left = `${Math.max(0, Math.min(pointer.x + 16, innerWidth - readout.offsetWidth - 8))}px`;
    readout.style.top = `${Math.max(0, Math.min(pointer.y + 16, innerHeight - readout.offsetHeight - 8))}px`;
  };
  game.settings.register(MODULE_ID, TOKEN_DISTANCE_KEY, {
    name: 'Token Distance Indicator',
    hint: 'Hover to measure from your character or selected token; GMs select one token first. The GM choice applies to everyone. Uses nearest spaces in 5-unit steps. Disable when using Hover Distance.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    restricted: true,
    onChange: update
  });
  Hooks.on('hoverToken', (token, hovered) => {
    if (hovered) target = token;
    else if (target === token) target = null;
    update();
  });
  for (const hook of ['controlToken', 'refreshToken', 'sightRefresh', 'canvasPan', 'updateUser', 'updateScene']) Hooks.on(hook, update);
  Hooks.on('deleteToken', document => { if (target?.document === document) target = null; update(); });
  Hooks.on('canvasTearDown', () => { target = null; clear(); });
  Hooks.once('ready', async () => {
    try {
      await migrateTokenDistanceSetting(game.settings, {
        storage: globalThis.localStorage,
        clientBackend: game.settings?.storage?.get?.('client'),
        isGM: game.user?.isGM === true
      });
    } catch (error) {
      console.error(`${MODULE_ID} | Token Distance Indicator`, error);
    }
    document.addEventListener('pointermove', event => { pointer = {x: event.clientX, y: event.clientY}; if (target) update(); });
    window.addEventListener('blur', () => { target = null; clear(); });
    window.addEventListener('resize', update);
  });
}
