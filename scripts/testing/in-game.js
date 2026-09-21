// Opt-in only: import from a logged-in Foundry browser console or Script macro.
// Keep this out of main.js so ordinary sessions never execute test code.
export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export async function runChecks(checks) {
  const results = [];
  for (const { id, run, skip } of checks) {
    const start = performance.now();
    try {
      if (skip) results.push({ id, status: "skip", reason: skip });
      else {
        await run();
        results.push({ id, status: "pass" });
      }
    } catch (error) {
      results.push({ id, status: "fail", reason: error.message ?? String(error) });
    }
    results.at(-1).durationMs = Math.round(performance.now() - start);
  }
  return results;
}

let running = false;

/** Run on GM and player clients separately. Extra checks must clean up their own fixtures. */
export async function runInGameTests({ checks = [] } = {}) {
  assert(!running, "An in-game suite is already running in this client.");
  assert(globalThis.game?.ready, "Join a world and wait for Foundry to finish loading.");
  running = true;
  try {
    const core = game.modules.get("morelord-core")?.api;
    const report = {
      suite: "morelord-core-smoke",
      schemaVersion: 1,
      startedAt: new Date().toISOString(),
      environment: {
        foundry: game.version,
        system: { id: game.system.id, version: game.system.version },
        role: game.user.isGM ? "gm" : "player",
        browser: navigator.userAgent,
        viewport: { width: innerWidth, height: innerHeight },
        modules: [...game.modules].filter(m => m.active)
          .map(m => ({ id: m.id, version: m.version })).sort((a, b) => a.id.localeCompare(b.id))
      }
    };
    report.results = await runChecks([
      { id: "core.ready", run() {
        assert(core && globalThis.MorelordCore === core, "Core API is unavailable or inconsistent.");
        assert(core.socket.ready, "Core Socketlib service is not ready.");
      } },
      { id: "core.users", run() {
        const ignored = new Set(game.settings.get("morelord-core", "ignoredUserIds"));
        const expected = [...game.users].filter(u => !ignored.has(u.id));
        const actual = core.users.list();
        assert(actual.length === expected.length && expected.every(u => actual.includes(u)),
          "Core recipient list does not match the world's ignored-user setting.");
      } },
      { id: "core.character-routing", run() {
        const actors = core.ui.participation.listCharacterActors();
        assert(new Set(actors.map(a => a.uuid)).size === actors.length, "Duplicate participant characters.");
        for (const actor of actors) {
          const eligible = core.users.list().filter(u => u.active && !u.isGM &&
            (u.character?.uuid === actor.uuid || actor.testUserPermission(u, "OWNER")));
          const recipient = core.users.activePlayerForActor(actor);
          assert(eligible.length ? eligible.includes(recipient) : recipient === null,
            "Character routing selected an unavailable player or missed an eligible owner.");
        }
        assert(actors.length > 0, "No participant characters; routing coverage requires a populated test world.");
      } },
      { id: "core.ignored-users-window", skip: game.user.isGM ? null : "GM-only settings window; run on a GM client too.", async run() {
        const { IgnoredUsersApp } = await import("../ui/ignored-users-app.js");
        assert(!document.getElementById("morelord-core-ignored-users"), "Close the existing Ignored Users window before testing.");
        const before = JSON.stringify(game.settings.get("morelord-core", "ignoredUserIds"));
        const app = new IgnoredUsersApp();
        try {
          await app.render({ force: true });
          const root = app.element;
          assert(root?.isConnected, "Foundry did not render the window.");
          assert(getComputedStyle(root).getPropertyValue("--ml-color-accent").trim(), "Core CSS tokens did not load.");
          assert(root.querySelector(".window-content.ml-page-layout > .ml-page-body"), "Core page-layout hook did not run.");
          assert(root.querySelector(".window-content > .ml-page-footer button[type=submit]"), "Shared footer was not separated from the scroll body.");
          const boxes = [...root.querySelectorAll('input[name="ignoredUserIds"]')];
          assert(boxes.length === game.users.size, "User controls are missing.");
          const ignored = new Set(JSON.parse(before));
          assert(boxes.every(box => box.checked === ignored.has(box.value)), "Saved ignored users were not rendered correctly.");
          const box = boxes[0];
          assert(box, "Test world has no user controls.");
          const checked = box.checked;
          box.click();
          assert(box.checked !== checked, "Checkbox interaction failed.");
          for (const width of [460, 360]) {
            app.setPosition({ width });
            await new Promise(resolve => requestAnimationFrame(resolve));
            const content = root.querySelector(".window-content");
            assert(content.scrollWidth <= content.clientWidth + 1, `Window overflows horizontally at ${width}px.`);
          }
        } finally {
          await app.close();
        }
        assert(!app.element?.isConnected, "Test window did not close.");
        assert(JSON.stringify(game.settings.get("morelord-core", "ignoredUserIds")) === before,
          "Closing without Save changed ignored users.");
      } },
      ...checks
    ]);
    report.summary = Object.fromEntries(["pass", "fail", "skip"].map(status =>
      [status, report.results.filter(result => result.status === status).length]));
    report.ok = report.summary.fail === 0;
    console.table(report.results);
    return report;
  } finally {
    running = false;
  }
}
