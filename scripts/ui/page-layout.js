import { preserveWindowScroll } from "./scroll-preservation.js";
/** One scrolling page body and a separate action footer for Morelord applications. */
export function applyPageLayout(application, renderedElement) {
  const root = renderedElement instanceof HTMLElement ? renderedElement : application?.element;
  if (!root?.matches?.(".ml-window")) return;
  const content = root.querySelector(".window-content");
  const body = content?.querySelector(":scope > .ml-app-shell");
  if (!body) { preserveWindowScroll(application, root); return; } // DialogV2 has its own shared body/footer layout.

  content.classList.add("ml-page-layout");
  body.classList.add("ml-page-body");
  const footers = [...body.querySelectorAll(".ml-page-footer")];
  const previous = content.querySelector(":scope > .ml-page-footer");
  // A new template root means any footer detached from the previous root is stale.
  if (application._morelordPageBody !== body || footers.length) previous?.remove();
  application._morelordPageBody = body;
  if (footers.length) {
    const footer = footers.shift();
    for (const extra of footers) {
      footer.append(...extra.childNodes);
      extra.remove();
    }
    const form = footer.closest("form");
    if (form) {
      form.id ||= `${application.id}-form`;
      footer.querySelectorAll("button[type='submit']").forEach(button => button.setAttribute("form", form.id));
    }
    content.append(footer);
  }

  // Remove legacy pane scrollports, including constrained ancestors that would clip them.
  for (const element of body.querySelectorAll("div, section, main, aside, form, ul, ol")) {
    if (element.closest('.ml-card[data-size="large"] > .ml-card__body[data-scroll]')) continue;
    if (!/^(auto|scroll)$/.test(getComputedStyle(element).overflowY)) continue;
    for (let parent = element; parent && parent !== body; parent = parent.parentElement) {
      parent.classList.add("ml-page-flow");
    }
  }
  preserveWindowScroll(application, root);
}
