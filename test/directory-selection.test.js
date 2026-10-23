import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { activateDirectorySelection, directoryFolderChoices } from '../scripts/ui/directory-selection.js';

const css = readFileSync(new URL('../styles/morelord-components.css', import.meta.url), 'utf8');

test('absolute directory thumbnails shift past the selection checkbox', () => {
  const thumbnail = css.match(/\.directory \.directory-item:not\(\.scene\) > \.ml-core-directory-check \+ \.thumbnail[\s\S]*?\}/);
  assert.ok(thumbnail, 'thumbnail offset rule exists');
  assert.match(thumbnail[0], /\.directory \.directory-item:not\(\.scene\) > \.ml-core-directory-check \+ img/);
  assert.match(thumbnail[0], /left:\s*calc\(6px \+ var\(--font-size-16,\s*16px\) \+ 8px\)/);
  const name = css.match(/\.directory \.directory-item > \.ml-core-directory-check \+ \.entry-name[\s\S]*?\}/);
  assert.ok(name, 'adjacent name padding rule exists');
  assert.match(name[0], /\.directory \.directory-item > \.ml-core-directory-check \+ \.document-name/);
  assert.match(name[0], /padding-left:\s*0/);
});

function installDom() {
  class Element {
    constructor(tag) {
      this.tagName = String(tag).toUpperCase();
      this.nodeType = 1;
      this.childNodes = [];
      this.parentElement = null;
      this.className = '';
      this.attributes = new Map();
      this.listeners = {};
      this.disabled = false;
      this.type = '';
      this._checked = false;
      this._value = '';
      this._text = '';
      this._dataset = {};
      this.dataset = new Proxy(this._dataset, {
        set: (target, key, value) => {
          target[key] = String(value);
          this.attributes.set(`data-${String(key).replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)}`, String(value));
          return true;
        },
        get: (target, key) => target[key]
      });
    }
    set checked(value) { this._checked = Boolean(value); }
    get checked() { return this._checked; }
    set value(value) {
      this._value = value == null ? '' : String(value);
      this.attributes.set('value', this._value);
    }
    get value() { return this._value; }
    set textContent(value) {
      this._text = String(value ?? '');
      this.childNodes = [];
    }
    get textContent() {
      return this.childNodes.length ? this.childNodes.map(child => child.textContent ?? '').join('') : this._text;
    }
    set innerHTML(html) {
      this.childNodes = [];
      const stack = [this];
      const pattern = /<\/?([a-zA-Z0-9-]+)([^>]*)>|([^<]+)/g;
      let match;
      while ((match = pattern.exec(html))) {
        if (match[3]) continue;
        if (html[match.index + 1] === '/') { stack.pop(); continue; }
        const child = new Element(match[1]);
        const attributes = /([^\s=]+)(?:="([^"]*)")?/g;
        let attribute;
        while ((attribute = attributes.exec(match[2] ?? ''))) {
          if (attribute[1] === 'class') child.className = attribute[2] ?? '';
          else child.setAttribute(attribute[1], attribute[2] ?? '');
        }
        stack.at(-1).append(child);
        if (!match[0].endsWith('/>') && !['input', 'img'].includes(match[1].toLowerCase())) stack.push(child);
      }
    }
    get outerHTML() {
      const attributes = [];
      if (this.className) attributes.push(`class="${escapeHtml(this.className)}"`);
      for (const [name, value] of this.attributes) attributes.push(`${name}="${escapeHtml(value)}"`);
      const tag = this.tagName.toLowerCase();
      const inner = this.childNodes.length
        ? this.childNodes.map(child => child.outerHTML).join('')
        : escapeHtml(this._text);
      if (tag === 'input' || tag === 'img') return `<${tag}${attributes.length ? ` ${attributes.join(' ')}` : ''}>`;
      return `<${tag}${attributes.length ? ` ${attributes.join(' ')}` : ''}>${inner}</${tag}>`;
    }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    append(...nodes) {
      for (const node of nodes) {
        node.remove();
        node.parentElement = this;
        this.childNodes.push(node);
      }
    }
    prepend(...nodes) {
      for (const node of [...nodes].reverse()) {
        node.remove();
        node.parentElement = this;
        this.childNodes.unshift(node);
      }
    }
    remove() {
      this.parentElement?.childNodes?.splice?.(this.parentElement.childNodes.indexOf(this), 1);
      this.parentElement = null;
    }
    addEventListener(type, listener) { (this.listeners[type] ??= []).push(listener); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
    querySelectorAll(selector) {
      const matches = [];
      for (const part of selector.split(',')) collect(this, selectorSteps(part.trim()), 0, matches);
      return matches;
    }
    closest(selector) {
      let node = this;
      while (node) {
        if (node.nodeType === 1 && matchesSimple(node, selector)) return node;
        node = node.parentElement;
      }
      return null;
    }
    focus() {}
    getClientRects() { return [{}]; }
    click() {
      if (this.disabled) return;
      const event = { preventDefault() {}, stopPropagation() {}, target: this, currentTarget: this };
      if (this.tagName === 'INPUT' && this.type === 'checkbox') this._checked = !this._checked;
      for (const listener of this.listeners.click ?? []) listener(event);
      if (this.tagName === 'INPUT' && this.type === 'checkbox') for (const listener of this.listeners.change ?? []) listener(event);
    }
  }
  globalThis.document = { createElement: tag => new Element(tag) };
  globalThis.getComputedStyle = () => ({ visibility: 'visible' });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function matchesSimple(element, selector) {
  let rest = selector;
  const classes = [];
  rest = rest.replace(/\.([A-Za-z0-9_-]+)/g, (_, name) => { classes.push(name); return ''; });
  const attributes = [];
  rest = rest.replace(/\[([^\]=\s]+)(?:=["']?([^"'\]]+)["']?)?\]/g, (_, name, value) => { attributes.push([name, value]); return ''; });
  const tag = rest.trim();
  if (tag && tag !== '*' && element.tagName.toLowerCase() !== tag.toLowerCase()) return false;
  const classList = element.className.split(/\s+/).filter(Boolean);
  if (!classes.every(name => classList.includes(name))) return false;
  return attributes.every(([name, value]) => element.attributes.has(name) && (value == null || element.attributes.get(name) === value));
}

