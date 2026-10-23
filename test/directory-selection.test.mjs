import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { activateDirectorySelection, DIRECTORY_CHECKBOX_EVENTS } from '../scripts/ui/directory-selection.js';

class DomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.bubbles = init.bubbles ?? true;
    this.cancelable = init.cancelable ?? true;
    this.shiftKey = init.shiftKey ?? false;
    this.target = null;
    this.currentTarget = null;
    this.defaultPrevented = false;
    this.propagationStopped = false;
    this.immediateStopped = false;
  }
  preventDefault() { if (this.cancelable) this.defaultPrevented = true; }
  stopPropagation() { this.propagationStopped = true; }
  stopImmediatePropagation() { this.propagationStopped = true; this.immediateStopped = true; }
}

function dataKey(name) {
  return name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function matchSimple(element, selector) {
  const tag = selector.match(/^[a-z][\w-]*/i)?.[0] ?? '*';
  const classes = [...selector.matchAll(/\.([\w-]+)/g)].map(match => match[1]);
  const attributes = [...selector.matchAll(/\[([^\]=]+)(?:=["']?([^"'\]]+)["']?)?\]/g)];
  if (tag !== '*' && element.tagName.toLowerCase() !== tag.toLowerCase()) return false;
  if (!classes.every(name => element.classList.contains(name))) return false;
  return attributes.every(match => element.getAttribute(match[1]) === (match[2] ?? element.getAttribute(match[1])) && element.getAttribute(match[1]) != null);
}

function descendants(root) {
  const all = [];
  const walk = node => {
    for (const child of node.children) {
      all.push(child);
      walk(child);
    }
  };
  walk(root);
  return all;
}

