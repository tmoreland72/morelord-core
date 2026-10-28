/**
 * Shared list and grid reordering on Foundry's DragDrop controller.
 *
 * Foundry 13 and 14 (Core's minimum and verified versions) both expose
 * `foundry.applications.ux.DragDrop` with `dragSelector`, `dropSelector`,
 * `permissions`, `callbacks` (dragstart, dragover, drop, dragenter, dragleave,
 * dragend), and `bind(html)`. `DragDrop.createDragImage` only accepts an
 * HTMLImageElement, so the moving card is a clone of the whole item passed to
 * `dataTransfer.setDragImage`.
 *
 * The base class is constructed directly. dnd5e replaces the configured
 * implementation (`DragDrop.implementation` / `CONFIG.ux.DragDrop`) with a
 * subclass whose `bind` freezes the drop permission and whose dragstart
 * consumes document payloads. That subclass is for compendium drops, not for
 * reordering a module's own cards.
 */

const SORTABLE_TYPE = "application/x-morelord-sortable";
const INTERACTIVE = "input, textarea, select, button, a, summary, [contenteditable='true']";
const controllers = new WeakMap();
let sequence = 0;

/**
 * Move `draggedId` to `insertAt` among the other ids.
 * `insertAt` 0 places it first. The original index is a no-op.
 * @param {string[]} ids
 * @param {string} draggedId
 * @param {number} insertAt
 * @returns {string[]}
 */
export function reorderIds(ids, draggedId, insertAt) {
  const source = Array.isArray(ids) ? [...ids] : [];
  const from = source.indexOf(draggedId);
  if (from < 0) return source;
  const [item] = source.splice(from, 1);
  const target = Number.isFinite(insertAt) ? Math.trunc(insertAt) : from;
  source.splice(Math.max(0, Math.min(target, source.length)), 0, item);
  return source;
}

/**
 * Index at which to insert `draggedId` among the other items.
 * Boxes use client pixels: `{id, top, left, width, height}`.
 * A vertical stack compares the pointer with each row's midpoint.
 * A single row or a wrapping grid compares it within the pointer's row.
 * @param {{id: string, top: number, left: number, width: number, height: number}[]} items
 * @param {string} draggedId
 * @param {{x: number, y: number}} point
 * @param {"ltr"|"rtl"} [direction="ltr"]
 * @returns {number}
 */
export function insertionIndex(items, draggedId, point, direction = "ltr") {
  const list = Array.isArray(items) ? items : [];
  const from = list.findIndex(item => item.id === draggedId);
  if (!list.length) return 0;
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return Math.max(from, 0);
  const rest = from < 0 ? list.slice() : list.filter((_, index) => index !== from);
  if (!rest.length) return 0;
  const vertical = usesVerticalAxis(groupRows(list));
  const rows = groupRows(rest);
  if (!vertical && rows.length === 1) return gapInRow(rest, rows[0], point, direction, false);
  if (point.y < rowBounds(rows[0]).top) return 0;
  for (let index = 0; index < rows.length; index += 1) {
    const bounds = rowBounds(rows[index]);
    const next = rows[index + 1] ? rowBounds(rows[index + 1]) : null;
    if (next && point.y > bounds.bottom && point.y < next.top) return rest.indexOf(rows[index + 1][0]);
    if (point.y <= bounds.bottom) return gapInRow(rest, rows[index], point, direction, vertical);
  }
  return rest.length;
}

/** Ids after dropping `draggedId` at `point`. The input items are not reordered. */
export function orderAfterDrop(items, draggedId, point, direction = "ltr") {
  const ids = (Array.isArray(items) ? items : []).map(item => item.id);
  if (!ids.includes(draggedId)) return ids.slice();
  return reorderIds(ids, draggedId, insertionIndex(items, draggedId, point, direction));
}

