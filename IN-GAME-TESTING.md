# Morelord in-game regression tests

Immediate roll completion, September 22 UTC: `test/in-game-reports/2026-09-22-immediate-roll-completion.json` passed all three module-owned regressions in verified Dev1 (Foundry 14.368 / D&D5e 6.0.3): Game Master, Craftworks Delerium Search, and Journeys foraging. Tests click actual grouped chat controls and use native rolls, real sockets, and persisted documents, with a controlled optional-animation completion gate applied only to disposable test messages. They verify synchronous centered Completed text, other actors rolling before earlier animations finish, rejected-choice control restoration, private result visibility, summaries appearing only after release, saved Journey dice, and out-of-order result commits without lost or duplicate results. All test hooks are restored and disposable documents/settings cleaned up. Matching Craftworks card captures are retained. All 280 Node tests passed (Core 65, Craftworks 67, Journeys 132, Game Master 16), as did Core's design-system check. The Journey unit regression also reinitializes recovery while dice are pending and verifies no reroll or duplicate commit. The initial live run caught a missing public Core socket export, which was corrected before the passing run. No release or compatibility metadata was published by this pass.

Only run in the **Dev1** world (`game.world.id === "dev1"`, case-insensitive). The shared runner returns a skipped report in any other or unidentified world before running any checks. Automation must check the join-page world before logging in and recheck after loading; never switch the user's world for testing. Explicit instructions to skip live testing always take precedence.

Node tests check isolated logic. In-game tests run against the actual Foundry client, loaded system, modules, documents, templates, styles, and hooks. Keep both layers.

## Run the initial smoke suite

September 21 Dev1 pending-release validation: confirmed `game.world.id === "dev1"` before checks on Foundry 14.368 / D&D5e 6.0.3. All 397 Node tests across Core, Craftworks, Encounters, Downtime, Journeys, Marketplace and Character Export passed, as did the design-system scan. The combined live report is `test/in-game-reports/2026-09-21-dev1-release-validation.json`: eight checks passed, including both reporting defaults/opt-outs, Lucky Finds and the Drakkenheim source audit. Settings synchronization exceeded the original 60-second test window; the follow-up `2026-09-21-dev1-settings-sync.json` passed all five checks, with settings save completing in about 115 seconds. The owning regression now allows 180 seconds. All nine distinct combined workflow checks therefore passed across these runs. Shared scrolling preserved 200px across rerenders in both theme configurations (`2026-09-21-dev1-scroll.json`). Visual inspection found dark text on a dark Core window background under the light theme (`2026-09-21-dev1-settings-theme-light.png`); this remains a release blocker, not a visual pass. No worlds were switched; telemetry transport was blocked in test browsers and regression settings were restored. Full 200% zoom and player interaction coverage was not performed in this pass.

Reporting-notice regression: after closing any automatically opened reporting notice, import `reportingNoticeCheck` from `scripts/testing/reporting-notice.js` and pass it to `runInGameTests({ checks: [reportingNoticeCheck] })` as GM in a test world. It temporarily pauses reporting with Developer Mode, exercises default-on and previous-opt-out upgrade states through the real dialog, saves an opt-out, verifies the notice stays dismissed for a new service instance, and restores all changed settings. Block outbound telemetry in the test browser as an additional precaution. September 21 UTC verification on Foundry 14.368 / D&D5e 6.0.3 passed all five checks; reports and 520px/360px captures are in `test/in-game-reports/2026-09-21-reporting-notice*`. Captures were visually inspected at narrow width; full theme and 200% zoom coverage remains outstanding.

Join a populated development world, wait for loading to finish, and run this in the browser console or a Foundry Script macro:

```js
const { runInGameTests } = await import("./modules/morelord-core/scripts/testing/in-game.js");
const report = await runInGameTests();
console.log(JSON.stringify(report, null, 2));
```

The module is included in Core's runtime files but is never loaded automatically. It adds no settings, dependencies, or production hooks. Run it separately on a GM client and a player client, with separate browser contexts/profiles so their cookies do not share a login. Retain both JSON reports. Browser-console users can use `copy(JSON.stringify(report, null, 2))` to copy a report.

Initial coverage:

- Core API and Socketlib initialization.
- Real world recipient filtering against Ignored Users.
- Unique participant characters and eligible online player routing.
- GM Ignored Users window: real template rendering, loaded Core CSS tokens, page-layout hook, detached footer, saved checkbox state, checkbox interaction, 460px/360px window widths, and close without saving.

