// MORELORD_PLAYWRIGHT points to an installed Playwright index.mjs.
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.env.MORELORD_PLAYWRIGHT).href);
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  await page.route("**/api/foundry/telemetry**", route => route.abort());
  await page.goto(`${process.env.FOUNDRY_TEST_URL || "http://127.0.0.1:31401"}/join`);
  await page.locator("input[name=username]").fill(process.env.FOUNDRY_TEST_GM || "Chuck");
  await page.locator("input[name=password]").fill(process.env.FOUNDRY_TEST_PASSWORD || "");
  await page.locator("button[name=join]").click();
  try {
    await page.waitForFunction(() => game.ready && game.modules.get("morelord-craftworks")?.api?.getDiagnostics, {}, { timeout: 60000 });
  } catch (error) {
    console.error("Foundry initialization status", await page.evaluate(() => ({
      ready: Boolean(globalThis.game?.ready),
      loggedIn: Boolean(globalThis.game?.user),
      craftworksActive: Boolean(globalThis.game?.modules?.get("morelord-craftworks")?.active),
      craftworksApi: Boolean(globalThis.game?.modules?.get("morelord-craftworks")?.api),
      diagnosticsApi: Boolean(globalThis.game?.modules?.get("morelord-craftworks")?.api?.getDiagnostics)
    })));
    throw error;
  }
  const report = await page.evaluate(async () => {
    const { runInGameTests } = await import("./modules/morelord-core/scripts/testing/in-game.js");
    const { diagnosticsChecks } = await import("./modules/morelord-craftworks/scripts/testing/diagnostics.mjs");
    return runInGameTests({ checks: diagnosticsChecks });
  });
  await fs.writeFile("test/in-game-reports/diagnostics.json", JSON.stringify(report, null, 2));
  if (!report.ok) throw Error(JSON.stringify(report.summary));
  const downloadPromise = page.waitForEvent("download");
  await page.evaluate(() => game.modules.get("morelord-core").api.exportDiagnostics());
  const download = await downloadPromise;
  const json = JSON.parse(await fs.readFile(await download.path(), "utf8"));
  if (!json.moduleDiagnostics?.["morelord-craftworks"]?.contentPacks) throw Error("Downloaded report is missing Craftworks details");
  console.log(JSON.stringify({ ...report.summary, download: "passed", materials: json.moduleDiagnostics["morelord-craftworks"].catalog.materials }));
} finally { await browser.close(); }