/** Client-pixel placement of the landing line for the same index as `insertionIndex`. */
export function insertionMarker(items, draggedId, point, direction = "ltr") {
  const list = Array.isArray(items) ? items : [];
  const index = insertionIndex(list, draggedId, point, direction);
  const from = list.findIndex(item => item.id === draggedId);
  const rest = from < 0 ? list.slice() : list.filter((_, itemIndex) => itemIndex !== from);
  const vertical = usesVerticalAxis(groupRows(list));
  const reading = direction === "rtl" ? "rtl" : "ltr";
  if (!rest.length) {
    const anchor = list[0];
    return { index: 0, orientation: "horizontal", top: anchor?.top ?? 0, left: anchor?.left ?? 0, length: anchor?.width ?? 0 };
  }
  if (vertical) {
    if (index <= 0) {
      const first = rest[0];
      return { index, orientation: "horizontal", top: first.top, left: first.left, length: first.width };
    }
    const previous = rest[Math.min(index, rest.length) - 1];
    return { index, orientation: "horizontal", top: previous.top + previous.height, left: previous.left, length: previous.width };
  }
  if (index <= 0) {
    const first = rest[0];
    return { index, orientation: "vertical", top: first.top, left: leadingEdge(first, reading, true), length: first.height };
  }
  if (index >= rest.length) {
    const last = rest.at(-1);
    return { index, orientation: "vertical", top: last.top, left: leadingEdge(last, reading, false), length: last.height };
  }
  const previous = rest[index - 1];
  const next = rest[index];
  if (overlaps(previous, next)) {
    return { index, orientation: "vertical", top: next.top, left: leadingEdge(next, reading, true), length: Math.max(previous.height, next.height) };
  }
  const previousEdge = leadingEdge(previous, reading, false);
  const nextEdge = leadingEdge(next, reading, true);
  const previousDistance = Math.hypot(point.x - previousEdge, point.y - (previous.top + previous.height / 2));
  const nextDistance = Math.hypot(point.x - nextEdge, point.y - (next.top + next.height / 2));
  if (previousDistance <= nextDistance) {
    return { index, orientation: "vertical", top: previous.top, left: previousEdge, length: previous.height };
  }
  return { index, orientation: "vertical", top: next.top, left: nextEdge, length: next.height };
}

/**
 * Bind Foundry DragDrop on `root` so its items can be reordered.
 * Call `refresh()` after the same element gains new item nodes.
 * Calling `bind` again on the same element updates the options.
 * @param {HTMLElement} root
 * @param {object} options
 * @param {string} [options.itemSelector="[data-ml-sortable-id]"]
 * @param {string} [options.idAttribute="data-ml-sortable-id"]
 * @param {(element: HTMLElement) => string} [options.id]
 * @param {"ltr"|"rtl"} [options.direction] Defaults to the container's computed direction.
 * @param {(element: HTMLElement) => boolean} [options.canDrag]
 * @param {(newOrderIds: string[]) => void} options.onReorder Called only when the drop changes the order.
 * @returns {{refresh: () => void, destroy: () => void}}
 */
