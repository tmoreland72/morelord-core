const documentTypes = new Set(['Scene', 'Actor', 'Item', 'JournalEntry', 'RollTable', 'Cards', 'Macro', 'Playlist']);
const states = new WeakMap();
const isolatedTargets = new WeakSet();
const shiftClicks = new WeakMap();

/** Pointer events that other modules attach to directory rows and sidebar containers. */
export const DIRECTORY_CHECKBOX_EVENTS = Object.freeze([
  'pointerdown', 'mousedown', 'mouseup', 'pointerup', 'click', 'dblclick', 'auxclick'
]);

function eventElement(event) {
  const target = event.target;
  if (target?.closest) return target;
  return target?.parentElement ?? null;
}

/** Stop directory and sidebar listeners from seeing checkbox interaction, including capture listeners. */
export function installDirectoryCheckboxIsolation(target = globalThis.window) {
  if (!target?.addEventListener || isolatedTargets.has(target)) return;
  isolatedTargets.add(target);
  for (const type of DIRECTORY_CHECKBOX_EVENTS) {
    target.addEventListener(type, event => {
      const check = eventElement(event)?.closest('.ml-core-directory-check');
      if (!check) return;
      if (event.shiftKey) shiftClicks.set(check, true);
      event.stopPropagation();
      event.stopImmediatePropagation();
    }, true);
  }
}

/**
 * The checkbox is always the leftmost control. Thumbnail rows are ordinary flex items, so prepending
 * the label places it before the image and the name. Scene names cover the card, so that checkbox is
 * positioned over the upper left. Playlist rows are a column, so the checkbox is the first child of
 * the header, before the expand control and the playlist name.
 */
function placeCheckbox(row, label, collection) {
  const header = row.querySelector(':scope > .playlist-header, :scope > header.playlist-header');
  if (header) {
    header.prepend(label);
    return;
  }
  if (row.classList.contains('scene') || collection.documentName === 'Scene') {
    label.classList.add('ml-core-directory-check--scene');
  }
  row.prepend(label);
}

