# Morelord Core Changelog

## 0.9.0

### Changed

- The GM guide's Shared Locations section explains why a place is defined once, how a GM sets it up, what each capability and Specialty gates, and how Downtime, Craftworks, Marketplace, and Journeys use that place. It includes a town forge example. The location window introduction names those four modules.
- In Manage Shared Locations, an Instructor capability's Specialty is a dropdown. Any is the default. The choices are a fixed D&D 2024 list of languages, skills, tools, weapons, armor, and weapon masteries. The list does not follow Configure Sources or compendium items. A saved specialty that is not in that list stays in the dropdown. Other capability types hide Specialty and keep a specialty that was already saved. The capability Source label is now Notes. Saved location fields are unchanged.
- A Forge capability's Specialty is the weapon proficiencies, armor proficiencies, and weapon masteries from that same fixed list. Any is the default.
- Instructor, Forge, and Workshop Specialty is a checkbox menu. One entry can store several specialties. The closed summary lists them, or Any when none are checked. Empty or Any means no restriction. A specialty saved as a single value is read as that one choice.
- Select group headings use the same background as the options, in the Morelord accent color and bold, so the heading is readable. Options stay in the normal text color and weight.

### Added

- Locations can list that fixed D&D 2024 training set and map a capability type to its specialty options, so other modules can use the list the Instructor and Forge dropdowns use.
- `api.locations.locationAllowsSpecialty(location, type, specialtyKey)` reports whether a location capability allows a subject. It stays the same function. It returns true when any capability of that type has no restriction or includes the key. `evaluateRequirements` uses that same match for a named specialty.
- `api.locations.activeContext(user)` returns the current place: the active Downtime session's location, On the Road when that session has no location, or the location for the scene that user is viewing. When Downtime is not active, or it has no active session, the viewed scene is used.
- Settings transfer includes Marketplace's Enable Locations setting.
- Workshop capabilities list the D&D 2024 artisan's tools that do not already match another capability. Smith's Tools stay with Forge and Alchemist's Supplies stay with Alchemist. Any remains the default, and a saved specialty that is not in the list stays available. `api.locations.toolCapabilityType(tool)` and `api.locations.listWorkshopSpecialties()` expose that map. A registered Tavern capability takes Brewer's Supplies and Cook's Utensils.

### Fixed

- Saving a location, or another background refresh, no longer brings a different open Morelord window to the front. The window where the button was clicked stays frontmost. A re-render of a window that is already open does not call `bringToFront` unless that render passes `focus: true`. `api.ui.renderInBackground(application)` is the shared refresh for an open window.

## 0.8.1

### Changed

- The 0.8.0 release notes now correctly state it was tested in Dev1. There are no functional changes.

## 0.8.0

### Added

- Modules can reorder cards in a list or a grid with `api.sortable.bind`. Dragging shows the whole card under the pointer, dims and outlines the original card, and draws a landing line where the card will drop. The `onReorder` callback receives the new id order when the drop changes it.
- **Select multiple** on the Compendium Packs sidebar, including its pop-out, uses the same checkboxes, **Select visible**, **Clear selection**, and **Done selecting** as the other sidebar directories. **Move selected (N)** places the checked packs in a compendium folder or **Root (no folder)**. **Lock selected (N)** locks the unlocked packs. **Unlock selected (N)** unlocks the locked packs, and asks before unlocking a system or module pack that a package update can overwrite. **Delete selected (N)** deletes the checked world compendiums after confirmation. System and module compendiums, and folders, stay.

## 0.7.0

### Added

- **Configure Sources** is now the main compendium filter for every Morelord module. Core keeps one shared list of the compendiums you have enabled in the D&D system's Configure Sources setting, and other modules read that list.
- Modules can ask Core whether a compendium is allowed, whether a source is allowed, or whether a compendium item is allowed. Anything from a compendium you turned off is refused.
- Core announces when Configure Sources changes, so open Morelord windows refresh on their own.

### Fixed