export function bindSortable(root, options) {
  if (!root?.querySelectorAll || !root.classList) {
    throw new Error("Morelord sortable.bind requires a container element.");
  }
  const existing = controllers.get(root);
  if (existing && !existing.destroyed) {
    existing.configure(options);
    existing.refresh();
    return existing.publicApi;
  }

  const settings = normalize(options);
  dragDropClass();
  const token = String(++sequence);
  const state = { active: false, draggedId: "", origin: null, dragHost: null, indicator: null };
  let destroyed = false;

  function readId(element) {
    try {
      const value = settings.id ? settings.id(element) : element.getAttribute?.(settings.idAttribute);
      return value == null ? "" : String(value).trim();
    } catch (error) {
      console.error("Morelord sortable could not read an item id.", error);
      return "";
    }
  }

  function direction() {
    if (settings.direction === "rtl" || settings.direction === "ltr") return settings.direction;
    return globalThis.getComputedStyle?.(root)?.direction === "rtl" ? "rtl" : "ltr";
  }

  function measure() {
    const boxes = [];
    for (const element of root.querySelectorAll(settings.itemSelector)) {
      const id = readId(element);
      if (!id) continue;
      const rect = element.getBoundingClientRect();
      boxes.push({ id, top: rect.top, left: rect.left, width: rect.width, height: rect.height, element });
    }
    return boxes;
  }

  function cleanup() {
    state.dragHost?.remove();
    state.dragHost = null;
    state.indicator?.remove();
    state.indicator = null;
    state.origin?.classList.remove("ml-sortable__origin", "dragging");
    state.origin = null;
    state.draggedId = "";
    state.active = false;
  }

  function onDragStart(event) {
    const element = event.currentTarget;
    if (!element?.getBoundingClientRect || !element.classList) return;
    const blocked = blockedControl(element, event.target);
    let allowed = true;
    if (!blocked && settings.canDrag) {
      try {
        allowed = settings.canDrag(element) !== false;
      } catch (error) {
        console.error("Morelord sortable canDrag failed.", error);
        allowed = false;
      }
    }
    const id = blocked || !allowed ? "" : readId(element);
    if (!id) {
      event.preventDefault();
      element.classList.remove("dragging");
      return;
    }
    mountDragImage(event, element, state);
    element.classList.add("ml-sortable__origin");
    state.origin = element;
    state.draggedId = id;
    state.active = true;
    try {
      event.dataTransfer?.setData("text/plain", id);
      event.dataTransfer?.setData(SORTABLE_TYPE, id);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
    } catch {
      // Some browsers reject custom types. The in-memory drag still reorders.
    }
  }

  function onDragOver(event) {
    if (!state.active || !state.draggedId) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    const marker = insertionMarker(measure(), state.draggedId, { x: event.clientX, y: event.clientY }, direction());
    placeIndicator(ensureIndicator(state), marker);
  }

  function onDragLeave(event) {
    const next = event.relatedTarget;
    if (next && root.contains?.(next)) return;
    const rect = root.getBoundingClientRect?.();
    if (rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) return;
    state.indicator?.remove();
    state.indicator = null;
  }

  function onDrop(event) {
    if (!state.active || !state.draggedId) return;
    event.preventDefault();
    const boxes = measure();
    const previous = boxes.map(box => box.id);
    const next = orderAfterDrop(boxes, state.draggedId, { x: event.clientX, y: event.clientY }, direction());
    cleanup();
    if (sameIds(previous, next)) return;
    try {
      Promise.resolve(settings.onReorder([...next])).catch(error => {
        console.error("Morelord sortable reorder failed.", error);
      });
    } catch (error) {
      console.error("Morelord sortable reorder failed.", error);
    }
  }

  function onDragEnd() {
    cleanup();
  }

  function refresh() {
    if (destroyed) return;
    const DragDrop = dragDropClass();
    const escape = globalThis.CSS?.escape ?? (value => value);
    root.setAttribute("data-ml-sortable", token);
    root.classList.add("ml-sortable");
    const controller = new DragDrop({
      dragSelector: settings.itemSelector,
      dropSelector: `[data-ml-sortable="${escape(token)}"]`,
      permissions: {
        dragstart: () => true,
        drop: () => true
      },
      callbacks: {
        dragstart: onDragStart,
        dragover: onDragOver,
        drop: onDrop,
        dragend: onDragEnd,
        dragleave: onDragLeave
      }
    });
    controller.bind(root);
    ensureDropTarget(controller, root);
    guardHandler(root, "ondragover", () => state.active);
    guardHandler(root, "ondrop", () => state.active);
    for (const element of root.querySelectorAll(settings.itemSelector)) {
      element.classList.add("ml-sortable__item");
      freezeInnerDrags(element);
    }
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    controllers.delete(root);
    cleanup();
    thaw(root);
    for (const element of [...root.querySelectorAll(settings.itemSelector)]) {
      element.classList.remove("ml-sortable__item", "ml-sortable__origin", "dragging");
      element.ondragstart = null;
      element.ondragend = null;
      element.removeAttribute?.("draggable");
    }
    root.classList.remove("ml-sortable");
    root.removeAttribute("data-ml-sortable");
    root.ondragover = null;
    root.ondrop = null;
    root.ondragenter = null;
    root.ondragleave = null;
    root.removeEventListener?.("dragleave", onDragLeave);
  }

  root.addEventListener?.("dragleave", onDragLeave);
  const publicApi = { refresh, destroy };
  controllers.set(root, {
    get destroyed() { return destroyed; },
    configure(next) { Object.assign(settings, normalize(next)); },
    refresh,
    publicApi
  });
  refresh();
  return publicApi;
}

export const sortable = Object.freeze({
  bind: bindSortable,
  reorderIds,
  insertionIndex,
  orderAfterDrop
});

function normalize(options = {}) {
  if (typeof options.onReorder !== "function") {
    throw new Error("Morelord sortable.bind requires onReorder(newOrderIds).");
  }
  const itemSelector = options.itemSelector || "[data-ml-sortable-id]";
  if (typeof itemSelector !== "string" || !itemSelector.trim()) {
    throw new Error("Morelord sortable.bind itemSelector must be a CSS selector.");
  }
  if (options.direction !== undefined && options.direction !== "ltr" && options.direction !== "rtl") {
    throw new Error("Morelord sortable.bind direction must be ltr or rtl.");
  }
  return {
    itemSelector,
    idAttribute: options.idAttribute || "data-ml-sortable-id",
    id: typeof options.id === "function" ? options.id : null,
    direction: options.direction ?? null,
    canDrag: typeof options.canDrag === "function" ? options.canDrag : null,
    onReorder: options.onReorder
  };
}

function dragDropClass() {
  const DragDrop = globalThis.foundry?.applications?.ux?.DragDrop;
  if (typeof DragDrop !== "function") {
    throw new Error("Morelord sortable requires foundry.applications.ux.DragDrop (Foundry VTT 13+).");
  }
  return DragDrop;
}

function groupRows(items) {
  const rows = [];
  for (const item of items) {
    const row = rows.find(candidate => overlaps(candidate[0], item));
    if (row) row.push(item);
    else rows.push([item]);
  }
  return rows;
}

function overlaps(a, b) {
  const amount = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
  return amount > Math.min(a.height, b.height) * 0.5;
}

function rowBounds(row) {
  return row.reduce((bounds, item) => ({
    top: Math.min(bounds.top, item.top),
    bottom: Math.max(bounds.bottom, item.top + item.height),
    left: Math.min(bounds.left, item.left),
    right: Math.max(bounds.right, item.left + item.width)
  }), { top: Infinity, bottom: -Infinity, left: Infinity, right: -Infinity });
}

