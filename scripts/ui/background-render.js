const GUARDED = Symbol("morelordBackgroundRender");
const suppressDepth = new WeakMap();
const nativeBringToFront = new WeakMap();

/**
 * Foundry v14 ApplicationRenderOptions documents force, isFirstRender, parts,
 * position, tab, and window. It does not document focus.
 * ApplicationV2#render still calls bringToFront when force is true, so a hook
 * that re-renders an open window with { force: true } puts that window in front.
 * render() with force omitted, or force false, refreshes a window that is already
 * in the DOM and leaves the stack alone.
 * focus: false is passed as well so an undocumented or later focus check stays off.
 * The guard below also ignores bringToFront during a re-render of an already open
 * window unless the caller passes focus: true.
 */
export const BACKGROUND_RENDER_OPTIONS = Object.freeze({ force: false, focus: false });

export function renderInBackground(application, options = {}) {
  if (!application?.rendered) return Promise.resolve(application ?? null);
  return application.render({ ...options, ...BACKGROUND_RENDER_OPTIONS });
}

function suppressBringToFront(application) {
  const depth = suppressDepth.get(application) ?? 0;
  if (depth === 0) {
    nativeBringToFront.set(application, application.bringToFront);
    application.bringToFront = function keepBehind() {};
  }
  suppressDepth.set(application, depth + 1);
}

function restoreBringToFront(application) {
  const depth = (suppressDepth.get(application) ?? 1) - 1;
  if (depth > 0) {
    suppressDepth.set(application, depth);
    return;
  }
  const original = nativeBringToFront.get(application);
  if (original) application.bringToFront = original;
  suppressDepth.delete(application);
  nativeBringToFront.delete(application);
}

export function guardApplicationRender(ApplicationV2) {
  const prototype = ApplicationV2?.prototype;
  if (typeof prototype?.render !== "function" || prototype.render[GUARDED]) return false;
  const original = prototype.render;
  function renderKeepingFocus(options = {}, legacy) {
    const normalized = typeof options === "boolean" ? { force: options } : (options ?? {});
    const raise = !this.rendered || normalized.focus === true;
    if (raise) return original.call(this, options, legacy);
    suppressBringToFront(this);
    try {
      const result = original.call(this, options, legacy);
      if (result && typeof result.finally === "function") return result.finally(() => restoreBringToFront(this));
      restoreBringToFront(this);
      return result;
    } catch (error) {
      restoreBringToFront(this);
      throw error;
    }
  }
  renderKeepingFocus[GUARDED] = true;
  prototype.render = renderKeepingFocus;
  return true;
}