- A compendium you did not select in Configure Sources is no longer counted as enabled just because it was never switched off. Core now follows the same rule as the D&D system.
- Core's item picker lists only items from compendiums you have enabled.

## 0.6.2

### Changed

- **Token Distance Indicator** is a world checkbox that only a GM can change. Every client reads that choice. It stays checked by default. A world that has never saved it takes the previous per-client choice from the first GM who loads the world, including off, and otherwise stays checked. There was no Force choice to restore. **Compendium organization** stays a world setting and is now limited to a GM as well.

## 0.6.1

### Changed

- **Morelord Tools** lists its tools alphabetically by title, ignoring capitalization and a leading Morelord prefix. The button labels stay as registered. A module's order value no longer changes the sequence. With the titles Morelord Craftworks, Morelord Downtime, Morelord Encounters, Morelord Journeys, Manage Marketplace Shops, and Morelord Marketplace, that is the palette order.
- **Morelord Modules**, the info entry at the top of **Morelord Tools**, is shown only to a GM and opens a window of the same name. Players do not see that entry, and the window does not open for them. Players still see the other Morelord tools, including Morelord Craftworks, Morelord Downtime, and Morelord Marketplace.
- Choosing the crown only shows the tool column, and choosing a tool leaves **Morelord Tools** selected.
- The **Morelord Modules** window lists Core, Journeys, Encounters, Character Export, Craftworks, Marketplace, Downtime, and Game Master, each with its icon, one-line description, and a live status of **Active**, **Installed but inactive**, or **Not installed**.
- **Documentation** opens the documentation index at morelordgaming.com/docs. **Learn more** on a module that is **Not installed** opens that module's tools page. Game Master has no tools page, so **Learn more** opens its GitHub repository. **Support** offers **Get support** for the Morelord Discord server, **Morelord Gaming** for the website, and **YouTube** for the channel.

## 0.6.0

### Added

- **Morelord Tools** is a left scene control with a sharp crown icon. It lists tools registered by Morelord modules, stays selected after a tool is clicked, and is hidden when the current user has no visible tools. Modules register tools through `api.tools` from `init`, or with the `morelord-core.registerTools` hook during `setup`.

### Fixed

- The sharp crown icon uses the Sharp webfont Foundry already ships. Core loads `fa-sharp-solid-900.woff2` and points `.fa-sharp.fa-solid` at the Font Awesome 7 Sharp family, so the icon no longer falls back to the classic crown.

## 0.5.5

### Added

- **Move selected (N)** in the sidebar multi-select toolbar moves the checked world documents into a chosen folder or **Root (no folder)**. **Cancel** leaves them where they are. The move uses Foundry's document update API and reports the destination in an info notification.

### Fixed