function selectorSteps(selector) {
  return [...selector.replace(/^:scope\s*/, '').matchAll(/\s*(>)?\s*([^\s>]+)/g)].map(match => ({ direct: match[1] === '>', selector: match[2] }));
}

function descendants(element) {
  const nodes = [];
  for (const child of element.childNodes ?? []) nodes.push(child, ...descendants(child));
  return nodes;
}

function collect(scope, steps, index, matches) {
  if (index >= steps.length) { matches.push(scope); return; }
  const step = steps[index];
  const nodes = step.direct ? (scope.childNodes ?? []) : descendants(scope);
  for (const node of nodes) if (matchesSimple(node, step.selector)) collect(node, steps, index + 1, matches);
}

function directoryApp(entries, { folders, updateDocuments, documentName = 'Actor' } = {}) {
  const docs = new Map(entries.map(entry => [entry.id, { folder: null, update: null, ...entry }]));
  const updates = [];
  const collection = {
    documentName,
    pack: null,
    folders,
    has: id => docs.has(id),
    get: id => docs.get(id),
    delete: id => docs.delete(id),
    documentClass: {
      updateDocuments: updateDocuments === undefined ? async batch => { updates.push(batch); } : updateDocuments,
      deleteDocuments: async () => {}
    }
  };
  const root = document.createElement('section');
  root.className = 'directory';
  const header = document.createElement('header');
  header.className = 'directory-header';
  const list = document.createElement('ol');
  for (const entry of entries) {
    const row = document.createElement('li');
    row.className = `directory-item ${documentName.toLowerCase()}`;
    row.dataset.entryId = entry.id;
    const thumbnail = document.createElement('img');
    thumbnail.className = 'thumbnail';
    const name = document.createElement('h4');
    name.className = 'entry-name';
    name.textContent = entry.name;
    row.append(thumbnail, name);
    list.append(row);
  }
  root.append(header, list);
  return { app: { collection, element: root }, root, docs, updates };
}