/** Select native world-directory entries without replacing Foundry's directory behavior. */
export function activateDirectorySelection(app, html) {
  installDirectoryCheckboxIsolation();
  const collection = app?.collection;
  if (!globalThis.game?.user?.isGM || !documentTypes.has(collection?.documentName) || collection.pack) return;
  const root = html?.querySelector ? html : html?.[0] ?? app.element;
  const header = root?.querySelector('.directory-header');
  if (!header) return;
  let state = states.get(app);
  if (!state) states.set(app, state = { active: false, selected: new Set(), busy: false, anchor: null });
  for (const id of state.selected) if (!collection.has(id)) state.selected.delete(id);
  if (state.anchor && !collection.has(state.anchor)) state.anchor = null;
  root.querySelector('.ml-core-directory-selection')?.remove();
  root.querySelectorAll('.ml-core-directory-check').forEach(node => node.remove());
  const toolbar = globalThis.document.createElement('div');
  toolbar.className = 'ml-window ml-core-directory-selection';
  toolbar.innerHTML = '<div class="window-content ml-app"><div class="ml-app-shell"><div class="ml-toolbar"></div></div></div>';
  header.append(toolbar);
  const controls = toolbar.querySelector('.ml-toolbar');
  const rows = () => [...root.querySelectorAll('.directory-item[data-entry-id], .directory-item[data-document-id]')]
    .filter(row => collection.has(row.dataset.entryId ?? row.dataset.documentId));
  const visibleRows = () => rows().filter(row => row.getClientRects().length && globalThis.getComputedStyle(row).visibility !== 'hidden');
  const button = (label, action, disabled = false) => {
    const node = globalThis.document.createElement('button');
    node.type = 'button'; node.className = 'ml-button'; node.textContent = label; node.disabled = disabled;
    node.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); action(); });
    controls.append(node);
    return node;
  };
  button(state.active ? 'Done selecting' : 'Select multiple', () => {
    state.active = !state.active; state.selected.clear(); state.anchor = null; activateDirectorySelection(app, root);
  }, state.busy);
  if (!state.active) return;
  button('Select visible', () => {
    for (const row of visibleRows()) state.selected.add(row.dataset.entryId ?? row.dataset.documentId);
    activateDirectorySelection(app, root);
  }, state.busy);
  button('Clear selection', () => { state.selected.clear(); state.anchor = null; activateDirectorySelection(app, root); }, state.busy);
  button(`Delete selected (${state.selected.size})`, async () => {
    if (state.busy || !state.selected.size || !globalThis.game?.user?.isGM) return;
    const ids = [...state.selected];
    const documents = ids.map(id => collection.get(id)).filter(Boolean);
    state.busy = true;
    activateDirectorySelection(app, root);
    try {
      const list = globalThis.document.createElement('ul');
      list.className = 'ml-core-directory-delete-list';
      for (const doc of documents) {
        const entry = globalThis.document.createElement('li'); entry.textContent = doc.name; list.append(entry);
      }
      const confirmed = await globalThis.foundry.applications.api.DialogV2.confirm({
        classes: ['ml-window'], window: { title: `Delete ${documents.length} selected documents` },
        content: `<div class="ml-app"><div class="ml-app-shell"><p>Permanently delete these ${documents.length} documents? This cannot be undone. Folders are kept.</p>${list.outerHTML}</div></div>`,
        modal: true, rejectClose: false,
        yes: { label: 'Delete selected' }, no: { label: 'Cancel', default: true }
      });
      if (!confirmed || !globalThis.game?.user?.isGM) return;
      const remaining = ids.filter(id => collection.has(id));
      if (remaining.length) await collection.documentClass.deleteDocuments(remaining);
      for (const id of ids) state.selected.delete(id);
    } catch (error) {
      globalThis.ui.notifications.error(`Could not delete selected documents: ${error.message}`);
    } finally {
      state.busy = false;
      activateDirectorySelection(app, app.element?.[0] ?? app.element ?? root);
    }
  }, state.busy || !state.selected.size);
  for (const row of rows()) {
    const id = row.dataset.entryId ?? row.dataset.documentId;
    const label = globalThis.document.createElement('label');
    label.className = 'ml-check ml-core-directory-check';
    const input = globalThis.document.createElement('input');
    input.type = 'checkbox'; input.checked = state.selected.has(id); input.disabled = state.busy;
    input.setAttribute('aria-label', `Select ${collection.get(id).name}`);
    label.append(input);
    for (const type of DIRECTORY_CHECKBOX_EVENTS) {
      label.addEventListener(type, event => event.stopPropagation());
    }
    input.addEventListener('change', () => {
      const shift = shiftClicks.get(label) === true;
      shiftClicks.delete(label);
      const checked = input.checked;
      const ordered = visibleRows().map(entry => entry.dataset.entryId ?? entry.dataset.documentId);
      const start = ordered.indexOf(state.anchor);
      const end = ordered.indexOf(id);
      if (shift && state.anchor && start !== -1 && end !== -1) {
        const [from, to] = start < end ? [start, end] : [end, start];
        for (const entryId of ordered.slice(from, to + 1)) {
          if (checked) state.selected.add(entryId);
          else state.selected.delete(entryId);
        }
      } else {
        if (checked) state.selected.add(id);
        else state.selected.delete(id);
        state.anchor = id;
      }
      activateDirectorySelection(app, root);
      const replacement = [...root.querySelectorAll('.ml-core-directory-check input')]
        .find(control => (control.closest('.directory-item').dataset.entryId ?? control.closest('.directory-item').dataset.documentId) === id);
      replacement?.focus({ preventScroll: true });
    });
    placeCheckbox(row, label, collection);
  }
}

export function registerDirectorySelection() {
  installDirectoryCheckboxIsolation();
  globalThis.Hooks.on('renderApplicationV2', activateDirectorySelection);
  globalThis.Hooks.on('renderApplication', activateDirectorySelection);
}