- Sidebar multi-select keeps a compact-directory portrait beside the checkbox. When a directory style absolutely positions `.thumbnail` (such as Plutonium's Compact Directory), the portrait shifts to the right of `.ml-core-directory-check`, and an entry name placed directly after the checkbox (such as a journal row) no longer keeps extra compact left padding.

## 0.5.4

### Fixed

- Sidebar multi-select checkboxes are now the leftmost control on every directory row and use Foundry's flat checkbox styling, with a crisp, visible square and a dark checkmark on the orange accent fill. Actor, item, roll table, card, and macro checkboxes sit to the left of the thumbnail instead of splitting the thumbnail and entry name, and playlist checkboxes are the first control in the playlist header.
- Scene directory checkboxes stay in the upper-left corner of each scene card and isolate click and pointer events in capture phase so checking a scene no longer triggers scene activation when another module listens for row clicks.

### Improvements

- Shift-clicking sidebar multi-select checkboxes now selects or clears the visible range across directory rows.
- Packaged a cumulative root CHANGELOG.md inside release archives so in-Foundry changelog viewers (such as Big Bad Module Manager) can display release history directly in-app.

## 0.5.3

### Added

- Added a **Reaction** token status (`reaction`) with a lightning-bolt icon (`assets/icons/reaction-used.svg`) and a **Reaction Used** world setting (`reactionTracker`, enabled by default) that marks tokens when a creature in a started combat uses a D&D 5e reaction activity and clears the mark on the incoming turn, across shared Encounters mob turns, and when combat ends.

### Improvements

- The pending Morelord Account connection window now displays the activation code in large type with a **Copy** button and an **Open approval page** link in case the browser blocks the popup.
- Updated pending connection instructions to explain that the code should already be filled in on the approval page and can be pasted if needed.

## 0.5.2

### Improvements

- Added the shared stacked-right number stepper option: increment above decrement on the right of its number input. Existing horizontal steppers retain their layout.
- Labels containing shared steppers inherit the same uppercase muted field styling and spacing as direct-input labels.
- Documented the shared markup and native stepUp/stepDown interaction contract for consuming modules.

## 0.5.1

### Improvements

- Action badges can use data-tone="action" for an orange background and white text. Passive badges retain their existing appearance.
- Added the shared monster-card renderer consumed by Encounters and Craftworks, preserving each caller's actions.
- Added opt-in artwork fallback through Core page layout, also used by shared monster portraits.
- Added shared image-link buttons for accessible Craftworks recipe/material navigation, replacing its local output-image control styles.

## 0.5.0

### Added

- Shared Mass Combat activity profiles, group attack and saving throw resolution, and creature placement services support Encounters' new Mass Combat alpha. Existing Game Master integration retains its namespace and selection behavior.
- Shared compact choice groups provide responsive native encounter-type controls using Core's UI components.

### Improvements

- Group attack results summarize hits, kills, damage and attached on-hit saves. Native activity choices include critical damage, typed defenses, temporary HP, zero-damage saves and directly named or linked repeated-weapon Multiattack counts.
- Attack previews are bound to native combat identity; stale previews clear safely, and pending results can be reviewed, applied or discarded.

## 0.4.3

### Added

- GM sidebar multiselect and confirmed bulk deletion for Scenes, Actors, Items, Journals, Rollable Tables, Cards, Macros, and Playlists, including pop-outs. Shared Core toolbar and checkbox components support individual selection, Select visible, Clear selection, and Done selecting. Folders are preserved; no account or premium access is required.
- Token Distance Indicator, enabled by default per user. Players hover from their selected owned token or unique assigned-character token; GMs select one token first. Uses nearest occupied spaces, native grid rules, and scene units; adjacent tokens show 5 and distances round up in 5-unit intervals across token sizes. Disable it in Core settings when using another hover-distance module.

## 0.4.2

### Improvements

- Removed obsolete demo/video working notes and kept demo-production artwork out of the runtime ZIP. The reusable recording guide remains in the repository.

- Documentation buttons open the module documentation on the Morelord Gaming website in a new browser tab.
- Shared inventory access supports eligible party members without granting Group ownership.
- Shared read-only item previews preserve source document permissions.
- Shared quantity controls support cart removal and presentation slots.
- Character selections exclude actors assigned to or owned only by Ignored Users while retaining eligible offline-player and GM-managed characters.
- Added a manifest changelog link and moved release history into `release-notes/`. Local working files belong in ignored `/tmp/`.

- Release staging and generated ZIP files use module-local `/tmp/`; ZIP validation rejects working files and release-note sources.

## 0.4.1

### Added

- Shared window opacity control allows Morelord Game Master to use a fully opaque panel and tray handle. Other windows retain their existing appearance.

## 0.4.0

### Added

- Shared keyboard-accessible tabs, quantity controls, inline actor portrait selectors, responsive layouts, and collapsible sidebars support Marketplace's new Transfer workflow.

### Fixed

- Wide inventory tables keep horizontal scrolling within the shared page layout, and long item links wrap inside cards.

## 0.3.15

### Improvements

- Shared section subtitles use the main text color while explanatory paragraphs and hints use the muted notes color.
- Shared section headings support inline actions and reusable item links for shop and generator interfaces.
- Single-action chat requests support descriptive labels such as Long Rest and fill the available row width while normal DIS/Roll/ADV controls retain their layout.

## 0.3.14

### Improvements

- Show a one-time reporting notice to GMs in new and existing worlds, with feature usage and error sharing preselected while preserving previous opt-outs. Saving dismisses the notice; closing retries next session.
- Keep reporting preferences out of settings transfers and document the settings path, pseudonymous data, and retention.
- Use normal-weight body prose and Foundry theme surfaces for readable light/dark windows, footers, and select options. Preserve the shared roll-request, compendium, and tray services shipped in 0.3.11–0.3.13.

## 0.3.13

### Improvements

- Add a shared tray-handle button that uses the same background and transparency as Core control panels.
- Keep panel scrolling and layout unchanged while allowing feature modules to supply accessible open/close chevrons.

## 0.3.12

### Fixes

- Expose runSerialized through Core’s public socket API so Game Master, Craftworks, and Journeys can finish saved-roll outcomes after dice animations.
- Add a regression that exercises the public socket facade from the actual entry point, rather than only the internal socket service.

## 0.3.11

### Improvements

- Add reusable chat roll requests, grouped participant cards, GM fallback, and immediate Completed feedback while maintaining player permissions and private outcome ownership.
- Add shared dice-animation waiting and serialized outcome commits for Game Master, Craftworks, and Journeys.
- Add shared compendium organization and display labels, preserving pack identities and manual organization after migration.
- Add hotbar-sized macro buttons and preserve tray/window scroll positions during redraws.

## 0.3.10

### Improvements

- Troubleshooting exports include optional module diagnostics, with Craftworks catalog/access/source/sync state and privacy-safe recent harvesting outcomes. Existing synchronous export APIs remain compatible.
- Shared checkbox grids wrap long labels inside their columns, preventing overlapping Downtime activity and contributor choices.
- Added shared plain-text log formatting for nested result details. Downtime history uses readable sentences and Core cards without changing stored records.
- Added shared opt-in feature/error reporting, separate error consent, pseudonymous world IDs, bounded retries and an API consumed by the active gameplay modules. Historical version-sharing consent does not enable broader reports. The reporting website is deployed; reporting requires fresh GM consent.
- Shared participation supports opt-in `includePartyNpcs` for primary-party NPC companions; existing character-only consumers retain their behavior.
- Added a Discord Community entry in Core’s settings with a Join Discord button for support, feature requests, and general discussions, available to GMs and players.
- Added an opt-in compact badge layout that truncates long labels while keeping trailing quantities visible. Craftworks uses it for Harvest recipe pills; existing badges retain their layout.
- Core settings use a short anonymous-version-sharing checkbox label with its full explanation below, preventing text clipping in narrow windows.
- Shared skill rolls accept optional advantage/disadvantage while preserving native automatic rules.

## 0.3.9

### Added

- Shared enabled-compendium Item picker used by Downtime commissions.
- Shared D&D5e source filtering, including copied SRD provenance, for Craftworks and Marketplace.

### Improvements

- More consistent field alignment, checkbox labels, resource rows, and dialog buttons.
- Shared footers give buttons equal widths and heights, including wrapped labels.
- Downtime now follows the standard Morelord release requirements.

### Fixed

- Item-picker result rows grow with their content instead of overlapping at larger text sizes.
- Saving a Location keeps the Location manager open.

## 0.3.8

### Improvements

- Added shared, non-mutating Item rarity readers supporting legacy D&D 5e strings/choice objects and v6 arrays/Sets. Single-rarity workflows use the lowest listed rarity.
- Verified Foundry compatibility is explicitly recorded as 14.367; existing Foundry and system support minimums remain unchanged.
- Release guidelines require checking the latest stable Foundry build and confirming the published Foundry listing.

## 0.3.7

### Improvements

- Added GM-only settings export/import in Core for all enabled Morelord modules. Missing modules and unknown settings are skipped; campaign records and account credentials are excluded.

- Fixed shared multi-select controls collapsing to one row and hiding saved selections when unfocused, including Associated Scenes in Manage Locations.

- Shared settings rows now own responsive label/control layout. Settings template checks require a complete Core hero and footer.

- The Core settings Troubleshooting button downloads diagnostics directly. The Troubleshooting section is removed from Connect or Manage Account.

- Shared Locations uses standard Delete and Remove Capability buttons, including Core’s shared icon button component.

- Checkbox descriptions stay beside their controls at narrow widths, including existing settings labels; wrapped text remains in its own column.

- Core account settings, Ignored Users, and the Location editor use the shared page footer. Save actions remain outside the scrolling content, with native form submission preserved.

- Character eligibility is centralized in `MorelordCore.ui.participation.listCharacterActors()` and `listCharacterChoices()`: player-owned characters plus character members of the primary party Group, deduplicated. Party members may be Actor documents or stored Actor references. `ownedOnly` further limits the result to characters the current user owns. Modules should use these helpers for character selection and retain their operation-specific permissions.

- Added shared collapsible sections with native keyboard controls and remembered state per browser, world, and user. Journey Steps is the first consumer.

- Added a DOM builder for shared collapsible sections and a compact two-column quantity list. Journeys uses these for all creation sections and supply cards.

- Added shared source-pack labels that distinguish adventure folders and compendium types.
- Release archive validation accepts required runtime files and preserves numbered LevelDB pack logs.

## 0.3.6

### Improvements

- Show suggested population ranges for Hamlet, Village, Town, City, and Metropolis in the shared Locations Manager's Settlement Type dropdown.
- Share nested and keyed-panel scroll preservation, phase resets, and deferred restoration across Morelord modules.
- Support portrait decoration for actor-ID controls through a UUID resolver.
- Include development modules and chat templates in the shared design check.
- Require documentation review and record the production release exceptions in shared development instructions.

### Fixed

- Correct the documented release-token environment variable.

## 0.3.5

### Fixes

- Resolve MDT2 and untranslated Valda source labels to their full book names.
- Resolve AAW publisher credits within Mini-Dungeon Tome II without relabeling other publishers' books.
- Preserve owning-package metadata, custom sources, and SRD editions when resolving source names.

### Improvements

- Provide shared scrolling page bodies and separate action footers for Morelord application shells.
- Preserve page-body scroll positions and strengthen shared card and footer styles.

## 0.3.4

### Improvements

- Add a shared character identity component with circular portraits, readable names, and selected-character previews.
- Standardize heading and stack spacing and remove duplicate window-content padding.

## 0.3.3

### Improvements

- Keep hero Documentation buttons right-aligned without stretching.
- Document the shared landing-page header and section-card pattern, including heading size, subtitles, and divider placement.

## 0.3.2

### Improvements

- Consolidated and expanded the Morelord brand guide and marketing guidance.
- Added reference PDFs and Foundry package descriptions to the repository.
- Added tools for building and verifying reference PDFs.

## 0.3.1

Morelord Core 0.3.1 expands the shared module foundation with reusable skill rolls, product documentation, improved locations, and safer client-local window state.

### Added

- Added shared D&D 5e skill-roll helpers, including configured native rolls, skill modifiers, and natural d20 extraction for feature modules such as Craftworks.
- Added a shared product-documentation registry and responsive documentation viewer.
- Added reusable resource-list, help, stepper, toolbar, toggle, and icon callout components to the Core design system.
- Added the Other location type for strongholds, garrisons, and other non-settlement locations.

### Improved

- Improved Location Manager with searchable multi-Scene selection, selected-Scene ordering, direct location opening, and cleaner location cards.
- Stored window geometry in per-user local storage so player window changes never attempt to update world settings.
- Prevented player clients from refreshing or persisting the GM-authoritative entitlement cache.

## 0.3.0

Morelord Core 0.3.0 expands the shared foundation used by the Morelord module family with locations, capability requirements, reusable workflow helpers, and unified asset source labels.

### Added

- Added GM-managed shared locations with settlement types, Scene associations, notes, and tiered capabilities.
- Added capability registration and requirement evaluation APIs for feature modules such as Craftworks, Marketplace, Journeys, and Downtime.
- Added shared character participation helpers and scroll-preserving application rendering.
- Added a shared source-book label resolver for consistent compendium asset attribution across Morelord modules.
- Added reusable design-system components for check grids, list buttons, badges, status treatments, and location management layouts.

### Improved

- Expanded the release workflow to publish package versions directly to Foundry VTT alongside GitHub and the Morelord Gaming release feed.
- Added project-local environment loading and stricter manifest compatibility validation to release tooling.
- Preserved outer window scrolling and bottom spacing across Morelord application layouts.

## 0.2.2

Morelord Core 0.2.2 adds a shared contextual request transport for reliable cross-client module workflows.

### Added

- Added a Socketlib-backed contextual transport with module namespaces, explicit user and GM targeting, queued handlers, execution metadata, and keyed mutation serialization.
- Made the contextual transport initialize immediately when Core loads after Socketlib is already ready.
- Declared Core's module socket namespace and Socketlib dependency.

### Fixed

- Added a message ID fallback for environments where `crypto.randomUUID` is unavailable.

## 0.2.1

Morelord Core 0.2.1 expands the shared design system used by Morelord feature modules and makes support diagnostics easier to reach.

### Added

- Added shared expandable details, audit card, and definition-list components for auditable roll outcomes.
- Added compact ghost icon-button and accent-button variants.
- Added a semantic foreground token for accent buttons.

### Fixed

- Fixed explicit-path handling in the design-system boundary checker.
- Added an always-visible Troubleshooting entry to Morelord Core settings so diagnostics can be downloaded without a Morelord Gaming account or active connection.

## 0.2.0

Morelord Core 0.2.0 introduces the shared Morelord visual system used across the full module family.

### Added

- Added Core-owned design tokens, typography, application shells, cards, sections, fields, statuses, empty states, choice cards, progress, and dialog layout.
- Added a release-time design-system audit covering component ownership, readable namespaces, settings, accessibility, templates, typography, and tokens.
- Added deterministic namespace and stylesheet migration tools.
- Added the Morelord product UI brand guide and developer visual fixtures.

### Improved

- Moved Core connection and privacy settings into the single Morelord Account Configure application.
- Standardized application, chat-card, form-control, focus, responsive, and opaque dialog-footer behavior.

## 0.1.3

Adds a privacy-conscious troubleshooting report that makes user environment and compatibility issues easier to diagnose.

### Added

- Added a GM-facing diagnostics download with Foundry, game system, active module, browser, display, and graphics details.
- Added reusable `getDiagnostics()` and `exportDiagnostics()` methods to the Morelord Core API.
- Added the sanitized world index to diagnostic filenames so reports from different worlds remain distinct.

### Changed

- Marked Morelord Core as verified for Foundry VTT 14 while retaining Foundry VTT 13 as the minimum supported version.
- Standardized the release workflow and website release metadata configuration.

### Security

- Diagnostic contents exclude account credentials, installation and world identifiers, network addresses, users, and campaign content.

## 0.1.2

### Improvements

- Reports the installed Morelord Core and Foundry versions during entitlement refreshes when anonymous usage statistics are enabled.
- Adds a GM-only **Share Anonymous Usage Statistics** setting.
- The analytics payload contains only version information; no campaign, player, actor, item, chat, or world-name data is added by this feature.

### Website analytics

These version reports help the Morelord Gaming administration dashboard measure active installations, version adoption, and Standard/Premium/Champion conversion. Disabling anonymous usage statistics does not affect account linking or entitlements.

## 0.1.1

### Improved account connection workflow

- Opens the Morelord account page directly at the Foundry activation form.
- Prefills the temporary activation code on the website.
- Clearly explains where to enter and approve the code.
- Reopens the exact pending approval page when requested.
- Improves Foundry status text while waiting for website approval.
- Clarifies when the account has connected successfully and the browser tab can be closed.