Close any existing Ignored Users window first. The suite changes no stored settings or campaign documents, submits no forms, and sends no player requests. It closes its own test window in `finally`. A populated world with participant characters is required for routing coverage; an empty fixture fails instead of silently passing. The GM-only window check is explicitly skipped on player clients. This verifies routing selection, not socket delivery or GM fallback resolution.

Reports include exact Foundry, system, and active-module versions, browser, viewport, role, individual results, durations, and pass/fail/skip counts. They omit account credentials and campaign content; custom check error messages must do the same. `ok` means no failures in this run, not complete coverage. Review skips and retain evidence of manual checks before claiming compatibility. No manifest compatibility fields are changed by tests.

## Add regression cases as workflows are exercised

Reuse Core's runner, keeping domain checks in their owning module:

```js
const { runInGameTests, assert } = await import("./modules/morelord-core/scripts/testing/in-game.js");
const report = await runInGameTests({ checks: [{
  id: "my-module.specific-regression",
  async run() {
    // Exercise the real workflow and assert an observable result.
    // Clean up only fixtures created by this check, using try/finally.
    throw new Error("Implement the workflow and its assertions before using this example.");
  }
}] });
```

Checks execute sequentially; failures are retained while later checks continue. Each check supplies `id`, `run`, and optionally a `skip` reason. Do not run concurrent suites in one client. Browser automation should impose an overall timeout and treat a missing report as failure; the runner does not race timed-out mutations against later checks.

Use disposable fixtures or a backed-up copy of a test world for workflows that write documents, consume resources, or create chat messages. Do not reset Demo1 or overwrite its prepared demo state. Record fixture IDs, restore temporary settings, and clean up only created fixtures even on failure. Tests must exercise public APIs and actual UI actions, not substitute mocks for Foundry behavior.

## Next workflow coverage

Diagnostics export verification: run `tools/verify-diagnostics-foundry.mjs` with `MORELORD_PLAYWRIGHT` and, if needed, `FOUNDRY_TEST_URL`/test GM credentials. It uses the shared runner and Craftworks' `scripts/testing/diagnostics.mjs`, checks live catalog/access values, then validates a real JSON download without changing world settings. Live verification remains pending if the test world cannot initialize Craftworks.

Reporting checks: see [TELEMETRY.md](TELEMETRY.md) and tools/verify-telemetry-foundry.mjs. September 18, 2026 reports under test/in-game-reports/2026-09-18-telemetry-* cover GM/player consent boundaries, narrow privacy controls, affected module initialization and optional local-only delivery with settings restoration.

These are planned cases, **not implemented tests**. Add them alongside the next demo or bug fix in each module. Campaign Manager is inactive and excluded.

| Owner | Observable acceptance checks |
| --- | --- |
| Core and every roll-request consumer | GM + online player: request reaches the eligible player; ignored users receive nothing; GM can resolve for an offline character; disconnect while pending enables GM resolution; simultaneous player/GM attempts resolve exactly once; public/private/blind visibility is preserved. |
| Marketplace | Buy/sell and GM approval update inventory and currency once; rejected/cancelled transactions leave both unchanged. |
| Journeys | Day progression, supplies, camp rolls, and reload persistence; interrupted player requests remain resolvable. |
| Downtime | Session allocation, project/training progress, and reload persistence; cancellation preserves spent/unspent time correctly. |
| Craftworks | Harvest/loot claims from separate player sessions cannot duplicate materials; recipe matches and crafting resource changes are correct. |
| Encounters | Generate/save/reopen an encounter; launch once with expected actors/tokens and initiative behavior. |
| Character Export | Export a fixture character from its sheet; verify expected JSON and artwork without changing the actor. |
| Compendium | Open representative packs and import fixture documents; verify system data and referenced assets. |

For shared UI, also inspect screenshots at supported viewport sizes, both themes, long content, scrolling, and relevant interactions with Foundry and Core styles loaded. The current token/layout assertions do not establish full visual compliance.

## Foundry update validation

Drakkenheim regression checks (September 21): in Dev1, pass `drakkenheimChecks` from Encounters' `scripts/testing/drakkenheim.mjs` and Craftworks' `scripts/testing/drakkenheim.mjs` to Core's `runInGameTests`. Run Game Master's `luckyFindChecks` from `scripts/testing/lucky-finds.mjs` separately. These cover rendered encounter text/body weight/location heading, all published results and Manticore fallback, Champion/module availability labels, actual settings-save synchronization, Lucky Finds item links/scroll action, and the combat-end hook. The Craftworks save check snapshots/restores settings and performs a real content sync; use a disposable populated Dev1 fixture.

