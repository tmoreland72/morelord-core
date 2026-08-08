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
