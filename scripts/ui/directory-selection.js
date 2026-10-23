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
  const isScene = row.classList?.contains?.('scene')
    ?? String(row.className ?? '').split(/\s+/).includes('scene');
  if (isScene || collection.documentName === 'Scene') {
    if (label.classList?.add) label.classList.add('ml-core-directory-check--scene');
    else label.className = `${label.className} ml-core-directory-check--scene`.trim();
  }
  row.prepend(label);
}

function folderParent(folder, byId) {
  const parent = folder?.folder;
  if (parent == null || parent === '') return null;
  const parentId = typeof parent === 'string' ? parent : parent.id;
  if (!parentId || parentId === folder.id) return null;
  return byId.get(parentId) ?? (typeof parent === 'object' ? parent : null);
}

function folderPath(folder, byId) {
  const names = [];
  const seen = new Set();
  let current = folder;
  while (current?.id && !seen.has(current.id)) {
    seen.add(current.id);
    names.unshift(current.name ?? '');
    current = folderParent(current, byId);
  }
  return names.join(' / ');
}

function foldersFor(collection) {
  const source = collection?.folders ?? globalThis.game?.folders?.filter?.(folder => folder.type === collection?.documentName) ?? [];
  const records = source?.contents ?? source;
  return [...records].filter(folder => folder?.id && (folder.type == null || !collection?.documentName || folder.type === collection.documentName));
}

/** Folder destinations for one sidebar collection. Root is first; other labels are parent / child paths. */
export function directoryFolderChoices(collection) {
  const folders = foldersFor(collection);
  const byId = new Map(folders.map(folder => [folder.id, folder]));
  const choices = folders.map(folder => ({ value: folder.id, label: folderPath(folder, byId) }));
  const language = globalThis.game?.i18n?.lang;
  choices.sort((a, b) => a.label.localeCompare(b.label, language, { sensitivity: 'base', numeric: true }) || a.value.localeCompare(b.value));
  return [{ value: '', label: 'Root (no folder)' }, ...choices];
}

function moveDialogContent(documents, choices) {
  const doc = globalThis.document;
  const shell = doc.createElement('div');
  shell.className = 'ml-app ml-app-shell ml-dialog-shell ml-stack ml-core-directory-move';
  const copy = doc.createElement('p');
  const documentsLabel = `${documents.length} ${documents.length === 1 ? 'document' : 'documents'}`;
  copy.textContent = `Choose a folder for these ${documentsLabel}.`;
  const list = doc.createElement('ul');
  list.className = 'ml-core-directory-move-list';
  for (const item of documents) {
    const entry = doc.createElement('li');
    entry.textContent = item.name;
    list.append(entry);
  }
  const label = doc.createElement('label');
  const caption = doc.createElement('span');
  caption.textContent = 'Destination folder';
  const select = doc.createElement('select');
  select.name = 'folder';
  for (const choice of choices) {
    const option = doc.createElement('option');
    option.value = choice.value;
    option.textContent = choice.label;
    select.append(option);
  }
  label.append(caption, select);
  shell.append(copy, list, label);
  const wrapper = doc.createElement('div');
  wrapper.append(shell);
  return wrapper.outerHTML;
}

async function updateFolders(collection, ids, folderId) {
  const updates = ids.filter(id => collection.has(id)).map(id => ({ _id: id, folder: folderId || null }));
  if (!updates.length) return 0;
  const documentClass = collection.documentClass;
  if (typeof documentClass?.updateDocuments === 'function') await documentClass.updateDocuments(updates);
  else {
    for (const update of updates) {
      const doc = collection.get(update._id);
      if (typeof doc?.update === 'function') await doc.update({ folder: update.folder });
    }
  }
  return updates.length;
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
  const button = (label, action, disabled = false, name = '') => {
    const node = globalThis.document.createElement('button');
    node.type = 'button'; node.className = 'ml-button'; node.textContent = label; node.disabled = disabled;
    if (name) node.setAttribute('data-action', name);
    node.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); action(); });
    controls.append(node);
    return node;
  };
  button(state.active ? 'Done selecting' : 'Select multiple', () => {
    state.active = !state.active; state.selected.clear(); state.anchor = null; activateDirectorySelection(app, root);
  }, state.busy, 'toggle-selection');
  if (!state.active) return;
  button('Select visible', () => {
    for (const row of visibleRows()) state.selected.add(row.dataset.entryId ?? row.dataset.documentId);
    activateDirectorySelection(app, root);
  }, state.busy, 'select-visible');
  button('Clear selection', () => { state.selected.clear(); state.anchor = null; activateDirectorySelection(app, root); }, state.busy, 'clear-selection');
  button(`Move selected (${state.selected.size})`, async () => {
    if (state.busy || !state.selected.size || !globalThis.game?.user?.isGM) return;
    const ids = [...state.selected].filter(id => collection.has(id));
    const documents = ids.map(id => collection.get(id)).filter(Boolean);
    if (!documents.length) { activateDirectorySelection(app, root); return; }
    const choices = directoryFolderChoices(collection);
    state.busy = true;
    activateDirectorySelection(app, root);
    try {
      const documentsLabel = `${documents.length} selected ${documents.length === 1 ? 'document' : 'documents'}`;
      const choice = await globalThis.foundry.applications.api.DialogV2.wait({
        classes: ['ml-window'],
        window: { title: `Move ${documentsLabel}` },
        content: moveDialogContent(documents, choices),
        modal: true,
        rejectClose: false,
        buttons: [
          {
            action: 'move',
            label: 'Move selected',
            callback: (_event, button) => {
              const form = button?.form ?? button?.closest?.('form');
              const field = form?.elements?.folder ?? form?.querySelector?.('[name="folder"]');
              return field?.value ?? '';
            }
          },
          { action: 'cancel', label: 'Cancel', default: true, callback: () => null }
        ]
      });
      if (choice == null || !globalThis.game?.user?.isGM) return;
      const moved = await updateFolders(collection, ids, choice);
      const destination = choices.find(item => item.value === choice)?.label ?? 'the selected folder';
      globalThis.ui.notifications.info(moved
        ? `Moved ${moved} document${moved === 1 ? '' : 's'} to ${destination}.`
        : 'No selected documents remain to move.');
    } catch (error) {
      globalThis.ui.notifications.error(`Could not move selected documents: ${error.message}`);
    } finally {
      state.busy = false;
      activateDirectorySelection(app, app.element?.[0] ?? app.element ?? root);
    }
  }, state.busy || !state.selected.size, 'move-selected');
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
  }, state.busy || !state.selected.size, 'delete-selected');
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