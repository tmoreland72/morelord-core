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

function addClass(node, name) {
  if (node.classList?.add) node.classList.add(name);
  else node.className = `${node.className ?? ''} ${name}`.trim();
}

/**
 * The checkbox is always the leftmost control. Thumbnail rows are ordinary flex items, so prepending
 * the label places it before the image and the name. Scene names cover the card, so that checkbox is
 * positioned over the upper left. Playlist rows are a column, so the checkbox is the first child of
 * the header, before the expand control and the playlist name. Compendium pack cards are the same
 * kind of covered row: the checkbox is prepended and painted over the upper left so the banner,
 * title, and footer stay where Foundry placed them.
 */
function placeCheckbox(row, label, { documentName, overlay = false } = {}) {
  const header = row.querySelector(':scope > .playlist-header, :scope > header.playlist-header');
  if (header) {
    header.prepend(label);
    return;
  }
  const isScene = row.classList?.contains?.('scene')
    ?? String(row.className ?? '').split(/\s+/).includes('scene');
  if (isScene || documentName === 'Scene') addClass(label, 'ml-core-directory-check--scene');
  if (overlay) addClass(label, 'ml-core-directory-check--compendium');
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

function counted(count, noun) {
  return `${count} ${count === 1 ? noun : `${noun}s`}`;
}

function moveDialogContent(entries, choices, noun) {
  const doc = globalThis.document;
  const shell = doc.createElement('div');
  shell.className = 'ml-app ml-app-shell ml-dialog-shell ml-stack ml-core-directory-move';
  const copy = doc.createElement('p');
  copy.textContent = `Choose a folder for these ${counted(entries.length, noun)}.`;
  const list = doc.createElement('ul');
  list.className = 'ml-core-directory-move-list';
  for (const item of entries) {
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

function nameList(className, entries) {
  const list = globalThis.document.createElement('ul');
  list.className = className;
  for (const entry of entries) {
    const item = globalThis.document.createElement('li');
    item.textContent = entry.name;
    list.append(item);
  }
  return list;
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

function tabNameOf(app) {
  try {
    if (typeof app?.tabName === 'string') return app.tabName;
  } catch {
    /* A partial application object has no sidebar tab name. */
  }
  return typeof app?.constructor?.tabName === 'string' ? app.constructor.tabName : '';
}

function worldDirectory(app) {
  const collection = app?.collection;
  if (!documentTypes.has(collection?.documentName) || collection.pack) return null;
  const idFromRow = row => row.dataset.entryId ?? row.dataset.documentId;
  return {
    noun: 'document',
    has: id => collection.has(id),
    get: id => collection.get(id),
    name: entry => entry?.name ?? '',
    idFromRow,
    rows: root => [...root.querySelectorAll('.directory-item[data-entry-id], .directory-item[data-document-id]')]
      .filter(row => collection.has(idFromRow(row))),
    choices: () => directoryFolderChoices(collection),
    move: (ids, folderId) => updateFolders(collection, ids, folderId),
    deletable: () => true,
    remove: async ids => {
      const remaining = ids.filter(id => collection.has(id));
      if (remaining.length) await collection.documentClass.deleteDocuments(remaining);
      return ids;
    },
    place: (row, label) => placeCheckbox(row, label, { documentName: collection.documentName })
  };
}

/**
 * Foundry v13 and v14 CompendiumDirectory (tabName "compendium") lists packs, not world documents.
 * Pack rows use data-pack in v13. v14 keeps the same collection id on CompendiumPackDirectoryContext.
 * A row without data-pack is included only when its entry id is a pack collection id.
 */
function packRowId(row, packs) {
  if (row.dataset?.pack) return packs.has(row.dataset.pack) ? row.dataset.pack : '';
  const id = row.dataset?.entryId ?? row.dataset?.documentId ?? '';
  return id && packs.has(id) ? id : '';
}

/** System and published module packs match Foundry's unlock warning. World packs and local modules do not. */
function unlockNeedsConfirmation(pack) {
  const metadata = pack?.metadata ?? {};
  if (metadata.packageType === 'world') return false;
  if (metadata.packageType === 'module') {
    const module = globalThis.game?.modules?.get?.(metadata.packageName);
    if (module && !module.download && !module.manifest) return false;
  }
  return true;
}

async function movePacks(packs, ids, folderId) {
  const folder = folderId || null;
  let moved = 0;
  for (const id of ids) {
    const pack = packs.get(id);
    if (!pack) continue;
    if (typeof pack.setFolder === 'function') await pack.setFolder(folder);
    else if (typeof pack.configure === 'function') await pack.configure({ folder });
    else continue;
    moved += 1;
  }
  return moved;
}

async function setPackLocked(entries, locked) {
  let changed = 0;
  for (const pack of entries) {
    if (Boolean(pack.locked) === locked) continue;
    if (typeof pack.configure !== 'function') throw new Error('This compendium lock cannot be changed.');
    await pack.configure({ locked });
    changed += 1;
  }
  return changed;
}

function compendiumDirectory(app) {
  if (tabNameOf(app) !== 'compendium') return null;
  const packs = globalThis.game?.packs;
  if (typeof packs?.has !== 'function' || typeof packs?.get !== 'function') return null;
  return {
    noun: 'compendium',
    has: id => packs.has(id),
    get: id => packs.get(id),
    name: entry => entry?.title || entry?.metadata?.label || entry?.name || '',
    idFromRow: row => packRowId(row, packs),
    rows: root => [...root.querySelectorAll('.directory-item')].filter(row => packRowId(row, packs)),
    choices: () => directoryFolderChoices({ documentName: 'Compendium', folders: packs.folders }),
    move: (ids, folderId) => movePacks(packs, ids, folderId),
    deletable: entry => entry?.metadata?.packageType === 'world',
    remove: async ids => {
      const worldIds = ids.filter(id => packs.has(id) && packs.get(id)?.metadata?.packageType === 'world');
      for (const id of worldIds) {
        const pack = packs.get(id);
        if (typeof pack?.deleteCompendium !== 'function') throw new Error('This compendium cannot be deleted.');
        await pack.deleteCompendium();
      }
      return worldIds;
    },
    place: (row, label) => placeCheckbox(row, label, { overlay: true }),
    lock: {
      isLocked: entry => Boolean(entry?.locked),
      needsConfirmation: unlockNeedsConfirmation,
      apply: setPackLocked
    }
  };
}

function directoryTarget(app) {
  return worldDirectory(app) ?? compendiumDirectory(app);
}

function directoryRoot(app, html) {
  return html?.querySelector ? html : html?.[0] ?? app.element;
}

function selectedDocumentTitle(count, noun) {
  if (noun === 'document') return `Move ${count} selected ${count === 1 ? 'document' : 'documents'}`;
  return `Move ${count} selected ${count === 1 ? noun : `${noun}s`}`;
}

async function confirmDelete(entries, noun, skipped) {
  const list = nameList('ml-core-directory-delete-list', entries);
  const kept = skipped
    ? ' System and module compendiums in the selection are kept.'
    : '';
  const prompt = noun === 'document'
    ? `Permanently delete these ${entries.length} documents? This cannot be undone. Folders are kept.`
    : `Permanently delete these ${entries.length} ${entries.length === 1 ? 'compendium' : 'compendiums'}? This cannot be undone. Folders are kept.${kept}`;
  const title = noun === 'document'
    ? `Delete ${entries.length} selected documents`
    : `Delete ${entries.length} selected ${entries.length === 1 ? 'compendium' : 'compendiums'}`;
  return globalThis.foundry.applications.api.DialogV2.confirm({
    classes: ['ml-window'],
    window: { title },
    content: `<div class="ml-app"><div class="ml-app-shell"><p>${prompt}</p>${list.outerHTML}</div></div>`,
    modal: true,
    rejectClose: false,
    yes: { label: 'Delete selected' },
    no: { label: 'Cancel', default: true }
  });
}

async function confirmUnlock(entries) {
  const list = nameList('ml-core-directory-move-list', entries);
  const prompt = `Unlocking a system or module compendium can be overwritten when that package updates. Unlock these ${counted(entries.length, 'compendium')}?`;
  return globalThis.foundry.applications.api.DialogV2.confirm({
    classes: ['ml-window'],
    window: { title: `Unlock ${counted(entries.length, 'compendium')}` },
    content: `<div class="ml-app"><div class="ml-app-shell"><p>${prompt}</p>${list.outerHTML}</div></div>`,
    modal: true,
    rejectClose: false,
    yes: { label: 'Unlock selected' },
    no: { label: 'Cancel', default: true }
  });
}

/** Select native sidebar entries without replacing Foundry's directory behavior. */
export function activateDirectorySelection(app, html) {
  installDirectoryCheckboxIsolation();
  if (!globalThis.game?.user?.isGM) return;
  const target = directoryTarget(app);
  if (!target) return;
  const root = directoryRoot(app, html);
  const header = root?.querySelector('.directory-header');
  if (!header) return;
  let state = states.get(app);
  if (!state) states.set(app, state = { active: false, selected: new Set(), busy: false, anchor: null });
  for (const id of state.selected) if (!target.has(id)) state.selected.delete(id);
  if (state.anchor && !target.has(state.anchor)) state.anchor = null;
  root.querySelector('.ml-core-directory-selection')?.remove();
  root.querySelectorAll('.ml-core-directory-check').forEach(node => node.remove());
  const toolbar = globalThis.document.createElement('div');
  toolbar.className = 'ml-window ml-core-directory-selection';
  toolbar.innerHTML = '<div class="window-content ml-app"><div class="ml-app-shell"><div class="ml-toolbar"></div></div></div>';
  header.append(toolbar);
  const controls = toolbar.querySelector('.ml-toolbar');
  const rows = () => target.rows(root);
  const visibleRows = () => rows().filter(row => row.getClientRects().length && globalThis.getComputedStyle(row).visibility !== 'hidden');
  const button = (label, action, disabled = false, name = '') => {
    const node = globalThis.document.createElement('button');
    node.type = 'button'; node.className = 'ml-button'; node.textContent = label; node.disabled = disabled;
    if (name) node.setAttribute('data-action', name);
    node.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); action(); });
    controls.append(node);
    return node;
  };
  const refresh = () => activateDirectorySelection(app, root);
  button(state.active ? 'Done selecting' : 'Select multiple', () => {
    state.active = !state.active; state.selected.clear(); state.anchor = null; refresh();
  }, state.busy, 'toggle-selection');
  if (!state.active) return;
  button('Select visible', () => {
    for (const row of visibleRows()) state.selected.add(target.idFromRow(row));
    refresh();
  }, state.busy, 'select-visible');
  button('Clear selection', () => { state.selected.clear(); state.anchor = null; refresh(); }, state.busy, 'clear-selection');
  const selectedIds = () => [...state.selected].filter(id => target.has(id));
  const selectedEntries = ids => ids.map(id => target.get(id)).filter(Boolean).map(entry => ({ entry, name: target.name(entry) }));
  button(`Move selected (${state.selected.size})`, async () => {
    if (state.busy || !state.selected.size || !globalThis.game?.user?.isGM) return;
    const ids = selectedIds();
    const entries = selectedEntries(ids);
    if (!entries.length) { refresh(); return; }
    const choices = target.choices();
    state.busy = true;
    refresh();
    try {
      const choice = await globalThis.foundry.applications.api.DialogV2.wait({
        classes: ['ml-window'],
        window: { title: selectedDocumentTitle(entries.length, target.noun) },
        content: moveDialogContent(entries, choices, target.noun),
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
      const moved = await target.move(ids, choice);
      const destination = choices.find(item => item.value === choice)?.label ?? 'the selected folder';
      globalThis.ui.notifications.info(moved
        ? `Moved ${counted(moved, target.noun)} to ${destination}.`
        : `No selected ${target.noun}s remain to move.`);
    } catch (error) {
      globalThis.ui.notifications.error(`Could not move selected ${target.noun}s: ${error.message}`);
    } finally {
      state.busy = false;
      activateDirectorySelection(app, app.element?.[0] ?? app.element ?? root);
    }
  }, state.busy || !state.selected.size, 'move-selected');
  if (target.lock) {
    const lockedIds = selectedIds().filter(id => target.lock.isLocked(target.get(id)));
    const unlockedIds = selectedIds().filter(id => !target.lock.isLocked(target.get(id)));
    button(`Lock selected (${unlockedIds.length})`, async () => {
      if (state.busy || !unlockedIds.length || !globalThis.game?.user?.isGM) return;
      const entries = unlockedIds.map(id => target.get(id)).filter(Boolean);
      state.busy = true;
      refresh();
      try {
        if (!globalThis.game?.user?.isGM) return;
        const changed = await target.lock.apply(entries, true);
        globalThis.ui.notifications.info(changed
          ? `Locked ${counted(changed, target.noun)}.`
          : `No selected ${target.noun}s remain to lock.`);
      } catch (error) {
        globalThis.ui.notifications.error(`Could not lock selected ${target.noun}s: ${error.message}`);
      } finally {
        state.busy = false;
        activateDirectorySelection(app, app.element?.[0] ?? app.element ?? root);
      }
    }, state.busy || !unlockedIds.length, 'lock-selected');
    button(`Unlock selected (${lockedIds.length})`, async () => {
      if (state.busy || !lockedIds.length || !globalThis.game?.user?.isGM) return;
      const entries = lockedIds.map(id => target.get(id)).filter(Boolean);
      const warned = entries.filter(entry => target.lock.needsConfirmation(entry));
      state.busy = true;
      refresh();
      try {
        if (warned.length) {
          const confirmed = await confirmUnlock(entries.map(entry => ({ name: target.name(entry) })));
          if (!confirmed || !globalThis.game?.user?.isGM) return;
        } else if (!globalThis.game?.user?.isGM) return;
        const changed = await target.lock.apply(entries, false);
        globalThis.ui.notifications.info(changed
          ? `Unlocked ${counted(changed, target.noun)}.`
          : `No selected ${target.noun}s remain to unlock.`);
      } catch (error) {
        globalThis.ui.notifications.error(`Could not unlock selected ${target.noun}s: ${error.message}`);
      } finally {
        state.busy = false;
        activateDirectorySelection(app, app.element?.[0] ?? app.element ?? root);
      }
    }, state.busy || !lockedIds.length, 'unlock-selected');
  }
  const deletableIds = selectedIds().filter(id => target.deletable(target.get(id)));
  button(`Delete selected (${target.lock ? deletableIds.length : state.selected.size})`, async () => {
    if (state.busy || !globalThis.game?.user?.isGM) return;
    const ids = selectedIds();
    const deletable = ids.filter(id => target.deletable(target.get(id)));
    if (!deletable.length) return;
    const entries = selectedEntries(deletable);
    state.busy = true;
    refresh();
    try {
      const confirmed = await confirmDelete(entries, target.noun, ids.length - deletable.length);
      if (!confirmed || !globalThis.game?.user?.isGM) return;
      const cleared = await target.remove(ids);
      for (const id of cleared) state.selected.delete(id);
    } catch (error) {
      globalThis.ui.notifications.error(`Could not delete selected ${target.noun}s: ${error.message}`);
    } finally {
      state.busy = false;
      activateDirectorySelection(app, app.element?.[0] ?? app.element ?? root);
    }
  }, state.busy || !(target.lock ? deletableIds.length : state.selected.size), 'delete-selected');
  for (const row of rows()) {
    const id = target.idFromRow(row);
    const label = globalThis.document.createElement('label');
    label.className = 'ml-check ml-core-directory-check';
    const input = globalThis.document.createElement('input');
    input.type = 'checkbox'; input.checked = state.selected.has(id); input.disabled = state.busy;
    input.setAttribute('aria-label', `Select ${target.name(target.get(id))}`);
    label.append(input);
    for (const type of DIRECTORY_CHECKBOX_EVENTS) {
      label.addEventListener(type, event => event.stopPropagation());
    }
    input.addEventListener('change', () => {
      const shift = shiftClicks.get(label) === true;
      shiftClicks.delete(label);
      const checked = input.checked;
      const ordered = visibleRows().map(entry => target.idFromRow(entry));
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
      refresh();
      const replacement = [...root.querySelectorAll('.ml-core-directory-check input')]
        .find(control => target.idFromRow(control.closest('.directory-item')) === id);
      replacement?.focus({ preventScroll: true });
    });
    target.place(row, label);
  }
}

export function registerDirectorySelection() {
  installDirectoryCheckboxIsolation();
  globalThis.Hooks.on('renderApplicationV2', activateDirectorySelection);
  globalThis.Hooks.on('renderApplication', activateDirectorySelection);
}