function createHarness() {
  const nodes = new Set();
  function make(tag) {
    const element = {
      tagName: String(tag).toUpperCase(),
      nodeType: 1,
      children: [],
      parentElement: null,
      dataset: {},
      attributes: new Map(),
      listeners: [],
      textContent: '',
      type: '',
      checked: false,
      disabled: false,
      _className: '',
      get className() { return this._className; },
      set className(value) { this._className = String(value); },
      classList: null,
      getClientRects: () => [1],
      focus() {},
      setAttribute(name, value) { this.attributes.set(name, String(value)); },
      getAttribute(name) {
        if (name.startsWith('data-')) {
          const value = this.dataset[dataKey(name)];
          return value == null ? null : String(value);
        }
        return this.attributes.has(name) ? this.attributes.get(name) : null;
      },
      addEventListener(type, fn, capture = false) {
        this.listeners.push({ type, fn, capture: capture === true || capture?.capture === true });
      },
      removeEventListener(type, fn, capture = false) {
        const useCapture = capture === true || capture?.capture === true;
        this.listeners = this.listeners.filter(listener => listener.type !== type || listener.fn !== fn || listener.capture !== useCapture);
      },
      append(...items) { for (const item of items) this.insert(item, this.children.length); },
      prepend(item) { this.insert(item, 0); },
      before(item) {
        const parent = this.parentElement;
        parent.insert(item, parent.children.indexOf(this));
      },
      insert(item, index) {
        if (item.parentElement) item.remove();
        this.children.splice(index, 0, item);
        item.parentElement = this;
      },
      remove() {
        this.parentElement?.children.splice(this.parentElement.children.indexOf(this), 1);
        this.parentElement = null;
      },
      closest(selector) {
        let node = this;
        while (node && nodes.has(node)) {
          if (matchSimple(node, selector)) return node;
          node = node.parentElement;
        }
        return null;
      },
      querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; },
      querySelectorAll(selector) {
        const parts = selector.split(',').map(part => part.trim());
        const found = [];
        for (const part of parts) {
          if (part.includes(':scope')) {
            const childSelector = part.replace(/:scope\s*>\s*/, '');
            for (const child of this.children) if (matchSimple(child, childSelector)) found.push(child);
            continue;
          }
          const steps = part.split(/\s+/);
          for (const candidate of descendants(this)) {
            if (!matchSimple(candidate, steps.at(-1))) continue;
            if (steps.length === 1) { found.push(candidate); continue; }
            let ancestor = candidate.parentElement;
            let matched = true;
            for (let index = steps.length - 2; index >= 0; index -= 1) {
              while (ancestor && nodes.has(ancestor) && !matchSimple(ancestor, steps[index])) ancestor = ancestor.parentElement;
              if (!ancestor || !nodes.has(ancestor)) { matched = false; break; }
              ancestor = ancestor.parentElement;
            }
            if (matched) found.push(candidate);
          }
        }
        return [...new Set(found)];
      },
      dispatchEvent(event) { dispatch(this, event); return !event.defaultPrevented; },
      click() { this.dispatchEvent(new DomEvent('click', { bubbles: true, cancelable: true })); }
    };
    element.classList = {
      contains: name => element.className.split(/\s+/).includes(name),
      add: (...names) => { element.className = [...new Set([...element.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
      remove: (...names) => { element.className = element.className.split(/\s+/).filter(name => name && !names.includes(name)).join(' '); }
    };
    Object.defineProperty(element, 'innerHTML', {
      set(html) {
        for (const child of [...element.children]) child.remove();
        const stack = [element];
        for (const token of html.match(/<\/?[a-z0-9-]+(?:\s+[^<>]*)?>/gi) ?? []) {
          const match = /^<(\/?)([a-z0-9-]+)([^>]*)>$/i.exec(token);
          if (!match) continue;
          if (match[1]) { stack.pop(); continue; }
          const child = make(match[2]);
          const className = /class="([^"]*)"/.exec(match[3]);
          if (className) child.className = className[1];
          stack.at(-1).append(child);
          if (!token.endsWith('/>')) stack.push(child);
        }
      }
    });
    nodes.add(element);
    return element;
  }

  function invoke(node, event, capture) {
    event.currentTarget = node;
    for (const listener of [...node.listeners]) {
      if (listener.type !== event.type || listener.capture !== capture) continue;
      listener.fn.call(node, event);
      if (event.immediateStopped) break;
    }
  }

  function dispatch(target, event) {
    event.target = target;
    const path = [];
    for (let node = target; node; node = node.parentElement) path.push(node);
    for (const node of [...path].reverse()) {
      invoke(node, event, true);
      if (event.propagationStopped) break;
    }
    if (!event.propagationStopped) {
      for (const node of path) {
        invoke(node, event, false);
        if (event.propagationStopped) break;
      }
    }
    if (event.defaultPrevented || event.type !== 'click') return;
    if (target.tagName === 'LABEL' && target.classList.contains('ml-core-directory-check')) {
      const input = target.querySelector('input');
      if (input && !input.disabled) dispatch(input, new DomEvent('click', { bubbles: true, cancelable: true, shiftKey: event.shiftKey }));
      return;
    }
    if (target.tagName === 'INPUT' && target.type === 'checkbox' && !target.disabled) {
      target.checked = !target.checked;
      dispatch(target, new DomEvent('change', { bubbles: true }));
    }
  }

  const windowNode = make('window');
  const documentNode = make('document');
  documentNode.parentElement = windowNode;
  const document = {
    createElement: make,
    body: documentNode,
    node: documentNode
  };
  return { window: windowNode, document, host: documentNode, dispatch };
}

function collectionOf(documentName, docs, extra = {}) {
  const map = new Map(docs.map(doc => [doc.id, doc]));
  return { documentName, pack: null, has: id => map.has(id), get: id => map.get(id), ...extra };
}

function mount(harness, documentName, specs, extra = {}) {
  const { document, host } = harness;
  const section = document.createElement('section');
  section.className = `directory ${documentName.toLowerCase()}-sidebar sidebar-tab`;
  const header = document.createElement('header');
  header.className = 'directory-header';
  const list = document.createElement('ol');
  list.className = 'directory-list';
  section.append(header, list);
  host.append(section);
  const docs = [];
  for (const spec of specs) {
    const doc = { id: spec.id, name: spec.name };
    docs.push(doc);
    if (spec.folder) {
      const folder = document.createElement('li');
      folder.className = 'directory-item folder';
      folder.dataset.folderId = spec.id;
      list.append(folder);
      continue;
    }
    const row = document.createElement('li');
    row.className = `directory-item entry document${spec.scene ? ' scene' : ''}${spec.playlist ? ' playlist' : ''} ${spec.classes ?? ''}`.replace(/\s+/g, ' ').trim();
    if (spec.useDocumentId) row.dataset.documentId = spec.id;
    else row.dataset.entryId = spec.id;
    if (spec.hidden) row.getClientRects = () => [];
    if (spec.playlist) {
      const playlistHeader = document.createElement('header');
      playlistHeader.className = 'playlist-header';
      const caret = document.createElement('i');
      caret.className = 'expand';
      const name = document.createElement('label');
      name.className = 'entry-name playlist-name';
      name.textContent = spec.name;
      const sounds = document.createElement('ol');
      sounds.className = 'playlist-sounds';
      const sound = document.createElement('li');
      sound.className = 'sound';
      sound.dataset.soundId = `${spec.id}-sound`;
      sounds.append(sound);
      playlistHeader.append(caret, name);
      row.append(playlistHeader, sounds);
    } else {
      if (spec.thumbnail) {
        const image = document.createElement('img');
        image.className = 'thumbnail';
        row.append(image);
      }
      const name = document.createElement(spec.nameTag ?? 'a');
      name.className = spec.nameClass ?? 'entry-name';
      name.textContent = spec.name;
      row.append(name);
    }
    list.append(row);
  }
  const app = { collection: collectionOf(documentName, docs.filter((_, index) => !specs[index].folder), extra), element: section };
  return { app, section };
}

async function withGlobals(run) {
  const harness = createHarness();
  const previous = { document: globalThis.document, window: globalThis.window, game: globalThis.game, getComputedStyle: globalThis.getComputedStyle };
  globalThis.document = harness.document;
  globalThis.window = harness.window;
  globalThis.game = { user: { isGM: true } };
  globalThis.getComputedStyle = () => ({ visibility: 'visible' });
  try { await run(harness); }
  finally {
    globalThis.document = previous.document;
    globalThis.window = previous.window;
    globalThis.game = previous.game;
    globalThis.getComputedStyle = previous.getComputedStyle;
  }
}

function checkedIds(section) {
  return [...section.querySelectorAll('.ml-core-directory-check input')]
    .filter(input => input.checked)
    .map(input => input.closest('.directory-item').dataset.entryId ?? input.closest('.directory-item').dataset.documentId);
}

function clickCheckbox(section, id, init = {}) {
  const input = [...section.querySelectorAll('.ml-core-directory-check input')]
    .find(control => (control.closest('.directory-item').dataset.entryId ?? control.closest('.directory-item').dataset.documentId) === id);
  input.dispatchEvent(new DomEvent('click', { bubbles: true, cancelable: true, ...init }));
  return input;
}

test('directory checkboxes follow each sidebar row structure', async () => {
  await withGlobals(harness => {
    const scenes = mount(harness, 'Scene', [{ id: 'scene', name: 'Tavern', thumbnail: true, scene: true }]);
    activateDirectorySelection(scenes.app, scenes.section);
    scenes.section.querySelector('button').click();
    const sceneRow = scenes.section.querySelector('[data-entry-id="scene"]');
    const sceneCheck = sceneRow.querySelector('.ml-core-directory-check');
    assert.equal(sceneRow.children[0], sceneCheck);
    assert.equal(sceneCheck.classList.contains('ml-core-directory-check--scene'), true);
    assert.equal(sceneCheck.querySelector('input').getAttribute('aria-label'), 'Select Tavern');

    const directories = [
      ['Actor', 'dragon', 'Adult Black Dragon'],
      ['Item', 'sword', 'Longsword'],
      ['RollTable', 'loot', 'Treasure'],
      ['Macro', 'torch', 'Torch'],
      ['Cards', 'deck', 'Deck']
    ];
    for (const [documentName, id, name] of directories) {
      const mounted = mount(harness, documentName, [{ id, name, thumbnail: true }]);
      activateDirectorySelection(mounted.app, mounted.section);
      mounted.section.querySelector('button').click();
      const row = mounted.section.querySelector(`[data-entry-id="${id}"]`);
      const check = row.querySelector('.ml-core-directory-check');
      assert.equal(row.children[0].classList.contains('thumbnail'), true, documentName);
      assert.equal(row.children[1], check, documentName);
      assert.equal(row.children[2].classList.contains('entry-name'), true, documentName);
      assert.equal(check.querySelector('input').type, 'checkbox');
    }

    const nested = mount(harness, 'Actor', [{ id: 'nested', name: 'Air Elemental', thumbnail: true, nameClass: 'entry-name', nameTag: 'a' }]);
    const nestedRow = nested.section.querySelector('[data-entry-id="nested"]');
    const stack = harness.document.createElement('div');
    stack.className = 'name-stack';
    const nestedName = nestedRow.querySelector('.entry-name');
    stack.append(nestedName);
    nestedRow.append(stack);
    activateDirectorySelection(nested.app, nested.section);
    nested.section.querySelector('button').click();
    assert.equal(nestedRow.children[0].classList.contains('thumbnail'), true);
    assert.equal(nestedRow.children[1].classList.contains('ml-core-directory-check'), true);
    assert.equal(nestedRow.children[2], stack);

    const journal = mount(harness, 'JournalEntry', [{ id: 'notes', name: 'Session Notes' }]);
    activateDirectorySelection(journal.app, journal.section);
    journal.section.querySelector('button').click();
    const journalRow = journal.section.querySelector('[data-entry-id="notes"]');
    assert.equal(journalRow.children[0].classList.contains('ml-core-directory-check'), true);
    assert.equal(journalRow.children[1].classList.contains('entry-name'), true);
    assert.equal(journalRow.querySelector('img'), null);

    const tables = mount(harness, 'RollTable', [{ id: 'names', name: 'Names', useDocumentId: true, nameClass: 'document-name', nameTag: 'h4' }]);
    activateDirectorySelection(tables.app, tables.section);
    tables.section.querySelector('button').click();
    const tableRow = tables.section.querySelector('[data-document-id="names"]');
    assert.equal(tableRow.children[0].classList.contains('ml-core-directory-check'), true);
    assert.equal(tableRow.children[1].className, 'document-name');

    const playlists = mount(harness, 'Playlist', [
      { id: 'combat', name: 'Combat Music', playlist: true },
      { id: 'explore', name: 'Exploration Music', playlist: true }
    ]);
    activateDirectorySelection(playlists.app, playlists.section);
    playlists.section.querySelector('button').click();
    for (const id of ['combat', 'explore']) {
      const row = playlists.section.querySelector(`[data-entry-id="${id}"]`);
      const header = row.querySelector('.playlist-header');
      const check = row.querySelector('.ml-core-directory-check');
      assert.equal(check.parentElement, header);
      assert.equal(header.children[0].classList.contains('expand'), true);
      assert.equal(header.children[1], check);
      assert.equal(header.children[2].classList.contains('playlist-name'), true);
      assert.equal(row.children[0], header);
      assert.equal(row.querySelector('.sound .ml-core-directory-check'), null);
    }

    const folders = mount(harness, 'Actor', [{ id: 'folder', name: 'SRD', folder: true }, { id: 'npc', name: 'Goblin', thumbnail: true }]);
    activateDirectorySelection(folders.app, folders.section);
    folders.section.querySelector('button').click();
    assert.equal(folders.section.querySelector('[data-folder-id="folder"] .ml-core-directory-check'), null);
    assert.equal(folders.section.querySelectorAll('.ml-core-directory-check').length, 1);
  });
});

test('checkbox events are isolated from directory and sidebar listeners while selection still toggles', async () => {
  await withGlobals(harness => {
    const mounted = mount(harness, 'Scene', [
      { id: 'one', name: 'One', thumbnail: true, scene: true },
      { id: 'two', name: 'Two', thumbnail: true, scene: true },
      { id: 'three', name: 'Three', thumbnail: true, scene: true },
      { id: 'hidden', name: 'Hidden', thumbnail: true, scene: true, hidden: true }
    ]);
    const seen = [];
    const compete = event => { seen.push(`${event.currentTarget.tagName}:${event.type}`); event.preventDefault(); };
    const row = () => mounted.section.querySelector('[data-entry-id="two"]');
    for (const type of DIRECTORY_CHECKBOX_EVENTS) {
      row().addEventListener(type, compete, true);
      mounted.section.addEventListener(type, compete, true);
      harness.host.addEventListener(type, compete, true);
    }
    activateDirectorySelection(mounted.app, mounted.section);
    mounted.section.querySelector('button').click();
    seen.length = 0;
    for (const type of DIRECTORY_CHECKBOX_EVENTS) {
      row().querySelector('input').dispatchEvent(new DomEvent(type, { bubbles: true, cancelable: true }));
    }
    assert.deepEqual(seen, []);
    assert.deepEqual(checkedIds(mounted.section), ['two']);

    row().querySelector('.entry-name').dispatchEvent(new DomEvent('click', { bubbles: true, cancelable: true }));
    assert.equal(seen.includes('LI:click'), true);
    assert.equal(seen.includes('SECTION:click'), true);

    clickCheckbox(mounted.section, 'one');
    clickCheckbox(mounted.section, 'three', { shiftKey: true });
    assert.deepEqual(checkedIds(mounted.section).sort(), ['one', 'three', 'two']);
    assert.equal(checkedIds(mounted.section).includes('hidden'), false);
    clickCheckbox(mounted.section, 'three', { shiftKey: true });
    assert.deepEqual(checkedIds(mounted.section), []);
    clickCheckbox(mounted.section, 'one');
    clickCheckbox(mounted.section, 'three', { shiftKey: true });
    assert.deepEqual(checkedIds(mounted.section).sort(), ['one', 'three', 'two']);

    const clear = [...mounted.section.querySelectorAll('button')].find(button => button.textContent === 'Clear selection');
    clear.click();
    assert.deepEqual(checkedIds(mounted.section), []);
    clickCheckbox(mounted.section, 'three', { shiftKey: true });
    assert.deepEqual(checkedIds(mounted.section), ['three']);

    const name = mounted.section.querySelector('[data-entry-id="one"] .entry-name');
    const before = seen.length;
    name.dispatchEvent(new DomEvent('pointerdown', { bubbles: true, cancelable: true }));
    assert.deepEqual(seen.slice(before), ['DOCUMENT:pointerdown', 'SECTION:pointerdown']);
  });
});

test('players, compendium packs, and unrelated directories get no deletion controls', async () => {
  await withGlobals(harness => {
    const mounted = mount(harness, 'Actor', [{ id: 'a', name: 'A', thumbnail: true }]);
    globalThis.game.user.isGM = false;
    activateDirectorySelection(mounted.app, mounted.section);
    assert.equal(mounted.section.querySelector('.ml-core-directory-selection'), null);
    globalThis.game.user.isGM = true;
    activateDirectorySelection({ collection: collectionOf('Actor', [{ id: 'a', name: 'A' }], { pack: 'world.actors' }), element: mounted.section }, mounted.section);
    assert.equal(mounted.section.querySelector('.ml-core-directory-check'), null);
    activateDirectorySelection({ collection: collectionOf('ChatMessage', [{ id: 'a', name: 'A' }]), element: mounted.section }, mounted.section);
    assert.equal(mounted.section.querySelector('button'), null);
  });
});

test('directory checkbox CSS keeps thumbnail rows, scenes, and playlist headers from collapsing the control', () => {
  const css = readFileSync(new URL('../styles/morelord-components.css', import.meta.url), 'utf8');
  assert.match(css, /\.flexrow > \.ml-core-directory-check[\s\S]*display:\s*inline-flex;/);
  assert.match(css, /\.directory \.directory-item\.flexrow:has\(> \.ml-core-directory-check\)\s*\{[^}]*flex-wrap:\s*nowrap;/);
  assert.match(css, /\.directory \.directory-item\.scene > \.ml-core-directory-check--scene\s*\{[^}]*position:\s*absolute;/);
  assert.match(css, /\.playlist-header > \.ml-core-directory-check > input\[type="checkbox"\]\s*\{[^}]*appearance:\s*auto;/);
  assert.match(css, /min-width:\s*1rem;/);
  assert.match(css, /z-index:\s*3;/);
});
