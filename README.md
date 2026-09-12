# Morelord Core

Shared account activation and entitlement services for Morelord Tools Foundry VTT modules.

## GM setup

1. Install and enable Morelord Core.
2. Open **Game Settings → Configure Settings → Module Settings → Morelord Core**.
3. Select **Connect or Manage Account**.
4. Approve the temporary code at MorelordGaming.com.

## Locations Manager

The Settlement Type dropdown includes suggested population ranges: Hamlet (1–100), Village (101–1,000), Town (1,001–6,000), City (6,001–25,000), and Metropolis (25,001+). Road and Other have no population range. These labels provide guidance only; capability tiers remain independent of settlement size.

## Module API

```js
const core = game.modules.get("morelord-core")?.api;
await core?.refresh("morelord-marketplace");
if (core?.hasFeature("marketplace.gm-approvals", "morelord-marketplace")) {
  // Enable premium feature.
}
```

Cached entitlements remain usable through the server-provided expiration plus a seven-day offline grace period. Existing world data is never deleted when access expires.

## Troubleshooting diagnostics

GMs can open **Morelord Account** and select **Download Diagnostics** to create a JSON support report. It includes Foundry, game-system, active-module, browser, display, and graphics-renderer versions and capabilities. The sanitized world index is included in the filename to keep reports from different worlds distinct, but not in the JSON. The report excludes account credentials, installation and world identifiers, network addresses, users, and campaign content.

Other Morelord modules can reuse the report builder or start the download through the Core API:

```js
const core = game.modules.get("morelord-core")?.api;
const report = core?.getDiagnostics();
core?.exportDiagnostics();
```

## Release workflow

Morelord Core uses the same guarded PowerShell release workflow as the other Morelord Foundry modules.

Prerequisites:

- Git and GitHub CLI (`gh`) installed
- `gh auth login` completed
- Clean `main` branch synchronized with `origin`
- Repository remote pointing to `tmoreland72/morelord-core`

Validate packaging without changing Git or GitHub:

```powershell
.\release.ps1 -Version 0.1.2 -DryRun
```

Create the release:

```powershell
.\release.ps1 -Version 0.1.2
```

The script updates `module.json`, packages only Foundry runtime files, verifies the ZIP structure and encoding, commits the manifest, creates and pushes an annotated tag, and publishes the GitHub Release.

Foundry manifest URL:

```text
https://raw.githubusercontent.com/tmoreland72/morelord-core/main/module.json
```

## Anonymous usage statistics

Morelord Core can report only the installed Core version and Foundry version during entitlement refreshes. This is enabled by default and can be disabled by a GM in Module Settings with **Share Anonymous Usage Statistics**. Disabling it does not affect account linking, entitlement checks, or premium access. No campaign, player, actor, item, chat, or world-name data is added to the analytics report.
## Standard release workflow

Production Morelord Foundry modules use the same `release.ps1`. Character Export and Downtime are currently excluded from these release steps. Project-specific values are stored in `release.config.json`, so improvements to the workflow can be copied between repositories without editing module logic.

Before a normal release, create `RELEASE-NOTES-x.y.z.md`. The same Markdown file is used for the GitHub Release and parsed into the public Morelord Gaming `/releases` feed. Recognized headings are `Added`, `Features`, `Improvements`, `Changed`, `Fixed`, `Breaking Changes`, and `Security`. Prefix a bullet with `[Premium]` or `[Champion]` when the change is tier-specific; otherwise it is treated as Standard.

Set the website publishing token once in your PowerShell environment:

```powershell
$env:RELEASE_PUBLISH_TOKEN = "<release publish token>"
```

Validate without changing Git, GitHub, or the website:

```powershell
.\release.ps1 -Version x.y.z -DryRun
```

Publish the normal release:

```powershell
.\release.ps1 -Version x.y.z
```

The normal workflow validates the repository, updates `module.json`, builds and verifies the Foundry ZIP, commits and tags the release, pushes it, creates the GitHub Release from the same release-notes file, and publishes the release to `https://morelordgaming.com/releases`. Draft and prerelease builds intentionally skip the public website feed.

If GitHub release creation succeeds but website publication fails, retry only the idempotent website step:

```powershell
.\release.ps1 -Version x.y.z -WebsiteOnly
```

Use `-SkipWebsitePublish` only when intentionally creating a normal GitHub/Foundry release that should not appear on the Morelord website.

## Shared source-book labels

Use `core.sources.resolveBookLabel({ book, custom, pack })` for source filters and displayed book names. Pass both structured source fields and the containing compendium; a legacy string source belongs in `book`. Core resolves configured/localized book labels, strips page references such as `PHB Pg. 220`, replaces generic pack labels with the owning book, and supplies canonical SRD names. Explicit editions remain distinct. Consumers should display the returned label without title-casing it.

## Shared UI services

`core.ui.renderPreservingScroll(application, renderOperation, options)` preserves page positions by default, plus panels marked with `data-ml-scroll-key`. Pass a per-window `positions: new Map()` to remember keyed panels across tabs. `reset: true` clears saved positions and returns the new page to the top. `selector: "*", deferred: true` also preserves nested scroll regions after layout settles. Feature modules should use this service instead of maintaining their own capture/restore algorithms.

`core.ui.decorateActorSelect(select, resolveUuid)` displays the selected actor's portrait. UUID-valued selects need no resolver; ID-valued controls can pass `id => game.actors.get(id)?.uuid` while retaining their existing stored values.

`npm run check:design-system` checks all six feature repositories, including Character Export and Downtime despite their release exceptions. It checks available sources even when a module has no stylesheet directory. Chat templates use the shared chat-card contract rather than the full application shell. Live visual and multiplayer verification remains a separate check.
