# Morelord Core

Shared account activation and entitlement services for Morelord Tools Foundry VTT modules.

## GM setup

1. Install and enable Morelord Core.
2. Open **Game Settings → Configure Settings → Module Settings → Morelord Core**.
3. Select **Connect or Manage Account**.
4. Approve the temporary code at MorelordGaming.com.

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

All Morelord Foundry modules use the same `release.ps1`. Project-specific values are stored in `release.config.json`, so improvements to the workflow can be copied between repositories without editing module logic.

Before a normal release, create `RELEASE-NOTES-x.y.z.md`. The same Markdown file is used for the GitHub Release and parsed into the public Morelord Gaming `/releases` feed. Recognized headings are `Added`, `Features`, `Improvements`, `Changed`, `Fixed`, `Breaking Changes`, and `Security`. Prefix a bullet with `[Premium]` or `[Champion]` when the change is tier-specific; otherwise it is treated as Standard.

Set the website publishing token once in your PowerShell environment:

```powershell
$env:MORELORD_RELEASE_TOKEN = "<release publish token>"
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
