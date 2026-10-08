const MODULE_ID = 'morelord-core';

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

/** Client-only canvas readout; uses native measurement and Core's window/badge surfaces. */
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
  game.settings.register(MODULE_ID, 'tokenDistanceIndicator', {
    name: 'Token Distance Indicator', scope: 'client', config: true, type: Boolean, default: true,
    hint: 'Hover to measure from your character or selected token; GMs select one token first. Uses nearest spaces in 5-unit steps. Disable when using Hover Distance.',
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
  Hooks.once('ready', () => {
    document.addEventListener('pointermove', event => { pointer = {x: event.clientX, y: event.clientY}; if (target) update(); });
    window.addEventListener('blur', () => { target = null; clear(); });
    window.addEventListener('resize', update);
  });
}
