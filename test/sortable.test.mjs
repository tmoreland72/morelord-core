import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { insertionIndex, insertionMarker, orderAfterDrop, reorderIds, sortable } from "../scripts/ui/sortable.js";

const box = (id, left, top, width, height) => ({ id, left, top, width, height });
const vertical = [
  box("a", 0, 0, 200, 40),
  box("b", 0, 48, 200, 40),
  box("c", 0, 96, 200, 40)
];
const row = [
  box("a", 0, 0, 80, 40),
  box("b", 100, 0, 80, 40),
  box("c", 200, 0, 80, 40)
];
const grid = [
  box("a", 0, 0, 100, 80),
  box("b", 110, 0, 100, 80),
  box("c", 0, 90, 100, 80),
  box("d", 110, 90, 100, 80)
];

test("reorderIds moves an id among the others and does not mutate the source", () => {
  const ids = ["a", "b", "c", "d"];
  assert.deepEqual(reorderIds(ids, "b", 0), ["b", "a", "c", "d"]);
  assert.deepEqual(reorderIds(ids, "b", 1), ["a", "b", "c", "d"]);
  assert.deepEqual(reorderIds(ids, "b", 2), ["a", "c", "b", "d"]);
  assert.deepEqual(reorderIds(ids, "b", 3), ["a", "c", "d", "b"]);
  assert.deepEqual(reorderIds(ids, "a", 0), ["a", "b", "c", "d"]);
  assert.deepEqual(reorderIds(ids, "a", 3), ["b", "c", "d", "a"]);
  assert.deepEqual(reorderIds(ids, "d", 0), ["d", "a", "b", "c"]);
  assert.deepEqual(reorderIds(ids, "a", 99), ["b", "c", "d", "a"]);
  assert.deepEqual(reorderIds(ids, "a", -4), ["a", "b", "c", "d"]);
  assert.deepEqual(reorderIds(ids, "c", Number.NaN), ["a", "b", "c", "d"]);
  assert.deepEqual(reorderIds(ids, "missing", 0), ["a", "b", "c", "d"]);
  assert.deepEqual(reorderIds([], "a", 0), []);
  assert.notEqual(reorderIds(ids, "b", 0), ids);
  assert.deepEqual(ids, ["a", "b", "c", "d"]);
});

test("vertical lists insert from the pointer's half of each card", () => {
  assert.deepEqual(orderAfterDrop(vertical, "b", { x: 20, y: 10 }), ["b", "a", "c"]);
  assert.deepEqual(orderAfterDrop(vertical, "b", { x: 20, y: 30 }), ["a", "b", "c"]);
  assert.deepEqual(orderAfterDrop(vertical, "b", { x: 180, y: 120 }), ["a", "c", "b"]);
  assert.deepEqual(orderAfterDrop(vertical, "a", { x: 10, y: 80 }), ["b", "a", "c"]);
  assert.deepEqual(orderAfterDrop(vertical, "c", { x: 10, y: -20 }), ["c", "a", "b"]);
  assert.deepEqual(orderAfterDrop(vertical, "a", { x: 10, y: 400 }), ["b", "c", "a"]);
  assert.deepEqual(orderAfterDrop(vertical, "c", { x: 10, y: 44 }), ["a", "c", "b"]);
  assert.deepEqual(orderAfterDrop(vertical, "b", { x: 10, y: 70 }), ["a", "b", "c"]);
  assert.deepEqual(insertionIndex(vertical, "a", { x: 0, y: 0 }), 0);
  const source = vertical.map(item => ({ ...item }));
  orderAfterDrop(vertical, "c", { x: 10, y: 10 });
  assert.deepEqual(vertical, source);
});

test("a horizontal row uses the pointer's side of each card", () => {
  assert.deepEqual(orderAfterDrop(row, "c", { x: 20, y: 10 }), ["c", "a", "b"]);
  assert.deepEqual(orderAfterDrop(row, "a", { x: 150, y: 80 }), ["b", "a", "c"]);
  assert.deepEqual(orderAfterDrop(row, "a", { x: 250, y: -30 }), ["b", "c", "a"]);
  assert.deepEqual(orderAfterDrop(row, "b", { x: 140, y: 10 }), ["a", "b", "c"]);
});