Live checks were skipped because port 31400 currently serves Demo2, which the user selected for the Drakkenheim demo. No world was switched. The offline installed-source audit covers 117 results across eight tables and every rival-party branch, with official adventure actors represented as already imported. Repeat with `node tools/audit-drakkenheim-sources.mjs`; Encounters' `test/source-audit/drakkenheim.json` records its assumptions. `tools/verify-drakkenheim-ui.mjs` renders actual templates/result text against installed Foundry/Core styles in an isolated browser. Its captures and JSON under `test/in-game-reports/drakkenheim-*` are explicitly offline evidence, not live Foundry approval. Narrow/dark layouts were inspected; the light-theme fixture exposed an existing Core background/text contrast issue that still needs live theme verification.

1. Back up the test world and record a baseline on the current exact build.
2. Run `npm test` and applicable module tests; run Core's `npm run check:design-system` for shared UI changes.
3. Upgrade the test installation, preserving the baseline's system/module versions so the comparison isolates Foundry changes.
4. Run GM and player smoke reports, implemented domain suites, and the relevant manual scenarios above. Compare failures, skips, and console errors with the baseline. Record screenshots for UI regressions.
5. Verify fixes with a failing-before/passing-after case. Promote each reproduced regression into a repeatable test.
6. Only declare compatibility for the exact build and workflows actually verified; follow the separate release workflow to update/publish compatibility metadata.

An upgrade smoke pass is an early signal, not a replacement for workflow coverage or official stable-version verification during release preparation.

## First live baseline

On September 17, 2026, the suite ran in Demo1 using concurrent isolated Chuck (GM) and Thalin (player) browser contexts on Foundry **14.368**, D&D5e **6.0.3**, and Core **0.3.9** with the working-tree test addition. GM: 4 passed. Player: 3 passed, 1 intentional GM-only skip. Reports are retained under `test/in-game-reports/2026-09-17-*.json`. These checks exercise shared services used by active Morelord modules, but do not verify each consuming module's full workflow. Full visual review, theme coverage, request delivery/disconnect races, and domain workflows remain outstanding. This is not a declaration of complete 14.368 compatibility.

## September 20 release verification

The September 20 release pass used an isolated copy of Demo1 on Foundry 14.368 / D&D5e 6.0.3. GM/player smoke and reporting consent, credential-enabled production reporting through a local relay, Craftworks UI/harvest quantities/generators/diagnostics, Downtime project choices/history/research, Encounters guided scenes/stories/strength/NPC participation, Journeys supply continuation/undo/night timing, Character Export serialization, Marketplace rendering, and representative Compendium documents passed. Fixture preconditions were corrected in the disposable world: enable Drakkenheim, supply a research component and party NPC, and use a non-ignored GM. Earlier failed fixture reports are superseded by the corresponding passing release reports. Reports use UTC timestamps (some filenames are September 21 UTC). These checks do not claim exhaustive gameplay, theme, or disconnect-race coverage.

## Grouped chat roll regression

In Dev1, import `groupedSearchCheck` from `../morelord-craftworks/scripts/testing/grouped-search.mjs` and `groupedRollsCheck` from `../morelord-journeys/scripts/testing/grouped-rolls.mjs`, then pass both in `checks` to `runInGameTests`. Wait for Craftworks initialization and keep the Chat sidebar open. The search check creates two disposable characters, requests one search card, clicks each independent Decline search button through the real socket path, verifies finalization, and removes its actors/messages/session. The Journeys check verifies one card per party batch for day encounters, foraging, Press On, sleep deprivation, and watches, distinct character DCs, and resend reuse. It creates disposable actors/messages without changing the active journey. These checks cover grouping; full roll outcomes and real player disconnect races require separate gameplay validation. Core’s Node regression additionally covers ownership rejection, disconnected-player/GM routing, duplicate resolution, private acknowledgments, concurrent group creation, and independent completion.

