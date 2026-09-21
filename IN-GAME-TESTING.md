# Morelord in-game regression tests

Node tests check isolated logic. In-game tests run against the actual Foundry client, loaded system, modules, documents, templates, styles, and hooks. Keep both layers.

## Run the initial smoke suite

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
