# Morelord Core

Shared account activation and entitlement services for Morelord Tools Foundry VTT modules.

## GM setup

1. Install and enable Morelord Core.
2. Open **Game Settings → Configure Settings → Module Settings → Morelord Core**.
3. Select **Connect or Manage Account**.
4. Approve the temporary code at MorelordGaming.com.

## Locations Manager

Saved Associated Scenes remain highlighted when the editor reopens, including when the Scene list is unfocused. Click a Scene to toggle its association, then save the location.

The Settlement Type dropdown includes suggested population ranges: Hamlet (1–100), Village (101–1,000), Town (1,001–6,000), City (6,001–25,000), and Metropolis (25,001+). Road and Other have no population range. These labels provide guidance only; capability tiers remain independent of settlement size.

## Export and import settings

GMs can open **Morelord Core → Export / Import Settings** in Module Settings. Export downloads `morelord-settings.json` with configuration from every enabled Morelord module, including hidden defaults and current-browser preferences. Import replaces matching settings and leaves settings absent from the file unchanged. Missing or disabled modules and unknown keys are skipped; enable a module before importing its settings. Reload Foundry after importing to refresh module views.

Account credentials and access caches, shops, shared locations, active journeys, downtime projects, and window positions are excluded. Actor/user references keep their IDs; they are not remapped between worlds. Modules with no configurable settings add no entries. Files are validated before writing; if a write fails, Core attempts to restore the previous values and reports any restoration failures.

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

GMs can select **Download Troubleshooting File** under Troubleshooting in Core’s settings list to immediately download a JSON support report. **Connect or Manage Account** contains only account and Core configuration controls. It includes Foundry, game-system, active-module, browser, display, and graphics-renderer versions and capabilities. The sanitized world index is included in the filename to keep reports from different worlds distinct, but not in the JSON. The report excludes account credentials, installation and world identifiers, network addresses, users, and campaign content.

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

Production Morelord Foundry modules use the same `release.ps1`. Character Export follows these release steps; Downtime remains excluded. Project-specific values are stored in `release.config.json`, so improvements to the workflow can be copied between repositories without editing module logic.

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

`core.sources.resolvePackLabel({ pack })` labels source choices using the book, the publisher's declared compendium folder (such as an individual adventure), and the pack title. It reads manifest `packFolders`, requires no document loading, and leaves the existing `resolveBookLabel` API unchanged. This distinguishes identically named packs within a multi-adventure product, removes title fragments already contained in the book name, and puts compendium types in parentheses.

Core's `ml-card`, `ml-card__body`, and `ml-grid` children constrain their minimum width and wrap long words/identifiers so text cannot widen a card beyond its grid track. Consumers should not add local overflow workarounds for shared cards.

For uniform description cards, use `ml-card` with `data-size="large"` (26rem), a flexible `ml-card__body` preview, optional two-line `ml-card__summary`, and `ml-actions ml-card__footer` for bottom-aligned actions. Add `data-scroll` and `tabindex="0"` to the body to show complete descriptions in a keyboard-accessible scroll region. Without this opt-in, previews remain clipped. The variant is opt-in and does not change existing cards.

Use `ml-grid` with `data-columns="2"` for responsive card collections with Core-owned gaps. Add `data-ml-selectable-card` to an `ml-card` containing one labeled checkbox to make its background and description toggle that checkbox. Core's render hooks activate this behavior automatically for `ml-window` applications; custom renderers can call `core.ui.activateCardSelection(application)`. Links, buttons, labels, disclosure summaries, text selections, and disabled checkboxes retain their native behavior. Keyboard selection remains available through the labeled checkbox. Core owns the hover and checked styling.

`core.ui.renderPreservingScroll(application, renderOperation, options)` preserves page positions by default, plus panels marked with `data-ml-scroll-key`. Pass a per-window `positions: new Map()` to remember keyed panels across tabs. `reset: true` clears saved positions and returns the new page to the top. `selector: "*", deferred: true` also preserves nested scroll regions after layout settles. Feature modules should use this service instead of maintaining their own capture/restore algorithms.

`core.ui.decorateActorSelect(select, resolveUuid)` displays the selected actor's portrait. UUID-valued selects need no resolver; ID-valued controls can pass `id => game.actors.get(id)?.uuid` while retaining their existing stored values.

`npm run check:design-system` checks all six feature repositories, including Character Export and Downtime. It checks available sources even when a module has no stylesheet directory. Chat templates use the shared chat-card contract rather than the full application shell. Live visual and multiplayer verification remains a separate check.

Accent buttons can opt into `data-variant="outline"`: transparent at rest, orange on hover or keyboard focus. Core page layout preserves intentional `ml-card__body[data-scroll]` regions inside large cards.

## Collapsible sections

Use Core's native disclosure component for sections that can be hidden:

~~~html
<details class="ml-surface ml-collapsible-section" data-ml-section-key="module-id.section-name" open>
  <summary>
    <div class="ml-section-heading"><div><h2>Section title</h2><p>Descriptive subtitle.</p></div></div>
    <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
  </summary>
  <div class="ml-collapsible-section__body ml-stack">Section controls and content</div>
</details>
~~~

Sections start expanded. Core automatically restores and saves their last state per user and world in the current browser, like window geometry. Use a stable, module-prefixed section key, not a journey or document ID. Collapsing only hides the body; it does not reset controls. Native summary activation supports mouse and keyboard. If browser storage is unavailable, toggling still works but cannot persist. Custom renderers can call MorelordCore.ui.activateCollapsibleSections(application) after inserting content. Journey Steps is the first consumer.

Dynamic sections can use `core.ui.createCollapsibleSection({ key, title, description, content })`, where content is an array of DOM nodes. Append the returned details element, then call `core.ui.activateCollapsibleSections(application)`. Existing controls and their listeners are preserved. Use `dl.ml-quantity-list` with alternating `dt` item names and `dd` quantities for compact, aligned lists inside a shared card.


Character eligibility is centralized in `MorelordCore.ui.participation.listCharacterActors()` and `listCharacterChoices()`: player-owned characters plus character members of the primary party Group, deduplicated. Party members may be Actor documents or stored Actor references. `ownedOnly` further limits the result to characters the current user owns. Modules should use these helpers for character selection and retain their operation-specific permissions.


Core account settings, Ignored Users, and the Location editor use the shared page footer. Save actions remain outside the scrolling content, with native form submission preserved.


Core keeps checkbox descriptions beside their controls, allowing text to wrap within the adjacent column. This applies to checkbox-first and checkbox-last labels, including narrow settings windows; actor choice cards retain their portrait layout.


Settings rows use `label.ml-setting-row` with a `span` containing the label and optional `small` description, followed by the input or select. Core owns responsive control layout and checkbox alignment. Settings templates must use the full Core hero and page footer; the design-system check enforces both.

The shared release validator supports required runtime files (including root main.js) and preserves numbered LevelDB transaction logs under packs/<pack>/. Stop Foundry before packaging compendium databases; ordinary diagnostic .log files remain rejected.
