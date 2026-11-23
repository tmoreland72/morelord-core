import { assert } from "./in-game.js";

const frame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const styles = (element, properties) => Object.fromEntries(properties.map(key => [key, getComputedStyle(element)[key]]));
function* stylesheetRules(sheet) {
  let rules;
  try { rules = sheet.cssRules; } catch { return; }
  for (const rule of rules) {
    yield rule;
    if (rule.styleSheet) yield* stylesheetRules(rule.styleSheet);
  }
}

export const sharedComponentConsumersCheck = {
  id: "core.shared-badges-footers-and-consumers",
  async run() {
    const render = foundry.applications.handlebars.renderTemplate;
    const content = document.createElement("div");
    content.innerHTML = `<div class="ml-app ml-app-shell ml-dialog-shell ml-stack">
      <div class="ml-section-heading"><div><h2>Shared components</h2><p>Core owns these styles.</p></div></div>
      <div class="ml-actions"><span class="ml-badge" data-tone="enabled">Enabled</span><span class="ml-badge" data-tone="muted">Not enabled</span><span class="ml-badge" data-tone="success">Available</span><span class="ml-badge">Ordinary badge</span></div>
      <footer class="ml-form-footer" data-test="ordinary"><span>Ordinary label</span><button type="button">Action</button></footer>
      <footer class="ml-form-footer" data-test="status"><span class="ml-footer-status">Ready</span><button type="button">Action</button></footer>
      <div data-test="consumers" class="ml-stack"></div>
    </div>`;
    const consumers = content.querySelector('[data-test="consumers"]');
    for (const [module, template, context] of [
      ["morelord-craftworks", "harvest-prototype", {}],
      ["morelord-craftworks", "harvest-player", { completed: true, summary: { creatures: 1 } }],
      ...["create-training", "create-commission", "create-source-item", "project-detail"].map(template => [
        "morelord-downtime", template, { canCancelProject: true, canDeleteProject: true, canSave: true, project: {} }
      ])
    ]) {
      const holder = document.createElement("div");
      holder.innerHTML = await render(`modules/${module}/templates/${template}.hbs`, context);
      const footer = holder.querySelector("footer");
      assert(footer?.classList.contains("ml-form-footer"), `${template} must consume Core's form footer.`);
      const section = document.createElement("section");
      section.className = "ml-surface ml-stack";
      section.dataset.consumer = `${module}.${template}`;
      const label = document.createElement("strong");
      label.textContent = `${module}: ${template}`;
      section.append(label, footer);
      consumers.append(section);
    }
    const app = new foundry.applications.api.DialogV2({
      id: "morelord-core-shared-components-test", classes: ["ml-window"],
      window: { title: "Shared component regression", resizable: true },
      position: { width: 960, height: 850 }, content: content.innerHTML,
      buttons: [{ action: "close", label: "Close" }]
    });
    const measurements = [];
    try {
      await app.render({ force: true });
      for (const theme of ["dark", "light"]) for (const width of [960, 560]) {
        app.element.classList.remove("theme-dark", "theme-light");
        app.element.classList.add("themed", `theme-${theme}`);
        app.element.style.colorScheme = theme;
        app.setPosition({ width, height: 850, top: 30, left: 10 });
        await frame();
        const badge = tone => app.element.querySelector(`.ml-badge[data-tone="${tone}"]`);
        const probe = document.createElement("span");
        app.element.append(probe);
        const token = property => { probe.style.color = `var(${property})`; return getComputedStyle(probe).color; };
        assert(getComputedStyle(badge("enabled")).color === token("--ml-color-accent"), "Enabled badge lost its accent.");
        assert(getComputedStyle(badge("muted")).color === token("--ml-color-muted"), "Muted badge lost its text color.");
        assert(getComputedStyle(badge("muted")).borderColor === token("--ml-color-border"), "Muted badge lost its neutral border.");
        probe.remove();
        const ordinary = app.element.querySelector('[data-test="ordinary"]');
        const status = app.element.querySelector('[data-test="status"]');
        assert(parseFloat(getComputedStyle(status.firstElementChild).marginRight) > 0, "Status did not stay on the left.");
        const untouched = () => ({
          badge: styles(app.element.querySelector('.ml-badge:not([data-tone])'), ["color", "borderColor", "padding", "font"]),
          success: styles(badge("success"), ["color", "borderColor", "padding", "font"]),
          label: styles(ordinary.firstElementChild, ["marginRight", "width"]),
          button: styles(ordinary.lastElementChild, ["width", "flex", "margin"])
        });
        const baseline = untouched();
        const changed = [];
        try {
          for (const sheet of document.styleSheets) {
            for (const rule of stylesheetRules(sheet)) if (rule.selectorText?.includes(".ml-footer-status")
              || /^\.ml-badge\[data-tone="(?:enabled|muted)"\]$/.test(rule.selectorText ?? "")) {
              changed.push([rule, rule.style.cssText]); rule.style.cssText = "";
            }
          }
          assert(changed.length === 3, "Expected the three opt-in Core rules.");
          assert(JSON.stringify(untouched()) === JSON.stringify(baseline), "Opt-in additions changed ordinary elements.");
        } finally { for (const [rule, css] of changed) rule.style.cssText = css; }
        const footers = [...app.element.querySelectorAll('[data-consumer] footer')];
        for (const footer of footers) {
          assert(["flex-end", "flow-end"].includes(getComputedStyle(footer).justifyContent), `${footer.parentElement.dataset.consumer}: footer alignment is ${getComputedStyle(footer).justifyContent}.`);
          for (const button of footer.querySelectorAll(":scope > button")) assert(getComputedStyle(button).flexGrow === "0", "Consumer button stretched.");
          assert(footer.scrollWidth <= footer.clientWidth + 1, "Consumer footer overflows.");
        }
        measurements.push({ theme, width, ordinary: baseline, consumerFooters: footers.length });
        await globalThis.__morelordSharedComponentVisual?.({ theme, width });
      }
      return measurements;
    } finally { await app.close(); }
  }
};
