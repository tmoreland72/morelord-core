// Run with MORELORD_PLAYWRIGHT pointing to the installed Playwright index.mjs.
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.env.MORELORD_PLAYWRIGHT).href);
const browser = await chromium.launch({ headless: true });
const prefix = "../morelord-downtime/test/in-game-reports/2026-09-18-history";
try {
  const page = await browser.newPage({ viewport: { width: 1365, height: 950 } });
  await page.goto(`${process.env.FOUNDRY_TEST_URL || "http://127.0.0.1:31400"}/join`);
  await page.locator("input[name=username]").fill(process.env.FOUNDRY_TEST_GM || "Chuck");
  await page.locator("input[name=password]").fill(process.env.FOUNDRY_TEST_PASSWORD || "");
  await page.locator("button[name=join]").click();
  await page.waitForFunction(() => globalThis.game?.ready && globalThis.MorelordDowntime, {}, { timeout: 60000 });
  await fs.mkdir("../morelord-downtime/test/in-game-reports", { recursive: true });
  await page.exposeFunction("historyScreenshot", async (id, name) => {
    await page.locator(`#${id} ol`).scrollIntoViewIfNeeded();
    await page.locator(`#${id}`).screenshot({ path: `${prefix}-${name}.png` });
  });
  const report = await page.evaluate(async () => {
    const { runHistoryTests } = await import("./modules/morelord-downtime/scripts/testing/history.mjs");
    return runHistoryTests({ onRendered: (app, name) => window.historyScreenshot(app.id, name) });
  });
  await fs.writeFile(`${prefix}.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ environment: { foundry: report.environment.foundry, system: report.environment.system }, results: report.results, summary: report.summary }));
  if (!report.ok) process.exitCode = 1;
} finally { await browser.close(); }
