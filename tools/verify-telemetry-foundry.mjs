// Run with MORELORD_PLAYWRIGHT pointing to an installed Playwright index.mjs.
// Uses isolated test-world logins and blocks all outbound telemetry during verification.
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.env.MORELORD_PLAYWRIGHT).href);
const base = process.env.FOUNDRY_TEST_URL || "http://127.0.0.1:31401";
const browser = await chromium.launch({ headless: true });
try {
  for (const [role, username] of [["gm", process.env.FOUNDRY_TEST_GM || "Chuck"], ["player", process.env.FOUNDRY_TEST_PLAYER || "Thalin"]]) {
    const context = await browser.newContext({ viewport: { width: 1365, height: 950 } });
    const page = await context.newPage();
    await page.route("**/api/foundry/telemetry**", route => [process.env.MORELORD_TEST_COLLECTOR, `${process.env.MORELORD_TEST_COLLECTOR}/register`].includes(route.request().url()) ? route.continue() : route.abort());
    await page.goto(`${base}/join`);
    await page.locator("input[name=username]").fill(username);
    await page.locator("input[name=password]").fill(process.env.FOUNDRY_TEST_PASSWORD || "");
    await page.locator("button[name=join]").click();
    await page.waitForFunction(() => globalThis.game?.ready && globalThis.MorelordCore?.telemetry, {}, { timeout: 60000 });
    await page.waitForFunction(() => globalThis.MorelordDowntime && globalThis.MorelordCraftworks && globalThis.MorelordJourneys && game.modules.get("morelord-marketplace")?.api, {}, { timeout: 30000 });
    const report = await page.evaluate(async ({ role, collector }) => {
      const { runInGameTests } = await import("./modules/morelord-core/scripts/testing/in-game.js");
      const { telemetryChecks } = await import("./modules/morelord-core/scripts/testing/telemetry.js");
      const checks = [...telemetryChecks];
      if (role === "gm" && collector) {
        const { localTelemetryDeliveryCheck } = await import("./modules/morelord-core/scripts/testing/telemetry-delivery.js");
        checks.push(localTelemetryDeliveryCheck(collector));
      }
      return runInGameTests({ checks });
    }, { role, collector: process.env.MORELORD_TEST_COLLECTOR });
    const prefix = `test/in-game-reports/${new Date().toISOString().slice(0,10)}-telemetry-${role}`;
    await fs.writeFile(`${prefix}.json`, JSON.stringify(report, null, 2));
    console.log(role, JSON.stringify(report.summary));
    if (!report.ok) throw new Error(`${role} in-game checks failed`);
    if (role === "gm") {
      await page.evaluate(async () => {
        ui.notifications.clear();
        globalThis.telemetryTestWindow = await MorelordCore.open();
        telemetryTestWindow.setPosition({ width: 460 });
      });
      await page.locator('[name="shareErrorReports"]').scrollIntoViewIfNeeded();
      await page.locator("#morelord-core-connection").screenshot({ path: `${prefix}-settings.png` });
      await page.evaluate(() => telemetryTestWindow.setPosition({ width: 360 }));
      const overflow = await page.locator("#morelord-core-connection").evaluate(element => {
        const input = element.querySelector('[name="shareErrorReports"]');
        const label = input.closest("label");
        return label.getBoundingClientRect().right > label.parentElement.getBoundingClientRect().right + 1;
      });
      if (overflow) throw new Error("Privacy controls overflow at 360px");
      await page.locator('[name="shareErrorReports"]').scrollIntoViewIfNeeded();
      await page.locator("#morelord-core-connection").screenshot({ path: `${prefix}-settings-360.png` });
      await page.evaluate(() => telemetryTestWindow.close());
    }
    await context.close();
  }
} finally { await browser.close(); }