test("grids insert within the pointer's row, including a short last row", () => {
  assert.deepEqual(orderAfterDrop(grid, "a", { x: 170, y: 40 }), ["b", "a", "c", "d"]);
  assert.deepEqual(orderAfterDrop(grid, "a", { x: 20, y: 120 }), ["b", "a", "c", "d"]);
  assert.deepEqual(orderAfterDrop(grid, "a", { x: 170, y: 120 }), ["b", "c", "d", "a"]);
  assert.deepEqual(orderAfterDrop(grid, "d", { x: 20, y: 20 }), ["d", "a", "b", "c"]);
  assert.deepEqual(orderAfterDrop(grid, "b", { x: 160, y: 40 }), ["a", "b", "c", "d"]);
  const short = grid.slice(0, 3);
  assert.deepEqual(orderAfterDrop(short, "a", { x: 80, y: 130 }), ["b", "c", "a"]);
  assert.deepEqual(orderAfterDrop(short, "b", { x: 20, y: 110 }), ["a", "b", "c"]);
});

test("rtl rows read from the right", () => {
  const rtl = [box("a", 120, 0, 80, 40), box("b", 20, 0, 80, 40)];
  assert.deepEqual(orderAfterDrop(rtl, "b", { x: 190, y: 10 }, "rtl"), ["b", "a"]);
  assert.deepEqual(orderAfterDrop(rtl, "a", { x: 10, y: 10 }, "rtl"), ["b", "a"]);
  assert.deepEqual(orderAfterDrop(rtl, "b", { x: 130, y: 10 }, "rtl"), ["a", "b"]);
});

test("a stack of wide cards stays vertical and a wide row uses x", () => {
  const stack = [box("a", 0, 0, 180, 36), box("b", 0, 48, 180, 36)];
  assert.deepEqual(orderAfterDrop(stack, "a", { x: 170, y: 70 }), ["b", "a"]);
  assert.deepEqual(orderAfterDrop([box("a", 0, 0, 180, 36), box("b", 200, 0, 180, 36)], "a", { x: 20, y: 80 }), ["a", "b"]);
});

test("insertion lines sit on the gap the new order will use", () => {
  const between = insertionMarker(vertical, "a", { x: 12, y: 80 });
  assert.equal(between.index, 1);
  assert.equal(between.orientation, "horizontal");
  assert.equal(between.top, 88);
  assert.equal(between.left, 0);
  assert.equal(between.length, 200);
  const beforeFirst = insertionMarker(vertical, "c", { x: 12, y: 8 });
  assert.deepEqual(beforeFirst, { index: 0, orientation: "horizontal", top: 0, left: 0, length: 200 });
  const gridLine = insertionMarker(grid, "a", { x: 170, y: 40 });
  assert.equal(gridLine.index, 1);
  assert.equal(gridLine.orientation, "vertical");
  assert.equal(gridLine.left, 210);
  assert.equal(gridLine.top, 0);
  assert.equal(gridLine.length, 80);
  const end = insertionMarker(grid.slice(0, 3), "a", { x: 80, y: 130 });
  assert.equal(end.index, 2);
  assert.equal(end.orientation, "vertical");
  assert.equal(end.left, 100);
  assert.equal(end.top, 90);
});

test("an unknown id or a missing point leaves the order unchanged", () => {
  const ids = grid.map(item => item.id);
  const copy = orderAfterDrop(grid, "missing", { x: 1, y: 1 });
  assert.deepEqual(copy, ids);
  assert.notEqual(copy, ids);
  assert.deepEqual(orderAfterDrop(vertical, "b", null), ["a", "b", "c"]);
  assert.equal(insertionIndex([], "a", { x: 0, y: 0 }), 0);
});

