/** Optional live state text for Core checkbox controls; changes remain unsaved. */
export function activateCheckStates(root) {
  for (const control of root.querySelectorAll('.ml-check[data-ml-check-state]')) {
    const input = control.querySelector('input[type="checkbox"]');
    const label = control.querySelector('[data-ml-check-label]');
    if (!input || !label) continue;
    const update = () => { label.textContent = input.checked ? 'Enabled' : 'Disabled'; };
    update();
    if (control.dataset.mlCheckBound) continue;
    control.dataset.mlCheckBound = 'true';
    input.addEventListener('change', update);
  }
}
