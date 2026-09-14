const initialized = new WeakSet();

/** Wrap existing controls without replacing them or their event listeners. */
export function createCollapsibleSection({ key, title, description, content = [] }) {
  const section = document.createElement("details");
  section.className = "ml-surface ml-collapsible-section";
  section.dataset.mlSectionKey = key;
  section.open = true;
  const summary = document.createElement("summary");
  const heading = document.createElement("div");
  heading.className = "ml-section-heading";
  const copy = document.createElement("div");
  const h2 = document.createElement("h2");
  h2.textContent = title;
  const p = document.createElement("p");
  p.textContent = description;
  copy.append(h2, p);
  heading.append(copy);
  const icon = document.createElement("i");
  icon.className = "fa-solid fa-chevron-right";
  icon.setAttribute("aria-hidden", "true");
  summary.append(heading, icon);
  const body = document.createElement("div");
  body.className = "ml-collapsible-section__body ml-stack";
  body.append(...content);
  section.append(summary, body);
  return section;
}

/** Remember native disclosure state per section, world, and user in this browser. */
export function activateCollapsibleSections(application, renderedElement) {
  const root = renderedElement?.querySelectorAll ? renderedElement : application?.element;
  if (!root?.querySelectorAll) return;
  for (const section of root.querySelectorAll("details.ml-collapsible-section[data-ml-section-key]")) {
    if (initialized.has(section)) continue;
    initialized.add(section);
    const key = JSON.stringify(["morelord-core.sections", globalThis.game?.world?.id, globalThis.game?.user?.id, section.dataset.mlSectionKey]);
    let saved;
    try { saved = globalThis.localStorage?.getItem(key); } catch { /* Browser storage may be unavailable. */ }
    section.open = saved !== "false";
    let previous = section.open;
    section.addEventListener("toggle", () => {
      if (section.open === previous) return;
      previous = section.open;
      try { globalThis.localStorage?.setItem(key, String(section.open)); } catch { /* Disclosure still works without persistence. */ }
    });
  }
}
