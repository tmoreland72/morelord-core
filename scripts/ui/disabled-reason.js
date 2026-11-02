/** Disabled controls explain themselves with a Foundry tooltip: a bold title, then short lines. */

const TEXT_ESCAPE = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };

export function disabledTooltip(reason) {
  const lines = String(reason ?? "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!lines.length) return "";
  const [title, ...rest] = lines;
  const text = value => String(value).replace(/[&<>]/g, char => TEXT_ESCAPE[char]);
  return `<strong>${text(title)}</strong>${rest.map(line => `<br>${text(line)}`).join("")}`;
}

export function setDisabled(element, reason) {
  if (!element || typeof element.setAttribute !== "function") return element;
  const text = reason == null ? "" : String(reason).trim();
  if (!text) return clearDisabled(element);
  const tooltip = disabledTooltip(text);
  if (!tooltip) return clearDisabled(element);
  element.disabled = true;
  element.setAttribute("disabled", "");
  element.setAttribute("aria-disabled", "true");
  element.setAttribute("data-tooltip", tooltip);
  return element;
}

function clearDisabled(element) {
  element.disabled = false;
  element.removeAttribute("disabled");
  element.removeAttribute("aria-disabled");
  element.removeAttribute("data-tooltip");
  return element;
}

export function registerDisabledTooltipHelper(handlebars = globalThis.Handlebars) {
  const targets = [handlebars, globalThis.foundry?.applications?.handlebars];
  const seen = new Set();
  for (const target of targets) {
    if (!target || seen.has(target) || typeof target.registerHelper !== "function") continue;
    seen.add(target);
    try { target.registerHelper("mlDisabledTooltip", disabledTooltip); }
    catch (error) {
      if (!/already registered|duplicate/i.test(String(error?.message ?? error))) throw error;
    }
  }
}