function usesVerticalAxis(rows) {
  if (!rows.length) return true;
  if (rows.length === 1 && rows[0].length === 1) return rows[0][0].height >= rows[0][0].width;
  return rows.every(row => row.length === 1);
}

function gapInRow(rest, row, point, direction, vertical) {
  if (vertical) {
    const item = row[0];
    const index = rest.indexOf(item);
    return point.y < item.top + item.height / 2 ? index : index + 1;
  }
  const rtl = direction === "rtl";
  for (const item of row) {
    const mid = item.left + item.width / 2;
    const before = rtl ? point.x > mid : point.x < mid;
    if (before) return rest.indexOf(item);
  }
  return rest.indexOf(row.at(-1)) + 1;
}

function leadingEdge(item, direction, start) {
  const atStart = direction === "rtl" ? !start : start;
  return atStart ? item.left : item.left + item.width;
}

function sameIds(left, right) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function blockedControl(item, target) {
  const element = target?.closest ? target : target?.parentElement;
  const control = element?.closest?.(INTERACTIVE);
  return Boolean(control && control !== item && item.contains?.(control));
}

function mountDragImage(event, element, state) {
  const transfer = event.dataTransfer;
  const body = globalThis.document?.body;
  if (!transfer?.setDragImage || !body?.appendChild) return;
  const rect = element.getBoundingClientRect();
  const host = document.createElement("div");
  host.className = "ml-window ml-app ml-sortable__drag-host";
  host.setAttribute("aria-hidden", "true");
  const frame = document.createElement("div");
  frame.className = "window-content";
  const clone = element.cloneNode(true);
  clone.removeAttribute?.("id");
  clone.removeAttribute?.("name");
  clone.querySelectorAll?.("[id]").forEach(node => node.removeAttribute("id"));
  clone.querySelectorAll?.("[name]").forEach(node => node.removeAttribute("name"));
  clone.classList.remove("ml-sortable__origin", "dragging");
  clone.classList.add("ml-sortable__drag-image");
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.boxSizing = "border-box";
  clone.style.margin = "0";
  frame.appendChild(clone);
  host.appendChild(frame);
  body.appendChild(host);
  try {
    transfer.setDragImage(clone, Math.max(0, event.clientX - rect.left), Math.max(0, event.clientY - rect.top));
  } catch {
    host.remove();
    return;
  }
  state.dragHost = host;
}

function ensureIndicator(state) {
  if (state.indicator?.isConnected) return state.indicator;
  const indicator = document.createElement("div");
  indicator.className = "ml-sortable__indicator";
  indicator.setAttribute("aria-hidden", "true");
  document.body.appendChild(indicator);
  state.indicator = indicator;
  return indicator;
}

function placeIndicator(indicator, marker) {
  const thickness = 3;
  const horizontal = marker.orientation === "horizontal";
  indicator.style.top = `${marker.top - (horizontal ? thickness / 2 : 0)}px`;
  indicator.style.left = `${marker.left - (horizontal ? 0 : thickness / 2)}px`;
  indicator.style.width = `${horizontal ? marker.length : thickness}px`;
  indicator.style.height = `${horizontal ? thickness : marker.length}px`;
}

function ensureDropTarget(controller, root) {
  if (typeof root.ondragover === "function") return;
  if (typeof controller._handleDragOver !== "function" || typeof controller._handleDrop !== "function") return;
  root.ondragover = controller._handleDragOver.bind(controller);
  root.ondrop = controller._handleDrop.bind(controller);
  if (typeof controller._handleDragEnter === "function") root.ondragenter = controller._handleDragEnter.bind(controller);
  if (typeof controller._handleDragLeave === "function") root.ondragleave = controller._handleDragLeave.bind(controller);
}

function guardHandler(root, name, isActive) {
  const handler = root[name];
  if (typeof handler !== "function") return;
  root[name] = function sortableDropGuard(event) {
    if (!isActive()) return;
    return handler.call(root, event);
  };
}

function freezeInnerDrags(element) {
  for (const node of element.querySelectorAll?.("img, a") ?? []) {
    if (node === element || node.hasAttribute?.("data-ml-sortable-frozen")) continue;
    node.setAttribute("data-ml-sortable-frozen", node.getAttribute("draggable") ?? "");
    node.setAttribute("draggable", "false");
  }
}

function thaw(root) {
  for (const node of [...(root.querySelectorAll?.("[data-ml-sortable-frozen]") ?? [])]) {
    const previous = node.getAttribute("data-ml-sortable-frozen");
    node.removeAttribute("data-ml-sortable-frozen");
    if (previous) node.setAttribute("draggable", previous);
    else node.removeAttribute("draggable");
  }
}
