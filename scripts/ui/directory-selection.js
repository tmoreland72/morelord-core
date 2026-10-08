const documentTypes = new Set(['Scene', 'Actor', 'Item', 'JournalEntry', 'RollTable', 'Cards', 'Macro', 'Playlist']);
const states = new WeakMap();

/** Select native world-directory entries without replacing Foundry's directory behavior. */
export function activateDirectorySelection(app, html) {
  const collection = app?.collection;
  if (!game.user?.isGM || !documentTypes.has(collection?.documentName) || collection.pack) return;
  const root = html?.querySelector ? html : html?.[0] ?? app.element;
  const header = root?.querySelector('.directory-header');
  if (!header) return;
  let state = states.get(app);
  if (!state) states.set(app, state = { active: false, selected: new Set(), busy: false });
  for (const id of state.selected) if (!collection.has(id)) state.selected.delete(id);
  root.querySelector('.ml-core-directory-selection')?.remove();
  root.querySelectorAll('.ml-core-directory-check').forEach(node => node.remove());
  const toolbar = document.createElement('div');
  toolbar.className = 'ml-window ml-core-directory-selection';
  toolbar.innerHTML = '<div class="window-content ml-app"><div class="ml-app-shell"><div class="ml-toolbar"></div></div></div>';
  header.append(toolbar);
  const controls = toolbar.querySelector('.ml-toolbar');
  const rows = () => [...root.querySelectorAll('.directory-item[data-entry-id], .directory-item[data-document-id]')]
    .filter(row => collection.has(row.dataset.entryId ?? row.dataset.documentId));
  const visibleRows = () => rows().filter(row => row.getClientRects().length && getComputedStyle(row).visibility !== 'hidden');
  const button = (label, action, disabled = false) => {
    const node = document.createElement('button');
    node.type = 'button'; node.className = 'ml-button'; node.textContent = label; node.disabled = disabled;
    node.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); action(); });
    controls.append(node);
    return node;
  };
  button(state.active ? 'Done selecting' : 'Select multiple', () => {
    state.active = !state.active; state.selected.clear(); activateDirectorySelection(app, root);
  }, state.busy);
  if (!state.active) return;
  button('Select visible', () => {
    for (const row of visibleRows()) state.selected.add(row.dataset.entryId ?? row.dataset.documentId);
    activateDirectorySelection(app, root);
  }, state.busy);
  button('Clear selection', () => { state.selected.clear(); activateDirectorySelection(app, root); }, state.busy);
  button(`Delete selected (${state.selected.size})`, async () => {
    if (state.busy || !state.selected.size || !game.user?.isGM) return;
    const ids = [...state.selected];
    const documents = ids.map(id => collection.get(id)).filter(Boolean);
    state.busy = true;
    activateDirectorySelection(app, root);
    try {
      const list = document.createElement('ul');
      list.className = 'ml-core-directory-delete-list';
      for (const doc of documents) {
        const entry = document.createElement('li'); entry.textContent = doc.name; list.append(entry);
      }
      const confirmed = await foundry.applications.api.DialogV2.confirm({
        classes: ['ml-window'], window: { title: `Delete ${documents.length} selected documents` },
        content: `<div class="ml-app"><div class="ml-app-shell"><p>Permanently delete these ${documents.length} documents? This cannot be undone. Folders are kept.</p>${list.outerHTML}</div></div>`,
        modal: true, rejectClose: false,
        yes: { label: 'Delete selected' }, no: { label: 'Cancel', default: true }
      });
      if (!confirmed || !game.user?.isGM) return;
      const remaining = ids.filter(id => collection.has(id));
      if (remaining.length) await collection.documentClass.deleteDocuments(remaining);
      for (const id of ids) state.selected.delete(id);
    } catch (error) {
      ui.notifications.error(`Could not delete selected documents: ${error.message}`);
    } finally {
      state.busy = false;
      activateDirectorySelection(app, app.element?.[0] ?? app.element ?? root);
    }
  }, state.busy || !state.selected.size);
  for (const row of rows()) {
    const id = row.dataset.entryId ?? row.dataset.documentId;
    const label = document.createElement('label');
    label.className = 'ml-check ml-core-directory-check';
    const input = document.createElement('input');
    input.type = 'checkbox'; input.checked = state.selected.has(id); input.disabled = state.busy;
    input.setAttribute('aria-label', `Select ${collection.get(id).name}`);
    label.append(input);
    label.addEventListener('click', event => event.stopPropagation());
    label.addEventListener('dblclick', event => event.stopPropagation());
    input.addEventListener('change', () => {
      if (input.checked) state.selected.add(id); else state.selected.delete(id);
      activateDirectorySelection(app, root);
      const replacement = [...root.querySelectorAll('.ml-core-directory-check input')]
        .find(control => (control.closest('.directory-item').dataset.entryId ?? control.closest('.directory-item').dataset.documentId) === id);
      replacement?.focus({ preventScroll: true });
    });
    row.prepend(label);
  }
}

export function registerDirectorySelection() {
  Hooks.on('renderApplicationV2', activateDirectorySelection);
  Hooks.on('renderApplication', activateDirectorySelection);
}
