const initialized = new WeakSet();
const pendingFocus = new WeakMap();

/** Activate Core tab strips; module data-action handlers own panel changes. */
export function activateTabs(application) {
  const root = application?.element;
  if (!root?.querySelectorAll) return;
  for (const strip of root.querySelectorAll('.ml-tabs[role="tablist"]')) {
    if (initialized.has(strip)) continue;
    initialized.add(strip);
    strip.addEventListener('keydown', event => {
      const current = event.target.closest('[role="tab"]');
      if (!current || current.getAttribute('aria-disabled') === 'true') return;
      const tabs = [...strip.querySelectorAll('[role="tab"]')].filter(tab => tab.getAttribute('aria-disabled') !== 'true');
      const index = tabs.indexOf(current);
      const next = event.key === 'ArrowRight' ? tabs[(index + 1) % tabs.length]
        : event.key === 'ArrowLeft' ? tabs[(index + tabs.length - 1) % tabs.length]
        : event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1)
        : ['Enter', ' '].includes(event.key) ? current : null;
      if (!next) return;
      event.preventDefault();
      pendingFocus.set(application, next.id);
      next.click();
    });
  }
  const id = pendingFocus.get(application);
  if (id) {
    root.querySelector(`[id="${CSS.escape(id)}"]`)?.focus();
    // Loading renders may temporarily disable tabs; restore focus after loading too.
    if (!root.querySelector('[role="tab"][aria-disabled="true"]')) pendingFocus.delete(application);
  }
}
