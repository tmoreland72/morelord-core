const initialized = new WeakSet();
const outsideBound = new WeakSet();

function checkedLabels(panel) {
  return [...panel.querySelectorAll('input[type="checkbox"]:checked')].map(input => {
    const text = input.closest("label")?.querySelector("span")?.textContent ?? input.value;
    return String(text ?? "").trim();
  }).filter(Boolean);
}

function closePicker(picker) {
  const panel = picker.querySelector(".ml-multi-select__panel");
  const summary = picker.querySelector(".ml-multi-select__summary");
  if (panel) panel.hidden = true;
  summary?.setAttribute("aria-expanded", "false");
}

function refreshSummary(picker) {
  const panel = picker.querySelector(".ml-multi-select__panel");
  const label = picker.querySelector("[data-ml-multi-select-label]");
  if (!panel || !label) return;
  const names = [];
  const seen = new Set();
  for (const name of checkedLabels(panel)) {
    if (seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  const summaryText = names.length ? names.join(", ") : "Any";
  label.textContent = summaryText;
  picker.querySelector(".ml-multi-select__summary")?.setAttribute("title", summaryText);
}

/** Open and close compact checkbox menus and keep their summary in sync with the checks. */
export function activateMultiSelects(application) {
  const root = application?.element;
  if (!root?.querySelectorAll) return;
  if (!outsideBound.has(root)) {
    outsideBound.add(root);
    root.addEventListener("click", event => {
      for (const picker of root.querySelectorAll(".ml-multi-select")) {
        if (picker.contains(event.target)) continue;
        closePicker(picker);
      }
    });
  }
  for (const picker of root.querySelectorAll(".ml-multi-select")) {
    if (initialized.has(picker)) continue;
    initialized.add(picker);
    const summary = picker.querySelector(".ml-multi-select__summary");
    const panel = picker.querySelector(".ml-multi-select__panel");
    if (!summary || !panel) continue;
    summary.addEventListener("click", event => {
      event.preventDefault();
      const willOpen = panel.hidden;
      for (const other of root.querySelectorAll(".ml-multi-select")) {
        if (other !== picker) closePicker(other);
      }
      panel.hidden = !willOpen;
      summary.setAttribute("aria-expanded", String(willOpen));
    });
    panel.addEventListener("change", () => refreshSummary(picker));
    picker.addEventListener("keydown", event => {
      if (event.key !== "Escape" || panel.hidden) return;
      closePicker(picker);
      summary.focus();
    });
  }
}
