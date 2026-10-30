# Morelord Core

Core 0.5.1 provides the shared monster cards, action pills, image links, and artwork fallback required by the accompanying Craftworks and Encounters updates. Release Core 0.5.1 before those module updates.

Core's `compendiums.organize(entries, path, {migration})` API places existing packs in a shared native folder hierarchy without changing pack/document IDs or permissions. `entries` contains `{collection, label}` objects. Placement is recorded once per pack/world; later manual moves remain respected. `compendiums.labels(entries)` applies display labels on each client, including generated world packs whose old manifest labels remain on disk. Craftworks and Game Master consume this service for the Morelord Gaming parent folder. Personal Graypes Compendium is organized separately by its own module and is not part of that hierarchy.

User-facing history and result logs must use readable text. `scripts/ui/log-formatting.js` provides `logLabel` and `logValue` for plain-text fallback formatting of structured values; prefer domain-specific sentences and resolved names when available. Escape these strings when inserting HTML. JSON remains appropriate for storage, exports, and developer diagnostics.

User-facing history and result logs must use readable text. `scripts/ui/log-formatting.js` provides `logLabel` and `logValue` for plain-text fallback formatting of structured values; prefer domain-specific sentences and resolved names when available. Escape these strings when inserting HTML. JSON remains appropriate for storage, exports, and developer diagnostics.

Shared account activation and entitlement services for Morelord Tools Foundry VTT modules.

## GM setup

