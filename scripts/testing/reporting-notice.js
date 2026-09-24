import { assert } from "./in-game.js";
import { TelemetryService } from "../services/telemetry-service.js";

// Run explicitly as GM in a test world; restore every changed world setting.
export const reportingNoticeCheck = {
  id: "core.reporting-notice-upgrade-and-opt-out",
  async run() {
    assert(game.user.isGM, "Run as a GM in a test world.");
    const keys = ["telemetryNoticeVersion", "telemetryConsentVersion", "shareUsageStatistics", "shareErrorReports", "developerMode"];
    const saved = Object.fromEntries(keys.map(key => [key, game.settings.get("morelord-core", key)]));
    const set = (key, value) => game.settings.set("morelord-core", key, value);
    let dialog;
    try {
      await set("developerMode", true);
      for (const priorUsage of [true, false]) {
        await set("telemetryNoticeVersion", 0);
        await set("telemetryConsentVersion", 0);
        await set("shareUsageStatistics", priorUsage);
        await set("shareErrorReports", priorUsage);
        const service = new TelemetryService();
        const completion = service.showNotice();
        for (let i = 0; i < 100 && !document.querySelector('#morelord-core-reporting-notice input'); i++) {
          await new Promise(resolve => setTimeout(resolve, 30));
        }
        const root = document.getElementById("morelord-core-reporting-notice");
        assert(root, "Existing installations must receive the notice.");
        dialog = foundry.applications.instances.get(root.id);
        const usage = root.querySelector('[name="shareUsageStatistics"]');
        assert(usage.checked === priorUsage, "Default-on and existing opt-out must both be preserved.");
        const errors = root.querySelector('[name="shareErrorReports"]');
        assert(errors.checked === priorUsage, "Error reporting must preserve both default-on and previous opt-out choices.");
        assert(root.querySelector("h2").textContent === "Help us improve", "Notice heading must use the updated copy.");
        assert(!service.enabled("usage"), "Legacy consent must not enable reports before Save.");
        for (const width of [520, 360]) {
          dialog.setPosition({ width });
          await new Promise(resolve => requestAnimationFrame(resolve));
          const content = root.querySelector(".window-content");
          assert(content.scrollWidth <= content.clientWidth + 1, `Notice must fit at ${width}px.`);
          // Reproduces dark prose on the formerly hard-coded dark Core surface.
          const originalClasses = root.className;
          try {
            for (const theme of ["theme-light", "theme-dark"]) {
              root.classList.remove("theme-light", "theme-dark");
              root.classList.add("themed", theme);
              const style = getComputedStyle(content);
              const luminance = color => {
                const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
                  if (!color.startsWith("color(srgb")) value /= 255;
                  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
                });
                return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
              };
              const a = luminance(style.color), b = luminance(style.backgroundColor);
              assert((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5, `${theme} notice text must remain readable.`);
            }
          } finally { root.className = originalClasses; }

          await globalThis.captureReportingNotice?.(root, width);
        }
        if (usage.checked) usage.click();
        if (errors.checked) errors.click();
        root.querySelector('[data-action="save"]').click();
        await completion;
        await dialog.close();
        assert(!game.settings.get("morelord-core", "shareUsageStatistics"), "Opt-out must persist.");
        assert(game.settings.get("morelord-core", "telemetryNoticeVersion") === 1, "Save must complete the notice.");
        await new TelemetryService().showNotice();
        assert(!document.getElementById("morelord-core-reporting-notice"), "Saved notice must not reappear after a new client session.");
      }
    } finally {
      await dialog?.close();
      for (const key of keys.filter(key => key !== "developerMode")) await set(key, saved[key]);
      await set("developerMode", saved.developerMode);
    }
  }
};