test("the core api publishes sortable.bind", () => {
  const main = readFileSync(new URL("../scripts/main.js", import.meta.url), "utf8");
  assert.match(main, /import \{ sortable \} from "\.\/ui\/sortable\.js"/);
  assert.match(main, /mergeCoreApi\(api, \{[\s\S]*\n\s*sortable,/);
  assert.equal(typeof sortable.bind, "function");
  assert.equal(sortable.reorderIds, reorderIds);
});

test("bind requires a container, a reorder callback, and Foundry DragDrop", () => {
  assert.throws(() => sortable.bind(null, { onReorder() {} }), /container element/);
  assert.throws(() => sortable.bind({ querySelectorAll() {}, classList: { add() {} } }, {}), /onReorder/);
  const previous = globalThis.foundry;
  delete globalThis.foundry;
  assert.throws(() => sortable.bind(fakeRoot(), { onReorder() {} }), /foundry\.applications\.ux\.DragDrop/);
  globalThis.foundry = previous;
});

test("dragging shows the whole card, a landing line, and reorders on drop", () => {
  const foundry = installDragDrop();
  const document = installDocument();
  const root = fakeRoot();
  const cards = [
    card("a", { left: 10, top: 0, width: 200, height: 40 }),
    card("b", { left: 10, top: 48, width: 200, height: 40 }),
    card("c", { left: 10, top: 96, width: 200, height: 40 })
  ];
  for (const entry of cards) root.appendChild(entry);
  const orders = [];
  const control = sortable.bind(root, { onReorder(ids) { orders.push(ids); } });
  const token = root.getAttribute("data-ml-sortable");
  assert.match(token, /^\d+$/);
  assert.equal(cards[0].getAttribute("draggable"), "true");
  assert.equal(cards[0].classList.contains("ml-sortable__item"), true);
  assert.equal(foundry.instances[0].dragSelector, "[data-ml-sortable-id]");
  assert.equal(foundry.instances[0].dropSelector, `[data-ml-sortable="${token}"]`);

  const external = dragEvent({ currentTarget: root, clientX: 20, clientY: 10 });
  root.ondragover(external);
  assert.equal(external.defaultPrevented, false);

  const image = cards[0].querySelector("img");
  assert.equal(image.getAttribute("draggable"), "false");
  const start = dragEvent({
    currentTarget: cards[0],
    target: cards[0],
    clientX: 30,
    clientY: 12
  });
  cards[0].ondragstart(start);
  const transfer = start.dataTransfer;
  assert.equal(transfer.data["application/x-morelord-sortable"], "a");
  assert.equal(transfer.image.classList.contains("ml-sortable__drag-image"), true);
  assert.equal(transfer.image.classList.contains("ml-sortable__origin"), false);
  assert.equal(transfer.image.classList.contains("dragging"), false);
  assert.notEqual(transfer.image, cards[0]);
  assert.equal(transfer.image.getAttribute("data-ml-sortable-id"), "a");
  assert.equal(transfer.image.querySelector("[id]"), undefined);
  assert.deepEqual(transfer.imageOffset, { x: 20, y: 12 });
  assert.equal(cards[0].classList.contains("ml-sortable__origin"), true);
  assert.equal(document.body.children.some(node => node.classList.contains("ml-sortable__drag-host")), true);

  const over = dragEvent({ currentTarget: root, clientX: 40, clientY: 80 });
  root.ondragover(over);
  assert.equal(over.defaultPrevented, true);
  assert.equal(over.dataTransfer.dropEffect, "move");
  const indicator = document.body.children.find(node => node.classList.contains("ml-sortable__indicator"));
  assert.ok(indicator);
  assert.equal(indicator.style.width, "200px");
  assert.equal(indicator.style.height, "3px");
  assert.equal(indicator.style.top, "86.5px");

  root.dispatch("dragleave", dragEvent({ currentTarget: root, relatedTarget: cards[0], clientX: 20, clientY: 80 }));
  assert.equal(document.body.children.some(node => node.classList.contains("ml-sortable__indicator")), true);
  root.dispatch("dragleave", dragEvent({ currentTarget: root, relatedTarget: null, clientX: -10, clientY: -10 }));
  assert.equal(document.body.children.some(node => node.classList.contains("ml-sortable__indicator")), false);
  root.ondragover(dragEvent({ currentTarget: root, clientX: 40, clientY: 80 }));

  const dropped = dragEvent({ currentTarget: root, clientX: 40, clientY: 80 });
  root.ondrop(dropped);
  assert.equal(dropped.defaultPrevented, true);
  assert.deepEqual(orders, [["b", "a", "c"]]);
  assert.equal(cards[0].classList.contains("ml-sortable__origin"), false);
  assert.equal(document.body.children.some(node => node.classList.contains("ml-sortable__indicator")), false);
  assert.equal(document.body.children.some(node => node.classList.contains("ml-sortable__drag-host")), false);
  cards[0].ondragend(dragEvent({ currentTarget: cards[0] }));
  assert.deepEqual(orders, [["b", "a", "c"]]);

  cards[0].ondragstart(dragEvent({ currentTarget: cards[0], target: cards[0], clientX: 20, clientY: 10 }));
  root.ondrop(dragEvent({ currentTarget: root, clientX: 20, clientY: 10 }));
  cards[0].ondragend(dragEvent({ currentTarget: cards[0] }));
  assert.deepEqual(orders, [["b", "a", "c"]]);

  cards[1].ondragstart(dragEvent({ currentTarget: cards[1], target: cards[1], clientX: 20, clientY: 60 }));
  cards[1].ondragend(dragEvent({ currentTarget: cards[1] }));
  assert.deepEqual(orders, [["b", "a", "c"]]);
  assert.equal(cards[1].classList.contains("ml-sortable__origin"), false);
  assert.equal(cards[1].classList.contains("dragging"), false);

  const button = element("button");
  cards[2].appendChild(button);
  const nested = dragEvent({ currentTarget: cards[2], target: button, clientX: 20, clientY: 100 });
  cards[2].ondragstart(nested);
  assert.equal(nested.defaultPrevented, true);
  assert.equal(cards[2].classList.contains("ml-sortable__origin"), false);
  assert.equal(cards[2].classList.contains("dragging"), false);

  const added = card("d", { left: 10, top: 144, width: 200, height: 40 });
  root.appendChild(added);
  control.refresh();
  assert.equal(typeof added.ondragstart, "function");
  assert.equal(added.getAttribute("draggable"), "true");

  let second;
  sortable.bind(root, { onReorder(ids) { second = ids; } });
  added.ondragstart(dragEvent({ currentTarget: added, target: added, clientX: 20, clientY: 150 }));
  root.ondrop(dragEvent({ currentTarget: root, clientX: 20, clientY: 8 }));
  assert.deepEqual(second, ["d", "a", "b", "c"]);

  const errors = [];
  const consoleError = console.error;
  console.error = (...args) => errors.push(args);
  try {
    sortable.bind(root, { onReorder() { throw new Error("save failed"); } });
    cards[0].ondragstart(dragEvent({ currentTarget: cards[0], target: cards[0], clientX: 20, clientY: 8 }));
    root.ondrop(dragEvent({ currentTarget: root, clientX: 20, clientY: 150 }));
    assert.equal(cards[0].classList.contains("ml-sortable__origin"), false);
    assert.equal(errors.length, 1);
  } finally {
    console.error = consoleError;
  }

  control.destroy();
  assert.equal(root.hasAttribute("data-ml-sortable"), false);
  assert.equal(cards[0].ondragstart, null);
  assert.equal(cards[0].hasAttribute("draggable"), false);
  assert.equal(image.hasAttribute("draggable"), false);
  assert.equal(image.hasAttribute("data-ml-sortable-frozen"), false);
  control.destroy();
  restore(foundry, document);
});

function dragEvent({ currentTarget, target = currentTarget, clientX = 0, clientY = 0, relatedTarget = null }) {
  return {
    currentTarget,
    target,
    clientX,
    clientY,
    relatedTarget,
    defaultPrevented: false,
    dataTransfer: {
      data: {},
      effectAllowed: "",
      dropEffect: "",
      setData(type, value) { this.data[type] = value; },
      setDragImage(image, x, y) { this.image = image; this.imageOffset = { x, y }; }
    },
    preventDefault() { this.defaultPrevented = true; }
  };
}

function installDragDrop() {
  const previous = globalThis.foundry;
  const instances = [];
  class DragDrop {
    constructor(config = {}) {
      this.dragSelector = config.dragSelector ?? null;
      this.dropSelector = config.dropSelector ?? null;
      this.permissions = config.permissions ?? {};
      this.callbacks = config.callbacks ?? {};
      instances.push(this);
    }
    can(action, selector) {
      const allowed = this.permissions[action];
      return typeof allowed === "function" ? allowed(selector) !== false : true;
    }
    callback(event, action) {
      return this.callbacks[action]?.(event);
    }
    bind(html) {
      const canDrag = Boolean(this.dragSelector) && this.can("dragstart", this.dragSelector);
      for (const element of this.dragSelector ? html.querySelectorAll(this.dragSelector) : []) {
        element.setAttribute("draggable", canDrag ? "true" : "false");
        element.ondragstart = canDrag ? event => this._handleDragStart(event) : null;
        element.ondragend = event => this._handleDragEnd(event);
      }
      const targets = !this.dropSelector || html.matches(this.dropSelector) ? [html] : html.querySelectorAll(this.dropSelector);
      if (this.can("drop", this.dropSelector)) {
        for (const element of targets) {
          element.ondragover = event => this._handleDragOver(event);
          element.ondrop = event => this._handleDrop(event);
        }
      }
      return this;
    }
    _handleDragStart(event) {
      event.currentTarget.classList.add("dragging");
      this.callback(event, "dragstart");
    }
    _handleDragEnd(event) {
      event.currentTarget.classList.remove("dragging");
      this.callback(event, "dragend");
    }
    _handleDragOver(event) {
      event.preventDefault();
      this.callback(event, "dragover");
    }
    _handleDrop(event) {
      event.preventDefault();
      return this.callback(event, "drop");
    }
  }
  globalThis.foundry = { applications: { ux: { DragDrop } } };
  return { previous, instances };
}

function installDocument() {
  const previous = globalThis.document;
  const body = element("body");
  const document = {
    body,
    createElement(tag) { return element(tag); }
  };
  body.parentElement = document;
  globalThis.document = document;
  return { previous, body };
}

function restore(foundry, document) {
  if (foundry.previous === undefined) delete globalThis.foundry;
  else globalThis.foundry = foundry.previous;
  if (document.previous === undefined) delete globalThis.document;
  else globalThis.document = document.previous;
}

function fakeRoot() {
  return element("div");
}

function card(id, rect) {
  const node = element("article", rect);
  node.setAttribute("data-ml-sortable-id", id);
  const title = element("span");
  title.setAttribute("id", `${id}-title`);
  const image = element("img", rect);
  node.appendChild(title);
  node.appendChild(image);
  return node;
}

function element(tag, rect = { left: 0, top: 0, width: 0, height: 0 }) {
  const classes = new Set();
  const attributes = new Map();
  const children = [];
  const listeners = new Map();
  const node = {
    tag,
    children,
    parentElement: null,
    style: {},
    classList: {
      add(...names) { for (const name of names) if (name) classes.add(name); },
      remove(...names) { for (const name of names) classes.delete(name); },
      contains(name) { return classes.has(name); }
    },
    set className(value) {
      classes.clear();
      for (const name of String(value).split(/\s+/)) if (name) classes.add(name);
    },
    get className() { return [...classes].join(" "); },
    get isConnected() { return Boolean(node.parentElement); },
    setAttribute(name, value) { attributes.set(name, String(value)); },
    getAttribute(name) { return attributes.has(name) ? attributes.get(name) : null; },
    hasAttribute(name) { return attributes.has(name); },
    removeAttribute(name) { attributes.delete(name); },
    getBoundingClientRect() {
      return { ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height };
    },
    matches(selector) { return matches(node, selector); },
    querySelectorAll(selector) {
      const parts = selector.split(",").map(part => part.trim());
      return descendants(node).filter(child => parts.some(part => matches(child, part)));
    },
    querySelector(selector) { return node.querySelectorAll(selector)[0]; },
    closest(selector) {
      let current = node;
      while (current?.matches) {
        if (selector.split(",").some(part => current.matches(part))) return current;
        current = current.parentElement;
      }
      return null;
    },
    contains(other) {
      return other === node || children.some(child => child === other || child.contains?.(other));
    },
    appendChild(child) {
      child.parentElement = node;
      children.push(child);
      return child;
    },
    cloneNode() {
      const copy = element(tag, rect);
      copy.className = node.className;
      for (const [name, value] of attributes) copy.setAttribute(name, value);
      for (const child of children) copy.appendChild(child.cloneNode(true));
      return copy;
    },
    remove() {
      const parent = node.parentElement;
      if (!parent?.children) {
        node.parentElement = null;
        return;
      }
      const index = parent.children.indexOf(node);
      if (index >= 0) parent.children.splice(index, 1);
      node.parentElement = null;
    },
    addEventListener(type, handler) {
      const list = listeners.get(type) ?? [];
      list.push(handler);
      listeners.set(type, list);
    },
    removeEventListener(type, handler) {
      listeners.set(type, (listeners.get(type) ?? []).filter(entry => entry !== handler));
    },
    dispatch(type, event) {
      for (const handler of listeners.get(type) ?? []) handler(event);
    }
  };
  return node;
}

function descendants(node) {
  return node.children.flatMap(child => [child, ...descendants(child)]);
}

function matches(node, selector) {
  const trimmed = selector.trim();
  if (trimmed.startsWith("[")) {
    const match = trimmed.match(/^\[([^\]=\s]+)(?:="([^"]*)")?\]$/);
    if (!match || !node.hasAttribute?.(match[1])) return false;
    return match[2] === undefined || node.getAttribute(match[1]) === match[2];
  }
  return node.tag === trimmed;
}
