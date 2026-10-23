# Morelord Core

Core 0.5.1 provides the shared monster cards, action pills, image links, and artwork fallback required by the accompanying Craftworks and Encounters updates. Release Core 0.5.1 before those module updates.

Core's `compendiums.organize(entries, path, {migration})` API places existing packs in a shared native folder hierarchy without changing pack/document IDs or permissions. `entries` contains `{collection, label}` objects. Placement is recorded once per pack/world; later manual moves remain respected. `compendiums.labels(entries)` applies display labels on each client, including generated world packs whose old manifest labels remain on disk. Craftworks and Game Master consume this service for the Morelord Gaming parent folder. Personal Graypes Compendium is organized separately by its own module and is not part of that hierarchy.

User-facing history and result logs must use readable text. `scripts/ui/log-formatting.js` provides `logLabel` and `logValue` for plain-text fallback formatting of structured values; prefer domain-specific sentences and resolved names when available. Escape these strings when inserting HTML. JSON remains appropriate for storage, exports, and developer diagnostics.

User-facing history and result logs must use readable text. `scripts/ui/log-formatting.js` provides `logLabel` and `logValue` for plain-text fallback formatting of structured values; prefer domain-specific sentences and resolved names when available. Escape these strings when inserting HTML. JSON remains appropriate for storage, exports, and developer diagnostics.

Shared account activation and entitlement services for Morelord Tools Foundry VTT modules.

## GM setup

See the [Core GM Product Guide](CORE-GM-PRODUCT-GUIDE.md) for account controls, reporting preferences, Ignored Users, shared Locations, configuration transfer, and troubleshooting.

1. Install and enable Morelord Core.
2. Open **Game Settings → Configure Settings → Module Settings → Morelord Core**.
3. Select **Connect or Manage Account**.
4. Approve the temporary code at MorelordGaming.com. Foundry shows the code in large type. **Copy** copies it, and **Open approval page** opens the approval address if the browser blocked the automatic page.

## Token Distance Indicator

Hover over another visible token to see the distance. Players measure from one selected owned token, or from their assigned character's unique visible token when nothing is selected. GMs must select exactly one token first. Multiple selected tokens or multiple unselected tokens for the assigned character produce no readout. Distances use the nearest occupied token spaces and Foundry's grid/diagonal rules. Adjacent tokens show 5 ft on a feet-based scene, regardless of token size. Values round up to 5-unit intervals in the scene's units; gridless scenes use the nearest token footprint edges with a half-space allowance for adjacency. This is a flat map distance; elevation, walls, reach, and movement costs are not included. Hidden or unseen targets are never revealed to players.

**Token Distance Indicator** is a per-user checkbox under **Game Settings → Configure Settings → Morelord Core**, enabled by default. GMs can also change it in **Connect or Manage Account → Core Settings → Save Core Settings** for their own client. Changes take effect immediately without an account or premium access. If using TheRipper's Hover Distance, disable one of the indicators to avoid duplicate readouts; Core does not change the other module's settings.

## Reaction Used

**Reaction Used** is a world checkbox under **Game Settings → Configure Settings → Morelord Core** and in **Connect or Manage Account → Core Settings**. It is checked by default. Only a GM can change it; choose **Save Core Settings** in the account window. No account connection or premium access is required.

While it is checked, a creature in a started combat that uses a D&D 5e activity with a reaction activation receives the **Reaction** token status. The label is **Reaction** so it fits the token HUD status grid. The colored lightning-bolt icon appears on the token and in the right-click token status effects, where it can also be toggled by hand for an opportunity attack, a readied action, or a mark that should be removed. The active GM clears the mark when that creature's turn starts. On a shared mob turn from Morelord Encounters, every token in that mob on the scene is cleared. When combat ends, or the round returns to 0, the active GM clears the mark from tokens on that scene. Other GMs and players do not clear marks. Unchecking **Reaction Used** stops automatic marking and clearing; the status stays available on the token HUD.

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

## Discord community

