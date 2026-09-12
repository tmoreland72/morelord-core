const latestRender = new WeakMap();

/** Preserve page and keyed panel positions, including panels temporarily hidden by a tab. */
export async function renderPreservingScroll(application, renderOperation, {
  selector = ".window-content, .ml-page-body, [data-ml-scroll-key]",
  positions = new Map(),
  reset = false,
  deferred = false
} = {}) {
  const renderToken = {};
  latestRender.set(application, renderToken);
  const entries = root => {
    const counts = new Map();
    const elements = Array.from(root?.querySelectorAll?.(selector) ?? []);
    if (root?.matches?.(selector)) elements.unshift(root);
    return elements.map(element => {
      const explicit = element.dataset?.mlScrollKey ?? element.dataset?.scrollKey;
      const signature = explicit ? `key:${explicit}` : element.id ? `id:${element.id}`
        : `${element.tagName}.${Array.from(element.classList ?? []).sort().join(".")}`;
      const ordinal = counts.get(signature) ?? 0;
      counts.set(signature, ordinal + 1);
      return { element, key: `${signature}:${ordinal}` };
    });
  };
  if (reset) positions.clear();
  for (const { element, key } of entries(application.element)) {
    // Wildcard consumers preserve nested overflow without retaining every DOM node.
    if (selector === "*" && !element.scrollTop && !element.scrollLeft) {
      const style = globalThis.getComputedStyle?.(element);
      if (!/auto|scroll/.test(`${style?.overflowX} ${style?.overflowY}`)) continue;
    }
    positions.set(key, { top: reset ? 0 : element.scrollTop, left: reset ? 0 : element.scrollLeft });
  }
  const result = await renderOperation();
  const root = application.element;
  const restore = () => {
    if (latestRender.get(application) !== renderToken || application.element !== root || root?.isConnected === false) return;
    for (const { element, key } of entries(root)) {
      const position = reset ? { top: 0, left: 0 } : positions.get(key);
      if (!position) continue;
      element.scrollTop = position.top;
      element.scrollLeft = position.left;
    }
  };
  restore();
  if (deferred && globalThis.requestAnimationFrame) {
    requestAnimationFrame(() => requestAnimationFrame(restore));
  }
  return result;
}
