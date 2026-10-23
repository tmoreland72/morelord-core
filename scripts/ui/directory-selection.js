const documentTypes = new Set(['Scene', 'Actor', 'Item', 'JournalEntry', 'RollTable', 'Cards', 'Macro', 'Playlist']);
const states = new WeakMap();

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
  const source = collection?.folders ?? game.folders?.filter?.(folder => folder.type === collection?.documentName) ?? [];
  const records = source?.contents ?? source;
  return [...records].filter(folder => folder?.id && (folder.type == null || !collection?.documentName || folder.type === collection.documentName));
}

/** Folder destinations for one sidebar collection. Root is first; other labels are parent / child paths. */
export function directoryFolderChoices(collection) {
  const folders = foldersFor(collection);
  const byId = new Map(folders.map(folder => [folder.id, folder]));
  const choices = folders.map(folder => ({ value: folder.id, label: folderPath(folder, byId) }));
  const language = game.i18n?.lang;
  choices.sort((a, b) => a.label.localeCompare(b.label, language, { sensitivity: 'base', numeric: true }) || a.value.localeCompare(b.value));
  return [{ value: '', label: 'Root (no folder)' }, ...choices];
}

function moveDialogContent(documents, choices) {
  const shell = document.createElement('div');
  shell.className = 'ml-app ml-app-shell ml-dialog-shell ml-stack ml-core-directory-move';
  const copy = document.createElement('p');
  const documentsLabel = `${documents.length} ${documents.length === 1 ? 'document' : 'documents'}`;
  copy.textContent = `Choose a folder for these ${documentsLabel}.`;
  const list = document.createElement('ul');
  list.className = 'ml-core-directory-move-list';
  for (const doc of documents) {
    const entry = document.createElement('li');
    entry.textContent = doc.name;
    list.append(entry);
  }
  const label = document.createElement('label');
  const caption = document.createElement('span');
  caption.textContent = 'Destination folder';
  const select = document.createElement('select');
  select.name = 'folder';
  for (const choice of choices) {
    const option = document.createElement('option');
    option.value = choice.value;
    option.textContent = choice.label;
    select.append(option);
  }
  label.append(caption, select);
  shell.append(copy, list, label);
  const wrapper = document.createElement('div');
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
  const button = (label, action, disabled = false, name = '') => {
    const node = document.createElement('button');
    node.type = 'button'; node.className = 'ml-button'; node.textContent = label; node.disabled = disabled;
    if (name) node.setAttribute('data-action', name);
    node.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); action(); });
    controls.append(node);
    return node;
  };
  button(state.active ? 'Done selecting' : 'Select multiple', () => {
    state.active = !state.active; state.selected.clear(); activateDirectorySelection(app, root);
  }, state.busy, 'toggle-selection');
  if (!state.active) return;
  button('Select visible', () => {
    for (const row of visibleRows()) state.selected.add(row.dataset.entryId ?? row.dataset.documentId);
    activateDirectorySelection(app, root);
  }, state.busy, 'select-visible');
  button('Clear selection', () => { state.selected.clear(); activateDirectorySelection(app, root); }, state.busy, 'clear-selection');
  button(`Move selected (${state.selected.size})`, async () => {
    if (state.busy || !state.selected.size || !game.user?.isGM) return;
    const ids = [...state.selected].filter(id => collection.has(id));
    const documents = ids.map(id => collection.get(id)).filter(Boolean);
    if (!documents.length) { activateDirectorySelection(app, root); return; }
    const choices = directoryFolderChoices(collection);
    state.busy = true;
    activateDirectorySelection(app, root);
    try {
      const documentsLabel = `${documents.length} selected ${documents.length === 1 ? 'document' : 'documents'}`;
      const choice = await foundry.applications.api.DialogV2.wait({
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
      if (choice == null || !game.user?.isGM) return;
      const moved = await updateFolders(collection, ids, choice);
      const destination = choices.find(item => item.value === choice)?.label ?? 'the selected folder';
      ui.notifications.info(moved
        ? `Moved ${moved} document${moved === 1 ? '' : 's'} to ${destination}.`
        : 'No selected documents remain to move.');
    } catch (error) {
      ui.notifications.error(`Could not move selected documents: ${error.message}`);
    } finally {
      state.busy = false;
      activateDirectorySelection(app, app.element?.[0] ?? app.element ?? root);
    }
  }, state.busy || !state.selected.size, 'move-selected');
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
  }, state.busy || !state.selected.size, 'delete-selected');
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
