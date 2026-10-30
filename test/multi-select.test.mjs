import test from "node:test";
import assert from "node:assert/strict";
import { activateMultiSelects } from "../scripts/ui/multi-select.js";

function element(selectorText, extras = {}) {
  const node = {
    hidden: false,
    textContent: extras.textContent ?? "",
    value: extras.value ?? "",
    checked: extras.checked ?? false,
    type: extras.type ?? "",
    children: [],
    listeners: {},
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) { return this.attributes[name]; },
    addEventListener(type, callback) { (this.listeners[type] ??= []).push(callback); },
    querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; },
    querySelectorAll(selector) {
      const matches = selectorText === selector ? [node] : [];
      return [...matches, ...this.children.flatMap(child => child.querySelectorAll(selector))];
    },
    contains(target) { return target === node || this.children.some(child => child.contains(target)); },
    closest() { return extras.closest ?? null; },
    focus() { this.focused = true; },
    ...extras
  };
  node.querySelectorAll = function query(selector) {
    const checkedOnly = selector.endsWith(":checked");
    const base = checkedOnly ? selector.slice(0, -":checked".length) : selector;
    const matches = this.selectorText === base && (!checkedOnly || this.checked) ? [this] : [];
    return [...matches, ...this.children.flatMap(child => child.querySelectorAll(selector))];
  };
  node.selectorText = selectorText;
  return node;
}

test("a specialty menu toggles, summarizes the checks, and closes on Escape", () => {
  const dagger = element('input[type="checkbox"]', { type: "checkbox", value: "dagger", checked: false });
  const daggerLabel = element("label", { closest: null });
  const daggerText = element("span", { textContent: "Dagger" });
  daggerLabel.children = [dagger, daggerText];
  dagger.closest = () => daggerLabel;
  const longsword = element('input[type="checkbox"]', { type: "checkbox", value: "longsword", checked: true });
  const longswordLabel = element("label");
  const longswordText = element("span", { textContent: "Longsword" });
  longswordLabel.children = [longsword, longswordText];
  longsword.closest = () => longswordLabel;
  const label = element("[data-ml-multi-select-label]", { textContent: "Any" });
  const summary = element(".ml-multi-select__summary");
  summary.children = [label];
  const panel = element(".ml-multi-select__panel");
  panel.hidden = true;
  panel.children = [daggerLabel, longswordLabel];
  const picker = element(".ml-multi-select");
  picker.children = [summary, panel, label];
  const root = element(".ml-app");
  root.children = [picker];
  const click = target => {
    const event = { target, preventDefault() { event.defaultPrevented = true; } };
    for (const callback of target.listeners.click ?? []) callback(event);
    let current = target;
    while (current) {
      if (current !== target) for (const callback of current.listeners.click ?? []) callback(event);
      current = current.parent;
    }
  };
  picker.parent = root;
  summary.parent = picker;
  panel.parent = picker;
  label.parent = picker;
  activateMultiSelects({ element: root });
  activateMultiSelects({ element: root });
  assert.equal(summary.listeners.click.length, 1);
  click(summary);
  assert.equal(panel.hidden, false);
  assert.equal(summary.attributes["aria-expanded"], "true");
  dagger.checked = true;
  for (const callback of panel.listeners.change) callback();
  assert.equal(label.textContent, "Dagger, Longsword");
  for (const callback of picker.listeners.keydown) callback({ key: "Escape" });
  assert.equal(panel.hidden, true);
  assert.equal(summary.focused, true);
  assert.equal(summary.attributes["aria-expanded"], "false");
});