See the [Core GM Product Guide](CORE-GM-PRODUCT-GUIDE.md) for account controls, reporting preferences, Ignored Users, [Shared Locations](CORE-GM-PRODUCT-GUIDE.md#shared-locations), configuration transfer, and troubleshooting.

1. Install and enable Morelord Core.
2. Open **Game Settings → Configure Settings → Module Settings → Morelord Core**.
3. Select **Connect or Manage Account**.
4. Approve the temporary code at MorelordGaming.com. Foundry shows the code in large type. **Copy** copies it, and **Open approval page** opens the approval address if the browser blocked the automatic page.

## Token Distance Indicator

Hover over another visible token to see the distance. Players measure from one selected owned token, or from their assigned character's unique visible token when nothing is selected. GMs must select exactly one token first. Multiple selected tokens or multiple unselected tokens for the assigned character produce no readout. Distances use the nearest occupied token spaces and Foundry's grid/diagonal rules. Adjacent tokens show 5 ft on a feet-based scene, regardless of token size. Values round up to 5-unit intervals in the scene's units; gridless scenes use the nearest token footprint edges with a half-space allowance for adjacency. This is a flat map distance; elevation, walls, reach, and movement costs are not included. Hidden or unseen targets are never revealed to players.

**Token Distance Indicator** is a world checkbox under **Game Settings → Configure Settings → Morelord Core**, checked by default. Only a GM can change it, in that menu or in **Connect or Manage Account → Core Settings → Save Core Settings**. Every client reads the same choice. A world that has not saved it yet takes the GM's previous per-client choice, or stays checked when that GM had not saved one. Changes take effect immediately without an account or premium access. If using TheRipper's Hover Distance, disable one of the indicators to avoid duplicate readouts; Core does not change the other module's settings.

## Reaction Used

**Reaction Used** is a world checkbox under **Game Settings → Configure Settings → Morelord Core** and in **Connect or Manage Account → Core Settings**. It is checked by default. Only a GM can change it; choose **Save Core Settings** in the account window. No account connection or premium access is required.

While it is checked, a creature in a started combat that uses a D&D 5e activity with a reaction activation receives the **Reaction** token status. The label is **Reaction** so it fits the token HUD status grid. The colored lightning-bolt icon appears on the token and in the right-click token status effects, where it can also be toggled by hand for an opportunity attack, a readied action, or a mark that should be removed. The active GM clears the mark when that creature's turn starts. On a shared mob turn from Morelord Encounters, every token in that mob on the scene is cleared. When combat ends, or the round returns to 0, the active GM clears the mark from tokens on that scene. Other GMs and players do not clear marks. Unchecking **Reaction Used** stops automatic marking and clearing; the status stays available on the token HUD.

## Locations Manager

The [Shared Locations](CORE-GM-PRODUCT-GUIDE.md#shared-locations) section of the GM guide explains why a place is defined once, how to set it up, and how Downtime, Craftworks, Marketplace, and Journeys use each capability and Specialty.

Saved Associated Scenes remain highlighted when the editor reopens, including when the Scene list is unfocused. Click a Scene to toggle its association, then save the location.

The Settlement Type dropdown includes suggested population ranges: Hamlet (1–100), Village (101–1,000), Town (1,001–6,000), City (6,001–25,000), and Metropolis (25,001+). Road and Other have no population range. These labels provide guidance only; capability tiers remain independent of settlement size.

An Instructor capability shows **Specialty** as a compact checkbox menu. The closed summary says **Any** when nothing is checked. Open it to check several subjects from a fixed D&D 2024 list of languages, skills, tools, weapons, armor, and weapon masteries from `listTrainingSpecialties()`. The list does not follow Configure Sources and does not read compendium items. The saved specialty is an array of those subjects' ids. A legacy single id is read as a one-item array. Empty or **Any** stores `[]` and means no restriction. A weapon that appears under both weapons and weapon masteries uses the same id, so checking either one stores that id once. A stored id that is not in the list stays in the menu. Capability types with no specialty catalog hide **Specialty** and keep any specialties already saved. The capability field labeled **Notes** is still stored as `source`.

A Forge capability uses the same menu for the weapon proficiencies, armor proficiencies, and weapon masteries from that list. One Forge row can include several of them. Weapon proficiencies include Simple Weapons, Martial Weapons, and each weapon. Armor proficiencies include Light Armor, Medium Armor, Heavy Armor, Shields, and each armor. Weapon masteries list each weapon and store that weapon's id.

A Workshop capability uses the same menu for the D&D 2024 artisan's tools that do not already belong to another registered capability. **Any** means no tool restriction. Each checked choice stores the dnd5e tool id, such as `cobbler` for Cobbler's Tools. One Workshop row can include several tools. Smith's Tools still map to Forge through `toolCapabilityType`, and Alchemist's Supplies map to Alchemist. Those mappings are separate from the Forge specialty dropdown, and Alchemist does not show a one-tool dropdown. Brewer's Supplies and Cook's Utensils stay on Workshop. If a module registers a Tavern capability, those two move to Tavern and Tavern shows them as its specialty list. Carpenter's Tools, Mason's Tools, Calligrapher's Supplies, and Cartographer's Tools stay on Workshop. A saved specialty that is not in the list stays in the dropdown.

```js
const locations = game.modules.get("morelord-core").api.locations;
locations.toolCapabilityType("Smith's Tools"); // "forge"
locations.toolCapabilityType("cobbler"); // "workshop"
locations.listWorkshopSpecialties(); // [{ id, label, capabilityType }]
```

```js
const locations = game.modules.get("morelord-core").api.locations;
const choices = locations.listTrainingSpecialties();
const instructor = locations.buildSpecialtyOptions("instructor", { current: null });
const forge = locations.buildSpecialtyOptions("forge", { current: null });
locations.locationAllowsSpecialty(location, "instructor", "ste");
locations.locationAllowsSpecialty(location, "forge", "longsword");
```

`listTrainingSpecialties()` returns the fixed D&D 2024 skills, languages, tool proficiencies, weapon proficiencies, armor proficiencies, and weapon masteries. `listForgeSpecialties()` returns the weapon, armor, and mastery portion. Weapon masteries use the weapon ids. Each choice has `kind`, `id`, `label`, `category`, and `trainingValue` (`kind:id`). The list does not read Configure Sources or compendium documents, and an open Locations window does not refresh these dropdowns when Configure Sources changes. `buildSpecialtyOptions(typeId, { choices, current })` returns `null` when that registered type has no `specialtyCatalog`, and otherwise returns grouped dropdown options. Omit `choices` to use the fixed list. `registerCapability({ id, name, icon, supportsSpecialty, specialtyCatalog })` accepts `specialtyCatalog: "training"` for the full list and `specialtyCatalog: "forge"` for weapons, armor, and masteries.

`locationAllowsSpecialty(location, type, specialtyKey)` reports whether a location allows a subject. The signature is unchanged. It returns true when any capability of `type` has no restriction or includes that key. Any, an empty list, or a legacy empty string allows every key. Any or an empty `specialtyKey` is allowed by every capability of that type. A location with no capability of that type returns false. This check does not compare tier. `evaluateRequirements` uses the same specialty match: a named specialty passes when the key is in the capability's array, or when that array is empty. Use `meetsTier` or the requirement's `tier` when the tier matters. A saved specialty is an array, so comparing `capability.specialty` with `===` does not match a stored key.

`locations.activeContext(user)` resolves the place those workflows should use. It looks up the location for the scene `user` is viewing first. Downtime keeps one active session for the world. When Downtime is active and that session has a location id, the result is that saved location (`source: "downtime"`). The explicit id wins over the scene. When the session's location id is blank, the result is that viewed scene's location (`source: "scene"`) and `sessionId` stays the active session. The virtual **On the Road** place (`source: "road"`, `metadata.virtual: true`, no capabilities) is returned only when the session location id is blank and the viewed scene has no associated location. It is not a saved location. When Downtime is inactive, has no active session, or its project state cannot be read, the result is the viewed scene (`source: "scene"`) and `sessionId` is null. Omit `user` to use the current user. A user with no viewed scene falls back to the local canvas scene only when that user is the current user; another user's missing scene does not use this client’s scene. No scene location and no active session returns `source: "none"` and `location: null`. `sessionId` is set for an active session, including when its location id is blank. A session location id that no longer exists returns `source: "downtime"` and `location: null`.

```js
const place = game.modules.get("morelord-core").api.locations.activeContext(user);
```

## Export and import settings

GMs can open **Morelord Core → Export / Import Settings** in Module Settings. Export downloads `morelord-settings.json` with configuration from every enabled Morelord module, including hidden defaults and current-browser preferences. Import replaces matching settings and leaves settings absent from the file unchanged. Missing or disabled modules and unknown keys are skipped; enable a module before importing its settings. Reload Foundry after importing to refresh module views.

Account credentials and access caches, shops, shared locations, active journeys, downtime projects, and window positions are excluded. Marketplace's **Enable Locations** setting is included with its other configuration settings. Actor/user references keep their IDs; they are not remapped between worlds. Modules with no configurable settings add no entries. Files are validated before writing; if a write fails, Core attempts to restore the previous values and reports any restoration failures.

## Module API

```js
const core = game.modules.get("morelord-core")?.api;
await core?.refresh("morelord-marketplace");
if (core?.hasFeature("marketplace.gm-approvals", "morelord-marketplace")) {
  // Enable premium feature.
}
```

Cached entitlements remain usable through the server-provided expiration plus a seven-day offline grace period. Existing world data is never deleted when access expires.

## Morelord Tools

**Morelord Tools** is the left scene control with the sharp crown icon (`fa-sharp fa-solid fa-user-crown`). It is placed after Foundry's own controls. The control is hidden when the current user has no visible tools. Choosing it opens the tool palette and leaves **Morelord Tools** selected. Choosing a tool runs that tool and does not switch the scene controls back to Tokens.

Core does not add the account window or the Game Master tray to this palette. Other modules register their tools.

`game.modules.get("morelord-core").api.tools` is the same object as `globalThis.MorelordCore.tools`, and it is available from the `init` hook. During `setup`, Core calls `Hooks.callAll("morelord-core.registerTools", tools)`. Listen for that hook during `init`. A module can also call `register` during `setup`, after Core's `init` has published `api.tools`.

```js
Hooks.once("morelord-core.registerTools", tools => {
  tools.register({
    id: "morelord-craftworks",
    title: "Morelord Craftworks",
    icon: "fa-solid fa-hammer",
    visible: () => true,
    onClick: () => {}
  });
});
```

`id` is unique. Registering the same id again replaces that tool. The scene-control key is the camel-case id, so `morelord-craftworks` remains `morelordCraftworks`. `morelordHome` is reserved for the **Morelord Modules** entry.

`title` is the palette label, or an i18n key. `icon` is the Font Awesome class string. `order` is accepted and ignored. Core sorts the visible tools by the localized title, without regard to case, and ignores a leading `Morelord ` when comparing. The button still shows the registered title. Equal titles then use the id. The titles Morelord Craftworks, Morelord Downtime, Morelord Encounters, Morelord Journeys, Manage Marketplace Shops, and Morelord Marketplace therefore appear in that order.

`visible` runs every time the controls are built. Return false to hide that tool from the current user. When none of the tools are visible, the **Morelord Tools** control is hidden.

`onClick` is called from the tool's `onChange`. Each registered tool is `button: true`. Core catches a thrown error or a rejected promise and shows `error.message` with `ui.notifications.error`. The click does not change the active scene control.

`unregister(id)` removes a tool. `list()` returns the tools visible to the current user in that alphabetical order, as `{id, title, icon, order}`. The returned `order` is the value the module passed and does not change the palette. `refresh()` rebuilds the scene controls with `{controls: true, reset: true}` after a short debounce, and only once the controls are already rendered. Entitlement updates, `userConnected`, and user changes call `refresh()` so visibility follows the current user.

The first palette entry is **Morelord Modules**. It uses an info icon and stays selected. Only a GM sees that button. Choosing it opens the **Morelord Modules** window. A player does not see the button, and opening the window for a player does nothing, including a call through `openMorelordModules`. Players still see the other tools in the column, such as **Morelord Craftworks**, **Morelord Downtime**, and **Morelord Marketplace**. Choosing the crown does not open that window or a module tool. The window says "Each module shows whether it is active, installed but inactive, or not installed in this world." It lists Core, Journeys, Encounters, Character Export, Craftworks, Marketplace, Downtime, and Game Master. Each row has the module icon, its name, the one-line description from that module's manifest, and a status: **Active**, **Installed but inactive**, or **Not installed**. **Documentation** opens `https://morelordgaming.com/docs`. **Not installed** rows also include **Learn more**, which opens that module's tools page in a new tab. The address is `https://morelordgaming.com/tools/<id>`. Game Master has no tools page and no Foundry package listing, so **Learn more** opens `https://github.com/tmoreland72/morelord-game-master`.

The **Support** section has **Get support**, **Morelord Gaming**, and **YouTube**. **Get support** opens the Discord invite published by the website, `https://discord.gg/B5YKQf579E`. **Morelord Gaming** opens `https://morelordgaming.com`. **YouTube** opens `https://www.youtube.com/@MorelordGaming`. Every documentation, website, Discord, and YouTube address adds `utm_source=foundry`, `utm_medium=morelord_tools`, and `utm_campaign` set to the module id, or to `docs`, `support`, `website`, or `youtube`. The Discord invite still resolves with those parameters, so they stay on that link.

That entry has to stay in the control data for players as well. Foundry 13 requires a visible tool that is not a button as `SceneControl.activeTool`. In v13.351, omitting it makes `SceneControls.#onChange` throw `toolOrControl is undefined` when the control changes, and a tool with `visible: false` is removed before it can stay active. A button cannot be the active tool: selecting the control runs that tool and would open its window. Foundry 14 makes `activeTool` optional, then selects the first tool when any tool exists (issue 12966, release 14.349). With only module buttons, that would open the first tool. Core therefore keeps the non-button entry for every user and removes its rendered button unless `game.user.isGM` is true. Module tools stay `button: true`, so choosing one leaves **Morelord Tools** selected.

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

`core.ui.renderInBackground(application, options)` refreshes a window that is already open and leaves it where it is in the stack. Foundry v14 `ApplicationRenderOptions` documents `force`, `isFirstRender`, `parts`, `position`, `tab`, and `window`. It does not document `focus`. `ApplicationV2#render({ force: true })` still calls `bringToFront()`, so a settings or location hook that re-renders another open module window puts that window in front of the one the user clicked. `renderInBackground` calls `render({ force: false, focus: false })` and does nothing when the window is not open. Core also wraps `ApplicationV2#render` so a re-render of an already open window ignores `bringToFront` unless the caller passes `focus: true`. Pass `focus: true`, or call `bringToFront()` after render, when the user asked to open that window.

`core.ui.decorateActorSelect(select, resolveUuid)` displays the selected actor's portrait. UUID-valued selects need no resolver; ID-valued controls can pass `id => game.actors.get(id)?.uuid` while retaining their existing stored values.

`npm run check:design-system` checks all six feature repositories, including Character Export and Downtime. It checks available sources even when a module has no stylesheet directory. Chat templates use the shared chat-card contract rather than the full application shell. Live visual and multiplayer verification remains a separate check.

Accent buttons can opt into `data-variant="outline"`: transparent at rest, orange on hover or keyboard focus. Core page layout preserves intentional `ml-card__body[data-scroll]` regions inside large cards.

## Reordering lists and grids

`game.modules.get("morelord-core").api.sortable` reorders cards inside a list or a wrapping grid. It is available from the `ready` hook. It uses Foundry's `foundry.applications.ux.DragDrop` (Foundry 13 and later). Give each card a stable id. The whole card is the drag target, including its text and artwork. Buttons, links, fields, and disclosure summaries inside a card keep their own clicks.

```html
<div class="ml-grid" data-columns="2">
  <article class="ml-card" data-ml-sortable-id="alpha">...</article>
  <article class="ml-card" data-ml-sortable-id="beta">...</article>
</div>
```

```js
const sortable = game.modules.get("morelord-core").api.sortable;
const control = sortable.bind(container, {
  onReorder(newOrderIds) {
    save(newOrderIds);
    render();
    control.refresh();
  }
});
```

`onReorder` receives the full id list, such as `["beta", "alpha"]`, and only when the drop changes the order. A drop on the same place, Escape, or a drop outside the container leaves the order alone and clears the preview. `refresh()` rebinds items when the same container element gets new children. If a render replaces the container element, call `bind` on the new element. `destroy()` removes the drag behavior and the preview.

While the pointer is down, a copy of the whole card follows the pointer with an accent outline and shadow. The original card stays in place, dimmed, with an accent outline. A landing line marks the gap where the card will be inserted. Lists use a horizontal line. A single row or a grid uses a vertical line in that row. The line is removed on drop, when the drag ends, and when the drag is cancelled.

`itemSelector` defaults to `[data-ml-sortable-id]`. `idAttribute` defaults to `data-ml-sortable-id`. Pass `id: element => element.dataset.entryId` when the id lives somewhere else, and pass the matching `itemSelector`. Ids must be unique. `direction` is `"ltr"` or `"rtl"`; otherwise the container's computed direction is used. `canDrag: element => false` refuses that card.

`sortable.reorderIds(ids, draggedId, insertAt)` returns a new id list. `insertAt` is the index among the other ids: `0` moves the id to the front, and its current index leaves the list unchanged. `sortable.insertionIndex(items, draggedId, point, direction)` returns that index from client-pixel boxes `{id, top, left, width, height}` and a point `{x, y}`. `sortable.orderAfterDrop(items, draggedId, point, direction)` combines the two.

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

## Configure Sources

D&D 5e **Configure Sources** (Game Settings menu **Compendium Browser Sources**, label **Configure Sources**) is the primary compendium filter for every Morelord module. The screen lists Actor and Item compendiums. dnd5e stores the choices in the world setting `packSourceConfiguration`. `CompendiumBrowserSettingsConfig.isSourceEnabled(pack)` is the decision, and Core calls that method when dnd5e has loaded it:

- When `packSourceConfiguration[collection]` is set, that boolean is the answer. Unchecking the **System** package writes `false` for every system pack id, so those packs stay out. `true` keeps a pack even when its rules version does not match.
- When the collection has no entry, the pack is allowed only if `metadata.flags.dnd5e.rulesVersion` is empty or equal to the world **Rules Version** (`modern` or `legacy`). A 2014 SRD pack flagged `legacy` is omitted while the world is `modern`, and Core does not substitute another pack.

```javascript
const sources = game.modules.get("morelord-core").api.sources;
const packs = sources.getAllowedPacks({ documentName: "Actor" });
const offered = packs.filter(pack => modulePackIds.has(pack.collection));
const pack = sources.getAllowedPack("dnd5e.actors24");
if (!sources.isSourceAllowed(savedPackId)) return;
if (!sources.isUuidAllowed(uuid)) return;
const stop = sources.onConfigureSourcesChanged(() => refresh());
```

`getAllowedPacks({ documentName })` returns allowed compendiums in `game.packs` order. Omit `documentName` for every document type. `getAllowedPack(collection)` returns that pack, or `null` when it is missing or excluded. `isSourceAllowed` accepts a pack or a collection id. `sources.isPackAllowed` and `sources.filter.isPackEnabled` are the same pack decision. `isUuidAllowed` checks `Compendium.<package>.<pack>.<Document>.<id>`, the legacy form without a document type, and embedded ids. A UUID that is not a compendium document stays allowed. `filterAllowed` keeps entries only when every `uuid`, `pack`, `packId`, or `sourceId` on them is allowed.

These four functions are also exported from `scripts/services/dnd5e-source-filter-service.js`. Craftworks and Marketplace should import `getAllowedPacks` and `isUuidAllowed` from there, or call `api.sources`. A module source picker starts from `getAllowedPacks` and may only remove more packs.

Call `onConfigureSourcesChanged(callback)` or listen for `morelordCoreConfigureSourcesChanged` (`sources.configureSourcesChanged`) when Configure Sources or Rules Version changes. The callback reads the current decision; Core does not cache the allow-list.

Outside dnd5e, Core does not apply this filter. Pack ids are full collection ids.

`sources.filter.isSourceEnabled(label, { itemType })` is a separate book-label narrowing for copied SRD items. It can reject an SRD label whose canonical pack is excluded, and it cannot make an excluded pack allowed. `ItemPickerApp` searches allowed physical Item compendiums and drops a result if Configure Sources changes while it is open. Downtime commissions use that picker.

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

GM-only **Select multiple** controls support Scenes, Actors, Items, Journals, Rollable Tables, Cards, Macros, Playlists, and Compendium Packs, including pop-out directories. Checkboxes are the leftmost control on each row, including to the left of thumbnails and at the left of playlist headers, and use Foundry's flat checkbox. On a compendium pack card the checkbox sits over the upper left so the banner, title, and footer stay in place. Compact directory portraits stay beside the checkbox instead of underneath it. Clicks on checkboxes do not activate the underlying directory entry or open the pack. Shift-click selects the visible range from the previous checkbox. Select individual entries or **Select visible**, then use **Move selected (N)** to place them in a folder or **Root (no folder)**, or review the named list before confirming **Delete selected (N)**. On Compendium Packs, **Lock selected (N)** and **Unlock selected (N)** change the pack lock, and **Delete selected (N)** includes only world compendiums. **Clear selection** and **Done selecting** clear hidden selections too. Move changes only the selected entries' folder. Folders themselves remain; document and world-compendium deletion is permanent and uses Foundry's native API. No linked account or premium access is required. See `CORE-GM-PRODUCT-GUIDE.md` for every control and scope.

## Shared mass combat services (working tree)

`createMassCombat(moduleId, {selectedTokens} = {})` from `scripts/services/mass-combat.mjs` returns `{massCombat, resolveMassCombat}`. Actions are `attackers`, `resolve`, `apply`, `reconcile`, and `reset`; the caller module ID owns existing user/chat `massCombat` flags. Game Master preserves its original namespace and Encounters uses its own. Runtime group attacks require D&D5e 6.0.3+ and an eligible GM; other Core functionality remains system-neutral. `resolveMassCombat(faces, bonus, targets)` is the pure ordered-hit resolver; targets contain `hp`, `temp`, `ac`, `normal`, and `critical` damage. `edgePositions` and `overlaps` from `scripts/services/combat-placement.mjs` share the Smithy square-grid perimeter algorithm; occupied and scene rectangles use pixels, footprints use grid units, and the default inset is one square. The algorithm throws when no safe space remains. Encounters owns saved-roster scheduling; Smithy-specific rosters and cease-fire behavior stay in Game Master. Install these consumer changes together with this Core build; they are pending release. Dev1 verification of the Encounters consumer passed; Game Master’s native activity-switching dialog has also been verified in Dev1.

The optional `selectedTokens(role)` provider returns scene TokenDocuments for `attackers` or `targets`. Encounters supplies its NPC-type dropdown groups; callers that omit it retain map-selection behavior, including existing Game Master macros. Grouping combat turns remains Encounters-owned.

`ui.createChoiceGroup({name,label,value,choices})` creates Core's compact native radio-choice fieldset. Each choice accepts `value`, `label`, `icon`, optional `description` tooltip, and `disabled`. Core owns its responsive four/two-column layout; Encounters uses it for encounter types. `createMassCombat` also accepts `presentForm(config)`, returning a promise for `{action,data}` or null; Encounters embeds Core's existing attack form markup while Game Master retains native dialogs.

Shared mass-combat chat cards summarize targets hit, total hits, kills (zero HP), and total damage including temporary HP, with detailed target rows retained in the message flags. `createMassCombat(...).massCombat("reset")` cancels a pending preview while retaining applied damage and clears the current GM’s attack state. Encounters invokes reset when native combat ends. Existing Game Master macros consume the same summary renderer.

Mass-combat batches include their native `combatId`. The `reconcile` action clears missing, resolved, or previous-combat previews without applying damage; normal actions also reconcile before continuing. Pending review displays the result inline, and **Close Review** retains a valid result.

Mass Combat activity selection is shared through `scripts/services/mass-combat-profiles.mjs`: `massCombatActivities(actor)` extracts native attack/save activities and averages, and `massCombatProfileFields(profile)` renders Core setting rows. `presentForm` receives an optional `onChange(event, root)` callback to update activity-specific fields without replacing a window. Saving activities use native `rollSavingThrow` for each affected token/use with no individual chat messages; typed damage components, save scaling, defenses, temporary HP and serialized application are retained. Encounters owns generic NPC turn consolidation before native `startCombat`; Core does not change combat turn behavior.

Combined attack activities: Mass Combat uses Core’s shared activity profiles. An item’s on-hit save stays with its attack, including saves that deal no damage. The result summarizes native on-hit saving throws alongside weapon damage. A directly named/linked repeated-weapon Multiattack supplies the initial attack count; check **Attacks per troop** for optional attacks or mixed-weapon routines. First-hit-only saves are limited per target within one batch; resolve the full group sequence together. Non-damage effects remain GM-controlled.
