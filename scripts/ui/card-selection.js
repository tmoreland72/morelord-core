const boundRoots = new WeakSet();

/** Opt-in card selection; native controls retain their own click/keyboard behavior. */
export function activateCardSelection(application, renderedElement) {
  const root = renderedElement instanceof HTMLElement ? renderedElement : application?.element;
  if (!root?.matches?.(".ml-window") || boundRoots.has(root)) return;
  boundRoots.add(root);
  root.addEventListener("click", event => {
    if (!(event.target instanceof Element) || event.defaultPrevented) return;
    const card = event.target.closest("[data-ml-selectable-card]");
    if (!card || !root.contains(card)) return;
    if (event.target.closest('input, label, select, textarea, button, a, summary, [role="button"], [contenteditable="true"]')) return;
    if (root.ownerDocument.getSelection()?.isCollapsed === false) return;
    const checkbox = card.querySelector('input[type="checkbox"]');
    if (checkbox && !checkbox.matches(":disabled")) checkbox.click();
  });
}