function buttons(root) {
  return [...root.querySelectorAll('button')];
}

function buttonByAction(root, action) {
  return buttons(root).find(button => button.attributes.get('data-action') === action);
}

async function tick() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

describe('sidebar multi-select move', { concurrency: false }, () => {
  test('folder choices include nested paths and Root, preferring the collection', () => {
    const prior = globalThis.game;
    globalThis.game = {
      i18n: { lang: 'en' },
      folders: { filter: () => [{ id: 'ignored', name: 'Ignored', type: 'Actor', folder: null }] }
    };
    try {
      const choices = directoryFolderChoices({
        documentName: 'Macro',
        folders: [
          { id: 'child', name: 'Child', type: 'Macro', folder: 'parent' },
          { id: 'parent', name: 'Parent', type: 'Macro', folder: null },
          { id: 'city', name: 'Neverwinter', type: 'Macro', folder: { id: 'child' } },
          { id: 'loop', name: 'Loop', type: 'Macro', folder: 'loop' },
          { id: 'foreign', name: 'Actor folder', type: 'Actor', folder: null }
        ]
      });
      assert.deepEqual(choices.map(choice => [choice.value, choice.label]), [
        ['', 'Root (no folder)'],
        ['loop', 'Loop'],
        ['parent', 'Parent'],
        ['child', 'Parent / Child'],
        ['city', 'Parent / Child / Neverwinter']
      ]);
      const fromWorld = directoryFolderChoices({ documentName: 'Actor' });
      assert.deepEqual(fromWorld.map(choice => choice.label), ['Root (no folder)', 'Ignored']);
    } finally {
      globalThis.game = prior;
    }
  });

  test('Move selected is counted, cancellable, and batch-updates a folder or root', async t => {
    const prior = {
      document: globalThis.document,
      game: globalThis.game,
      foundry: globalThis.foundry,
      ui: globalThis.ui,
      getComputedStyle: globalThis.getComputedStyle
    };
    t.after(() => Object.assign(globalThis, prior));
    installDom();
    const notes = [];
    globalThis.game = { user: { isGM: true }, i18n: { lang: 'en' }, folders: [] };
    globalThis.ui = {
      notifications: {
        info: message => notes.push(['info', message]),
        error: message => notes.push(['error', message])
      }
    };
    let pending = null;
    globalThis.foundry = { applications: { api: { DialogV2: {
      wait: config => new Promise(resolve => { pending = { config, resolve }; }),
      confirm: async () => false
    } } } };
    const folders = [
      { id: 'parent', name: 'Parent', type: 'Actor', folder: null },
      { id: 'child', name: 'Child', type: 'Actor', folder: 'parent' },
      { id: 'marked', name: '<Folder>', type: 'Actor', folder: null }
    ];
    const { app, root, docs, updates } = directoryApp([
      { id: 'a', name: '<unsafe>' },
      { id: 'b', name: 'Second', folder: { id: 'child' } },
      { id: 'c', name: 'Third' }
    ], { folders });
    activateDirectorySelection(app, root);
    assert.deepEqual(buttons(root).map(button => button.textContent), ['Select multiple']);
    buttons(root)[0].click();
    const idle = buttonByAction(root, 'move-selected');
    assert.equal(idle.textContent, 'Move selected (0)');
    assert.equal(idle.disabled, true);
    assert.equal(buttonByAction(root, 'delete-selected').disabled, true);
    for (const id of ['a', 'b', 'c']) root.querySelector(`[data-entry-id="${id}"] input`).click();
    const ready = buttonByAction(root, 'move-selected');
    assert.equal(ready.disabled, false);
    assert.equal(ready.textContent, 'Move selected (3)');
    assert.deepEqual(buttons(root).map(button => button.attributes.get('data-action')), [
      'toggle-selection', 'select-visible', 'clear-selection', 'move-selected', 'delete-selected'
    ]);
    ready.click();
    await tick();
    assert.match(pending.config.content, /class="[^"]*\bml-dialog-shell\b/);
    assert.match(pending.config.content, /&lt;unsafe&gt;/);
    assert.match(pending.config.content, /&lt;Folder&gt;/);
    const optionAt = value => pending.config.content.indexOf(`<option value="${value}">`);
    assert.ok(['', 'marked', 'parent', 'child'].every(value => optionAt(value) >= 0));
    assert.ok(optionAt('') < optionAt('marked') && optionAt('marked') < optionAt('parent') && optionAt('parent') < optionAt('child'));
    assert.match(pending.config.content, /<option value="child">Parent \/ Child<\/option>/);
    assert.match(pending.config.content, /<option value="">Root \(no folder\)<\/option>/);
    assert.equal(pending.config.buttons.find(button => button.action === 'cancel').default, true);
    pending.resolve(await pending.config.buttons.find(button => button.action === 'cancel').callback());
    await tick();
    assert.equal(updates.length, 0);
    assert.equal(notes.length, 0);
    assert.equal(buttonByAction(root, 'move-selected').textContent, 'Move selected (3)');

    buttonByAction(root, 'move-selected').click();
    await tick();
    docs.delete('c');
    const move = pending.config.buttons.find(button => button.action === 'move');
    pending.resolve(await move.callback(null, { form: { elements: { folder: { value: 'child' } } } }));
    await tick();
    assert.deepEqual(updates, [[{ _id: 'a', folder: 'child' }, { _id: 'b', folder: 'child' }]]);
    assert.deepEqual(notes, [['info', 'Moved 2 documents to Parent / Child.']]);
    assert.equal(buttonByAction(root, 'move-selected').textContent, 'Move selected (2)');

    notes.length = 0;
    updates.length = 0;
    buttonByAction(root, 'move-selected').click();
    await tick();
    pending.resolve(null);
    await tick();
    assert.equal(updates.length, 0);
    assert.equal(notes.length, 0);

    buttonByAction(root, 'move-selected').click();
    await tick();
    pending.resolve(await move.callback(null, { form: { elements: { folder: { value: '' } } } }));
    await tick();
    assert.deepEqual(updates, [[{ _id: 'a', folder: null }, { _id: 'b', folder: null }]]);
    assert.deepEqual(notes, [['info', 'Moved 2 documents to Root (no folder).']]);
  });

  test('folder updates fall back to document.update when updateDocuments is missing', async t => {
    const prior = {
      document: globalThis.document,
      game: globalThis.game,
      foundry: globalThis.foundry,
      ui: globalThis.ui,
      getComputedStyle: globalThis.getComputedStyle
    };
    t.after(() => Object.assign(globalThis, prior));
    installDom();
    const calls = [];
    globalThis.game = { user: { isGM: true }, folders: [{ id: 'pack', name: 'Pack', type: 'Item', folder: null }] };
    globalThis.ui = { notifications: { info() {}, error(message) { throw new Error(message); } } };
    let pending = null;
    globalThis.foundry = { applications: { api: { DialogV2: {
      wait: config => new Promise(resolve => { pending = { config, resolve }; })
    } } } };
    const { app, root, docs } = directoryApp([
      { id: 'item', name: 'Rope' }
    ], {
      documentName: 'Item',
      updateDocuments: null
    });
    docs.get('item').update = async data => { calls.push(data); };
    activateDirectorySelection(app, root);
    buttons(root)[0].click();
    root.querySelector('input').click();
    buttonByAction(root, 'move-selected').click();
    await tick();
    const move = pending.config.buttons.find(button => button.action === 'move');
    pending.resolve(await move.callback(null, { form: { elements: { folder: { value: 'pack' } } } }));
    await tick();
    assert.deepEqual(calls, [{ folder: 'pack' }]);
    assert.equal(pending.config.window.title, 'Move 1 selected document');
  });
});