September 21 (September 22 UTC) grouped-card validation passed in Dev1 on Foundry 14.368 / D&D5e 6.0.3: all six shared-runner checks passed, including independent real socket-driven Delerium Search declines/finalization and five Journey group-request types. See `test/in-game-reports/2026-09-22-grouped-rolls-integration.json`. All 275 Node checks across Core, Craftworks, Journeys, and Game Master and the design-system scan passed. The first browser fixture closed the Chat sidebar and failed its DOM lookup; the corrected run supersedes that fixture failure. Full gameplay outcomes and multiplayer disconnect races are outside this grouping regression.

The expanded-sidebar visual follow-up also passed (five checks) and was inspected at the actual 274px chat-card width. `2026-09-22-grouped-rolls.png` shows the shared party heading/DC with two separate character sections, matching skill selectors, DIS/Roll/ADV controls, and Decline search buttons. `2026-09-22-grouped-rolls-page.png` retains the full live Foundry context. The initial blank capture was caused by the collapsed sidebar; the expanded capture supersedes it. No campaign actors, active journey, or gameplay outcomes were modified; disposable test fixtures were cleaned up.

## Search completion, dice timing, and journey statistics regression

September 21 (September 22 UTC), Dev1 / Foundry 14.368 / D&D5e 6.0.3: `2026-09-22-search-completion.json` passed all seven checks. Craftworks' `groupedSearchCheck` and `searchCompletionCheck` verify independent responses, real native skill rolls, actual reward-source resolution, a newly posted GM-only completion summary, result-window opening, duplicate-finalization protection, centered Completed text without buttons, and dice animation completion. Journeys' `rollWorkflowCheck` in `scripts/testing/roll-workflow.mjs` verifies six completed days / 1⅔ remaining / 7⅔ total before Day 7, removed foraging overrides, direct night encounter rolling without a player request, animation timing, and GM-only night dice. It restores the active journey, undo history, and skip-animation setting. Screenshots `2026-09-22-search-completion-journey.png` and the final-layout captures show the actual Core/Foundry rendering.

Game Master's `completedRollCheck` from `scripts/testing/completed-rolls.mjs` passed through Core's shared runner in `2026-09-22-game-master-completion.json` (five checks). It resolves a native blind skill request and verifies the completed row contains only centered status text after the animation, with the blind result still private. A Node recovery regression verifies completed searches can regain their missing summary without rerolling, awarding, or duplicating outcomes. Earlier completion runs exposed the invalid `gmroll` message-mode value; Foundry 14 uses `gm`. The corrected seven-check run supersedes those failures.

Final narrow-chat inspection passed with Core's existing data-list component for outcomes and centered button-free Completed rows (`2026-09-22-search-final-layout-1.png`, `-2.png`). The live native-roll regression also passed again (`2026-09-22-search-final-layout.json`). Automated coverage totals 278 passing checks across Core (64), Craftworks (67), Journeys (131), and Game Master (16), with the corrected Lucky Finds GM-mode expectation rerun after updating it. The design-system scan passes. Finished searches authored by another active GM are retained for that coordinating GM's refresh/recovery; the test client did not impersonate them or reroll their results.

## Drakkenheim full source audit and Living Ruin

September 21 local time / September 22 UTC: `test/in-game-reports/2026-09-22-drakkenheim-full-audit.json` passed all three owning-module checks in verified Dev1 (Foundry 14.368 / D&D5e 6.0.3). Coverage includes 117 results across eight tables, zero missing descriptions/unresolved creatures, 16 source-confirmed creature-free results, corrected title boundaries and full creature-name matching, and the actual Core Living Ruin roster dialog. The matching PNG was visually inspected: the full description and four CR 5 Monsters of Drakkenheim alternatives are visible, with real draggable Actor links. Both Living Ruin and Living Ruins now avoid the unrelated CR 0 summon template. The test restores its client-only forced-draw fixture without modifying world documents or installed packs. All 10 Drakkenheim unit tests and the design-system check passed; concurrent guided-library work caused three unrelated full-suite failures (77/80 passed), recorded in Encounters' `test/source-audit/README.md`. No compatibility metadata or releases were published by this audit.

## September 24 release preparation

Core’s previously reported light-theme surface defect is corrected by following Foundry’s color scheme and palette. Offline rendering checks use installed Foundry/Core styles at 900px and 360px and assert normal-text contrast of at least 4.5:1. This supersedes the earlier unchanged-code contrast blocker; live confirmation is still outstanding. The user explicitly requested no in-Foundry testing, and the running world was left untouched. Existing Dev1 evidence is retained without claiming a new live pass.