Select **Join Discord** under **Discord Community** in Core’s Module Settings to open the [Morelord Gaming Discord server](https://discord.gg/B5YKQf579E) for support, feature requests, and general discussions. The button is available to GMs and players without connecting a Morelord account.

## Troubleshooting diagnostics

GMs can select **Download Troubleshooting File** under Troubleshooting in Core’s settings list to immediately download a JSON support report. **Connect or Manage Account** contains only account and Core configuration controls. It includes Foundry, game-system, active-module, browser, display, and graphics-renderer versions and capabilities. The sanitized world index is included in the filename to keep reports from different worlds distinct, but not in the JSON. The report excludes account credentials, installation and world identifiers, network addresses, users, and campaign content.

Other Morelord modules can reuse the report builder or start the download through the Core API:

Schema 2 adds `moduleDiagnostics`. Craftworks contributes enabled/access-checked Content Packs, material/recipe counts, known compendium availability and source filtering, sync signature status and recent sync/harvest outcomes. Export **before Sync with Compendiums**, and again afterward, to compare the failing state with the repaired catalog. Recent outcomes cover only the exporting client since its last reload; this is not a console history or a retrospective error log.

Modules may expose a synchronous `api.getDiagnostics()` returning a JSON-safe snapshot. This is a trusted provider contract: include only explicitly selected counts, booleans, fixed identifiers/reason codes and timestamps; never return credentials, raw settings, raw sync signatures, document identifiers/content, or exception messages/stacks. Core skips older modules without this optional API and isolates provider failures. The report is collected locally without syncing content or sending telemetry.

```js
const core = game.modules.get("morelord-core")?.api;
const report = core?.getDiagnostics();
core?.exportDiagnostics();
```

## Development testing

Run `npm test` for isolated code tests. The opt-in [in-game regression suite](IN-GAME-TESTING.md) runs inside a loaded Foundry world and records exact environment versions, recipient routing, and a real Core window's render/interaction checks. Run it on both GM and player clients when validating Foundry updates; the guide lists remaining workflow coverage and how modules can reuse the runner.

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

The script updates `module.json`, rebuilds root `CHANGELOG.md` from `release-notes/RELEASE-NOTES-*.md`, packages runtime files plus that changelog at the ZIP root, verifies the ZIP structure and encoding, commits `module.json` and `CHANGELOG.md`, creates and pushes an annotated tag, and publishes the GitHub Release. `-DryRun` and `-ValidateOnly` leave an already current `CHANGELOG.md` untouched.

Foundry manifest URL:

```text
https://raw.githubusercontent.com/tmoreland72/morelord-core/main/module.json
```

## Usage and error reporting

New and existing worlds receive a one-time GM reporting notice in the next Core update. **Share feature usage** and **Share error reports** are both preselected by default, preserving saved opt-outs. Uncheck either before saving to opt out, or change it anytime in **Morelord Core → Core Settings**. No account connection is required. Legacy worlds send no broader reports until the GM saves; existing explicit choices remain intact. Reports use a pseudonymous random world reporting ID and exclude campaign content and credentials. Developer Mode suppresses reporting. See [TELEMETRY.md](TELEMETRY.md) for notice behavior, collected fields, 90-day raw-event retention and counting limitations.
## Standard release workflow

Production Morelord Foundry modules use the same `release.ps1`. Character Export and Downtime follow these release steps. Project-specific values are stored in `release.config.json`, so improvements to the workflow can be copied between repositories without editing module logic.

Before a normal release, create `release-notes/RELEASE-NOTES-x.y.z.md`. The same Markdown file is used for the GitHub Release and parsed into the public Morelord Gaming `/releases` feed. Recognized headings are `Added`, `Features`, `Improvements`, `Changed`, `Fixed`, `Breaking Changes`, and `Security`. Prefix a bullet with `[Premium]` or `[Champion]` when the change is tier-specific; otherwise it is treated as Standard. `release.ps1` rebuilds the root `CHANGELOG.md` from every `release-notes/RELEASE-NOTES-*.md` file, newest version first, and packages that file at the root of the release ZIP. Per-version notes stay out of the archive. Use `#`/`##`/`###` headings with a space after `#`, `- ` bullets, and no `---` horizontal rules so in-Foundry changelog viewers can read `CHANGELOG.md`.

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

The normal workflow validates the repository, updates `module.json`, rebuilds `CHANGELOG.md`, builds and verifies the Foundry ZIP, commits `module.json` and `CHANGELOG.md`, tags the release, pushes it, creates the GitHub Release from the same release-notes file, and publishes the release to `https://morelordgaming.com/releases`. Draft and prerelease builds intentionally skip the public website feed. `-DryRun` and `-ValidateOnly` do not rewrite `CHANGELOG.md` when it is already current.

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

`listCharacterActors({ includePartyNpcs: true })` also includes NPC members of the primary party, including an NPC-only party. NPCs elsewhere remain excluded. The default remains character-only for existing consumers; `ownedOnly` and `defaultParty` still apply. Encounters uses this option for combat companions.


Core account settings, Ignored Users, and the Location editor use the shared page footer. Save actions remain outside the scrolling content, with native form submission preserved.


Core keeps checkbox descriptions beside their controls, allowing text to wrap within the adjacent column. This applies to checkbox-first and checkbox-last labels, including narrow settings windows; actor choice cards retain their portrait layout.


Settings rows use `label.ml-setting-row` with a `span` containing the label and optional `small` description, followed by the input or select. Core owns responsive control layout and checkbox alignment. Settings templates must use the full Core hero and page footer; the design-system check enforces both.

The shared release validator supports required runtime files (including root main.js) and preserves numbered LevelDB transaction logs under packs/<pack>/. Stop Foundry before packaging compendium databases; ordinary diagnostic .log files remain rejected.

## Shared Item rarity readers

`scripts/services/item-rarity.js` exports `itemRarities(system)` and `itemRarity(system)`. They accept legacy rarity strings/choice objects and D&D 5e v6 rarity arrays/Sets without modifying data. An explicitly empty v6 collection is mundane. Single-rarity workflows use the lowest listed rarity, matching the v6 Item getter. Compendium consumers must request both `system.rarity` and `system.rarities`.

## Shared source filtering and item selection

`MorelordCore.sources.filter` exposes the shared `Dnd5eSourceFilterService` used by Craftworks and Marketplace. It honors D&D5e Configure Sources and canonical SRD provenance on copied documents. `ItemPickerApp` in `scripts/ui/item-picker-app.js` searches enabled physical Item compendiums and calls `onSelect(item)` with the selected document. Downtime commissions consume this Core UI.

Locations stay open after Save. Shared field labels align their controls at the top, checkbox labels remain on one line, resource rows have room for multi-line descriptions, and dialog buttons grow to fit their text.

## Shared roll requests and compendiums

Core 0.3.11 provides shared chat roll controls, immediate Completed feedback, GM fallback, grouped request cards, and dice-animation outcome scheduling for Game Master, Craftworks, and Journeys. Module-owned private outcomes remain in GM-only messages. The contextual socket service exposes runSerialized for local commits coordinated with remote requests.

The compendiums API exposes organize(entries, folderPath, {migration}) and labels(entries). Entries use collection and optional label. Organization preserves pack identifiers and configuration and migrates each pack once, respecting later manual moves. Display labels apply on connected clients; existing world-pack disk labels are not rewritten. Core components include the hotbar-sized macro image button used by Game Master.

Core 0.3.12 fixes the 0.3.11 public socket export: socket.runSerialized(key, callback) is available to the shared afterDiceAnimation helper. This restores result display for saved rolls in Game Master, Craftworks and Journeys.

## Grouped chat roll requests

Shared chat roll requests accept a `groupKey` to keep one persistent public party card, with independent character DCs, choices, DIS/Roll/ADV controls, completion, and GM fallback. Use a fresh group key for a new batch; retain it for resends. Existing single-character cards remain supported. Keep private outcomes in domain-owned GM-only messages, not request flags or socket acknowledgments.


Clicking a character's roll immediately removes that row's controls and shows centered **Completed** text; other rows remain usable. Shared `submitChatRoll(message, key, row, submit)` and `isRollSubmitted(message, key)` preserve this local state during rerenders and restore controls when the GM rejects or cancels the roll. `completeChatRoll(message, entryKey)` persists completion once the GM records it. Permissions, offline-player GM fallback, and duplicate protection are unchanged.

`waitForDiceAnimation(message)` delays derived outcomes, not request-card completion. Consumers can schedule `afterDiceAnimation(messages, callback, serializeKey)` without awaiting it inside a socket handler; only its final callback joins `MorelordCore.socket.runSerialized(key, callback)`, sharing the existing mutation queue. Handle its rejected promise, reread current domain state before committing, and retain saved dice for recovery. Animation waits must never hold the roll queue. Craftworks, Journeys, and Game Master use this path; rolls without animations show outcomes immediately after the commit.

Core window, footer, and select-option surfaces follow Foundry’s color scheme and palette so light-theme text remains readable.

Per-version release history lives in `release-notes/RELEASE-NOTES-<version>.md`, which is excluded from release packages. `release.ps1` rebuilds root `CHANGELOG.md` from those files and packages it at the ZIP root for in-Foundry changelog viewers. Foundry's manifest `changelog` URL still points at the GitHub Releases page. Use the module-local `/tmp/` directory for working files; it is ignored by Git and excluded from release packages.

Core 0.4.2 exposes `ui.participation.canUseActorInventory(actor, user = game.user, { actors = game.actors } = {})`: GMs and owners qualify directly; a Group also qualifies when the user owns or is assigned one of its character members. Callers must still validate operation-specific permissions and route restricted writes through a connected GM. `ui.openItemPreview(item)` opens a read-only sheet; restricted sources are copied into an unsaved Observer document without changing the source or its ownership.

The shared quantity-controls partial accepts optional `cartType`, `clearAction`, `classes`, and `quantityClass` values. `clearAction` adds an accessible remove button with `data-delta="0"`; existing plus/minus consumers keep their behavior. Documentation uses `ui.documentation.open(moduleId)` to open the supported module page on Morelord Gaming in a new browser tab, falling back to the documentation index for modules without a dedicated page. Ignored-only characters are excluded from shared character choices, including explicit saved selections; eligible offline owners remain supported.
## Sidebar multiselect

GM-only **Select multiple** controls support Scenes, Actors, Items, Journals, Rollable Tables, Cards, Macros, and Playlists, including pop-out directories. Checkboxes are the leftmost control on each row, including to the left of thumbnails and at the left of playlist headers, and use Foundry's flat checkbox. Clicks on them do not activate the underlying directory entry. Shift-click selects the visible range from the previous checkbox. Select individual documents or **Select visible**, then review the named list before confirming **Delete selected (N)**. **Clear selection** and **Done selecting** clear hidden selections too. Folders remain; document deletion is permanent and uses Foundry's native API. No linked account or premium access is required. See `CORE-GM-PRODUCT-GUIDE.md` for every control and scope.

## Shared mass combat services (working tree)

`createMassCombat(moduleId, {selectedTokens} = {})` from `scripts/services/mass-combat.mjs` returns `{massCombat, resolveMassCombat}`. Actions are `attackers`, `resolve`, `apply`, `reconcile`, and `reset`; the caller module ID owns existing user/chat `massCombat` flags. Game Master preserves its original namespace and Encounters uses its own. Runtime group attacks require D&D5e 6.0.3+ and an eligible GM; other Core functionality remains system-neutral. `resolveMassCombat(faces, bonus, targets)` is the pure ordered-hit resolver; targets contain `hp`, `temp`, `ac`, `normal`, and `critical` damage. `edgePositions` and `overlaps` from `scripts/services/combat-placement.mjs` share the Smithy square-grid perimeter algorithm; occupied and scene rectangles use pixels, footprints use grid units, and the default inset is one square. The algorithm throws when no safe space remains. Encounters owns saved-roster scheduling; Smithy-specific rosters and cease-fire behavior stay in Game Master. Install these consumer changes together with this Core build; they are pending release. Dev1 verification of the Encounters consumer passed; Game Master’s native activity-switching dialog has also been verified in Dev1.

The optional `selectedTokens(role)` provider returns scene TokenDocuments for `attackers` or `targets`. Encounters supplies its NPC-type dropdown groups; callers that omit it retain map-selection behavior, including existing Game Master macros. Grouping combat turns remains Encounters-owned.

`ui.createChoiceGroup({name,label,value,choices})` creates Core's compact native radio-choice fieldset. Each choice accepts `value`, `label`, `icon`, optional `description` tooltip, and `disabled`. Core owns its responsive four/two-column layout; Encounters uses it for encounter types. `createMassCombat` also accepts `presentForm(config)`, returning a promise for `{action,data}` or null; Encounters embeds Core's existing attack form markup while Game Master retains native dialogs.

Shared mass-combat chat cards summarize targets hit, total hits, kills (zero HP), and total damage including temporary HP, with detailed target rows retained in the message flags. `createMassCombat(...).massCombat("reset")` cancels a pending preview while retaining applied damage and clears the current GM’s attack state. Encounters invokes reset when native combat ends. Existing Game Master macros consume the same summary renderer.

Mass-combat batches include their native `combatId`. The `reconcile` action clears missing, resolved, or previous-combat previews without applying damage; normal actions also reconcile before continuing. Pending review displays the result inline, and **Close Review** retains a valid result.

Mass Combat activity selection is shared through `scripts/services/mass-combat-profiles.mjs`: `massCombatActivities(actor)` extracts native attack/save activities and averages, and `massCombatProfileFields(profile)` renders Core setting rows. `presentForm` receives an optional `onChange(event, root)` callback to update activity-specific fields without replacing a window. Saving activities use native `rollSavingThrow` for each affected token/use with no individual chat messages; typed damage components, save scaling, defenses, temporary HP and serialized application are retained. Encounters owns generic NPC turn consolidation before native `startCombat`; Core does not change combat turn behavior.

Combined attack activities: Mass Combat uses Core’s shared activity profiles. An item’s on-hit save stays with its attack, including saves that deal no damage. The result summarizes native on-hit saving throws alongside weapon damage. A directly named/linked repeated-weapon Multiattack supplies the initial attack count; check **Attacks per troop** for optional attacks or mixed-weapon routines. First-hit-only saves are limited per target within one batch; resolve the full group sequence together. Non-damage effects remain GM-controlled.
