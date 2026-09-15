# Morelord Branding Guide

Version 2.2 | September 7, 2026 | Consolidated brand, product UI, and marketing reference

This is the canonical guide for Morelord Gaming's product identity, shared Foundry interface, and channel copy. It supersedes the separate Product UI Brand Guide and Marketing & Branding Guide. Use this editable Markdown as the source for the matching PDF.

The September 2026 review covers all eight local Morelord folders. Product claims below describe the inspected local manifests, READMEs, manuals, and selected implementation files. Local version numbers do not establish public release availability. Compendium has a separate legacy compatibility baseline.

## Brand architecture and naming

- Use **Morelord Gaming** for the organization and **Morelord** for the product family, matching the package titles. Do not alternate with MoreLord or More Lord in new public copy.
- Use each full product name on first mention; the short product name is appropriate afterward.
- Use **Morelord Tools** where it names an existing access product. Preserve **Standard**, **Premium**, and **Champion** access labels without inventing new bundles or prices.
- Keep package IDs, stored keys, APIs, and filenames stable. Display-name cleanup does not authorize a data migration.
- My Characters on the Morelord Gaming website is the import destination for Character Export. GMs and players can register for a free website account to import their exported characters. It is not another installed module in this inventory.
- Use existing approved artwork when supplied. These sources do not define a master logo, logo clear space, or a licensed marketing font; do not invent those as established brand rules.

## Reviewed product inventory

| Product | Local version | Role and publication boundary |
| --- | --- | --- |
| Morelord Core | 0.3.1 | Shared account/access, design system, documentation, participation, and Locations. |
| Morelord Character Export | 0.3.2 | Portable D&D 5e character JSON and embedded artwork; separate sheet action. |
| Morelord Compendium | 1.0.6 | Shared D&D 5e content packs; manifest minimum/verified Foundry 13. |
| Morelord Craftworks | 0.4.5 | Acquisition, materials, recipes, and Premium crafting execution. |
| Morelord Downtime | 0.1.0 | Persistent Sessions, Projects, Training, time allocation, and Marketplace-backed Source Item. |
| Morelord Encounters | 0.1.9 | Generated, custom, and supported published encounter rosters. |
| Morelord Journeys | 0.3.1 | Persistent travel, expedition supplies, camp, and optional integrations. |
| Morelord Marketplace | 0.9.2 | Catalog, Buy/Sell carts, approvals, and Premium scene-shop management. |

## Compatibility and dependency snapshot

Read the actual package manifest before publishing installation requirements. Declared minimum versions and verified versions are different claims. Dependencies below are direct; Core itself requires socketlib 1.1.3 or newer.

| Package | Foundry baseline | System / required modules |
| --- | --- | --- |
| Core | Minimum 13; verified 14 | socketlib 1.1.3+; no game-system restriction declared |
| Character Export | 14 only | dnd5e minimum 4.0.0, verified 5.3.3; ApplicationV2 sheet required; no Core dependency |
| Compendium | Minimum 13; verified 13 | dnd5e; v14 verification not declared |
| Craftworks | Minimum/verified 14 | dnd5e 5.3+; Core 0.1.0+; socketlib 1.1.3+ |
| Downtime | 14 only | dnd5e 5.3+; Core 0.3.0+ |
| Encounters | 14 only; verified 14.365 | dnd5e 5.3+; Core 0.1.0+ |
| Journeys | 14 only; verified 14.365 | dnd5e 5.3+; Core 0.3.0+ |
| Marketplace | Minimum/verified 14 | Core 0.1.0+; README specifies a compatible dnd5e system, without a manifest system minimum |

Downtime recommends Journeys, Craftworks, and Marketplace. Journeys recommends Encounters in its manifest and documents an optional Craftworks integration. Optional integrations must not be presented as universal prerequisites. System-neutral internals do not establish support for every game system.

## PDF and document visual standard

Use the shared Morelord document style: US Letter portrait, white paper, black Arial body text, generous margins, bold section headings, muted blue-gray running labels, and right-aligned page numbers. Use approximately 10.5 pt body text, 27 pt cover titles, 18 pt section headings, and 12 pt subheadings. Tables use pale-blue headers and alternating very light blue rows, with wrapped text and repeated headers over page breaks.

Keep headings with their following text. Preserve searchable text, useful links, figure proportions, and source/version notes. The document palette is for readable print; application windows continue to use Core's theme-aware tokens.

## Application token reference

`styles/morelord-tokens.css` is the implementation source of truth. Most colors inherit Foundry theme variables; the hex colors here are fallbacks, not mandatory rendered colors.

| Role | Current fallback or scale |
| --- | --- |
| Accent / strong accent | #d6a34a / #b98227 |
| Success / information | #4f9f68 / #6997dc |
| Warning / danger | #c98b20 / #b94b4b |
| Window base / opaque footer | #18161d (mixed at 94%) / #0d0c12 |
| Body / heading families | Foundry --font-body / --font-h1 through Core tokens |
| Text sizes | .75, .875, 1, 1.35, and 2 rem |
| Spacing | 4, 8, 12, 16, and 24 px |
| Corner radii | 4, 6, 8 px; pill 999 px |
| Controls / avatars | 34 px control height; 32 and 48 px avatars |

## Product UI principles

Every Morelord window must be recognizable as part of one product family before its module-specific purpose is considered. Modules may have different workflows and information architecture, but they must share the same shell, typography, surfaces, controls, spacing, state colors, and interaction behavior.

Shared code alone is not sufficient. If two windows consume the same variables but still look unrelated, the standardization is incomplete.

## Ownership

Morelord Core owns:

- Global fonts, type scale, line heights, and heading hierarchy
- Window, surface, border, muted-text, focus, and semantic-state colors
- Spacing, radii, control heights, and avatar sizes
- Application and dialog shells
- Cards, surfaces, heroes, sections, fields, actions, icon buttons, badges, statuses, empty states, choice cards, and progress bars
- Dialog footer layout and appearance
- Accessibility and design-system release checks
- Shared Location management, actor participation, documentation UI, and window geometry services

Feature modules own:

- Domain-specific layout and data presentation
- Marketplace tables, cart, prices, and shop workflows
- Journeys phases, supplies, routes, roles, and expedition workflow
- Craftworks recipes, materials, harvest, crafting, and generators
- Encounters party, source, monster, and encounter-result layouts
- Downtime Sessions, Projects, time allocation, and activity layouts
- Character Export sheet controls and export workflow
- Decorative colors that communicate domain identity rather than UI state

Feature modules must consume Core for shared concepts and must not redefine Core selectors or global tokens.

## Required window anatomy

Every ApplicationV2 window must include `ml-window` in `DEFAULT_OPTIONS.classes`. Every full application template must begin with an `ml-app` root and normally also use `ml-app-shell`.

```html
<section class="ml-app ml-app-shell ml-example-app">
  <header class="ml-hero ml-example-hero">
    <div class="ml-hero__body">
      <h1>Product or workflow title</h1>
      <p>One concise sentence describing the workflow.</p>
    </div>
    <div class="ml-hero__actions">...</div>
  </header>
  ...
</section>
```

Use the shared 24px desktop content padding and 16px compact padding. Do not introduce module-specific shell padding.

## Dialog contract

Foundry `DialogV2` requires `config.content` itself to have no attributes. Never add `class`, `id`, or data attributes directly to that element. Put the shared shell on an inner wrapper:

```html
<div><!-- attribute-free config.content -->
  <div class="ml-app ml-app-shell ml-dialog-shell">...</div>
</div>
```

Dialog content and footer are separate layout rows:

- Only the content body scrolls.
- The scrollbar must stop above the footer.
- The footer is fully opaque and never overlays visible content.
- Footer actions remain visible at every scroll position.
- Footer buttons share equal widths and stretch to the height required by the longest wrapped label. Use Core's shared footer sizing, not individual button heights.
- Content reserves no fake transparent overlay space.

The same rule applies to every application page. Put page-level bottom actions in
`<footer class="ml-page-footer ml-actions">`. Core's render hook moves that footer
beside the `.ml-app-shell` body and provides the single page scrollbar, bottom
spacing, and opaque footer. Form submit buttons retain their form association.
Inline item actions remain with their item. Do not add pane scrollbars, sticky
action overlays, or module-owned page/footer padding. Core exposes the same
behavior as `MorelordCore.ui.applyPageLayout(application)` for custom renderers.

For fixed-height description cards, Core's `ml-card__body[data-scroll]` is an
explicit exception: complete text scrolls inside the card while card actions
remain visible. Give the body `tabindex="0"` and an accessible description label.

## Typography

- Body text uses `--ml-font-family-body`.
- Headings use `--ml-font-family-heading`.
- Display/page titles use `--ml-font-size-display`.
- Section titles use the shared `h2`/`h3` hierarchy or `.ml-section-heading`.
- Supporting copy uses `--ml-color-muted`, `.notes`, `small`, or `data-text="muted"`.
- Feature CSS may use `font-family: inherit` or a Core `--ml-font-*` token only.
- Do not hard-code font stacks in feature modules.

## Color

Use Core semantic tokens according to meaning:

| Meaning | Token or tone |
| --- | --- |
| Primary emphasis and premium access | `--ml-color-accent` / `premium` |
| Successful, available, or ready | `--ml-color-success` / `success` |
| Active processing or informational | `--ml-color-info` / `info` |
| Warning or incomplete | `--ml-color-warning` / `warning` |
| Failure, destructive, or unavailable | `--ml-color-danger` / `danger` |
| Supporting or secondary text | `--ml-color-muted` |

Never use a raw red, green, amber, or blue to represent application state. Domain palettes may remain local only when color is decorative or represents fictional content rather than status.

## Shared components

| Need | Component |
| --- | --- |
| Window content root | `.ml-app .ml-app-shell` |
| Page-level bottom actions | `.ml-page-footer .ml-actions` |
| Settings description and control | `label.ml-setting-row` with a text `span` and sibling control |
| Item image, label, and controls | `.ml-item-row` |
| Character participation choices | `.ml-actor-choice-grid`, `.ml-actor-choice` |
| Product/workflow header | `.ml-hero`, `.ml-hero__body`, `.ml-hero__actions` |
| Bordered content region | `.ml-surface` |
| Reusable interactive/content card | `.ml-card` |
| Page title without a full hero | `.ml-page-title` |
| Logical section | `.ml-section`, `.ml-section-heading` |
| Horizontal actions | `.ml-actions` or `.ml-toolbar` |
| Icon-only control | `.ml-icon-button` plus `aria-label` |
| Selected actor/source/item | `.ml-choice-card` |
| Status or compact label | `.ml-status` or `.ml-badge` with `data-tone` |
| Display-neutral semantic copy | `.ml-text` with `data-tone` |
| Full empty view | `.ml-empty-state` |
| Compact empty copy | `.ml-empty-message` |
| Settings group | `.ml-settings-section` |
| Account/access state | `.ml-access-card` |
| Progress | `.ml-progress`, `.ml-progress__fill` |
| Generated chat content | `.ml-chat-card` |

Add the shared class alongside a readable module class. The shared class owns common appearance; the module class owns domain layout or content-specific adjustments.

## Forms and controls

- Inputs, selects, and textareas use the shared height, background, border, radius, and focus treatment.
- Select menus must remain readable in their expanded native popup; Morelord’s dark windows use a dark `color-scheme` and opaque option background.
- Field labels use the shared uppercase eyebrow treatment.
- Checkbox and radio accents use the Core accent color.
- Buttons containing only an icon require an accessible name.
- Delete and other destructive actions use standard Core buttons, never red button variants. Danger colors are for status and feedback, not buttons.
- Content-sized buttons must use `height: auto`, `max-height: none`, and normal wrapping when labels can wrap or be localized.
- Clickable item results use `button.ml-card.ml-item-row` with an image and `.ml-stack` text child. Core owns their content-sized height, left alignment, and wrapping; never apply fixed control heights to card or list buttons.

## Spacing and responsive behavior

Use `--ml-space-1` through `--ml-space-5`; avoid introducing near-duplicate spacing values for shared structures. Use Core radii and control sizes.

- Two- and three-column shared grids collapse at 700px.
- Cards must grow with their content and must never allow labels or descriptions to escape their borders.
- Actions wrap instead of clipping.
- Wide domain layouts may remain wide, but shell padding and visual hierarchy stay consistent.
- At 200% zoom, every control must remain reachable and no sticky footer may cover focused content.

## Namespaces

Use readable feature prefixes:

- `ml-core-*`
- `ml-marketplace-*`
- `ml-journeys-*`
- `ml-craftworks-*`
- `ml-craftworks-harvest-*`
- `ml-encounters-*`
- `ml-downtime-*`
- `ml-character-export-*` for new exporter-owned UI

Core-owned cross-suite components, such as the existing `ml-location-manager-*`, retain their shared namespaces. Compendium content does not need an application shell unless it adds a custom application.

Do not introduce `mlm-*`, `mjourneys-*`, `mcw-*`, `mlh-*`, `morelord-encounter-*`, or generic cross-module feature names. Apply the same readable convention to data attributes and JavaScript `dataset` properties.

Preserve module IDs, stored setting keys, flags, pack IDs, and public API identifiers unless a separate data migration is explicitly planned.

## Settings

Feature-module configuration should use one Configure application, with implementation settings registered using `config: false` and existing keys preserved. Core currently exposes separate account, troubleshooting, and shared Location menus, plus its usage-statistics setting. These are existing shared-service entry points; do not remove them to force a single menu. Character Export is a sheet action and Compendium is a content package, so neither needs an empty Configure application.

## Accessibility

Character names in product content must be paired with their avatar. Use Core's `ml-actor-identity` / `ml-avatar` component and `ui.actorIdentity` renderer for rows, role assignments, summaries, pending checks, and results. Resolve identities by actor UUID, preserving saved names/portraits where available; missing actors use a neutral portrait. Avatars are circular (`border-radius: 50%`) with a square frame and `object-fit: cover`, and decorative beside the readable name (`alt=""`). Keep names at body size in supply manifests; use ordinary rows rather than small badges for item and character identities. Native character selectors retain their accessible text options and show the selected identity beside the control through `ui.decorateActorSelect`. Native window titles, accessibility labels, and system-owned plain-text messages remain text.

- All interactive controls are keyboard reachable.
- Focus is visibly indicated.
- Icon-only buttons have `aria-label`.
- Images use meaningful alt text or `alt=""` when decorative.
- Progress controls expose progressbar semantics.
- State is not communicated by color alone.
- Reduced-motion preferences are honored.
- Text and native option menus maintain readable contrast.

## Release checklist

Before considering a UI change complete:

1. Run `npm run check:design-system` in Morelord Core. Its current default target list covers Marketplace, Journeys, Craftworks, and Encounters; include Downtime explicitly when reviewing its UI: `node tools/check-design-system.mjs ../morelord-downtime`. A passing default run is not evidence that every module was checked.
2. Run syntax/tests available in every affected module.
3. Run `git diff --check` in every affected repository.
4. Confirm the namespace migrator reports zero changes.
5. Test normal and minimum window widths.
6. Test keyboard navigation and visible focus.
7. Test 200% zoom.
8. Confirm empty, loading, disabled, locked, success, warning, and error states.
9. Confirm dialog content scrolls independently and stops above an opaque footer.
10. Compare the window beside at least one other Morelord module: it should clearly belong to the same product family.

## Reminder prompt for future work

Use this when starting a future Morelord UI task:

> Follow `morelord-core/MORELORD-BRAND-GUIDE.md`. Core owns the visual system and shared components. Preserve readable `ml-{module}-*` namespaces, use the required `ml-window` and `ml-app` shells, keep DialogV2 content attribute-free with an inner `ml-dialog-shell`, use semantic Core tokens, keep footers opaque and outside the scroll region, and run the Core design-system check before completion.

## Brand foundation

### Brand promise

**Run the parts between the adventures as confidently as the adventures themselves.**

Morelord modules turn time-consuming tabletop administration into clear, game-ready workflows inside Foundry VTT. They support the GM, keep players involved, and leave the important decisions at the table.

### Positioning statement

For Foundry VTT groups who want deeper campaign systems without more bookkeeping, Morelord Gaming creates focused, connected tools for shopping, travel, encounters, gathering, crafting, and downtime. Each module improves one part of play and fits into a consistent suite, so groups can use exactly the tools their campaign needs.

### Approved taglines

- **Better tools. Smoother sessions. More adventure.** — primary suite tagline
- **Build the world between the battles.** — campaign-systems tagline
- **Less bookkeeping. More table time.** — benefit-led tagline
- **Purpose-built tools for Foundry VTT.** — platform-led tagline

### Voice

Morelord copy is:

- **Capable:** lead with what the product helps the table accomplish.
- **Grounded:** describe real workflows, not vague promises of “revolutionary” play.
- **Inviting:** write for working GMs and players, not software buyers.
- **Specific:** prefer “drag generated monsters into the scene” to “powerful automation.”
- **Table-first:** technology supports the game; it is not the hero of the story.

Use **Foundry VTT** after the first use of **Foundry Virtual Tabletop** when space allows. Use **GM**, not “Dungeon Master,” except when referring to an official D&D term. Avoid “seamless,” “ultimate,” “revolutionary,” and “AI-powered.”

# Suite Copy

Use the shared body paragraph style for all copy below. Reserve bold for headings and short labels, not whole promotional paragraphs. Module headings sit directly beneath this Suite Copy section.

## Morelord Gaming suite

The Foundry Description under each module is complete HTML listing copy. Both the PDF and Markdown show literal HTML source code, including tags. Copy the code into the Foundry description editor in HTML/source mode. Matching `.html` files are provided in `output/foundry-descriptions/` for direct copying. These are editorial deliverables; package manifests are not changed.


### Micro — up to 80 characters

Connected campaign tools for better Foundry VTT sessions.

### Short — social bio or compact directory

Morelord Gaming builds focused Foundry VTT tools for shopping, travel, encounters, gathering, crafting, and downtime—so your group spends less time on bookkeeping and more time playing.

### Medium — website section or partner listing

Morelord Gaming creates purpose-built modules for Foundry Virtual Tabletop. Run living marketplaces, structure overland journeys, build level-appropriate encounters, and turn monster harvesting and gathered materials into meaningful crafting. The connected gameplay modules share familiar controls and Core services. Character Export provides a separate portable character workflow. Use the complete suite or choose only the tools your world needs.

### Long — About page or press kit

The best campaigns are made of more than combat. They are shaped by the roads the party travels, the supplies they carry, the creatures they face, the materials they recover, and the places where they trade. Morelord Gaming builds Foundry Virtual Tabletop modules for those connected parts of play.

Each Morelord module turns a demanding campaign task into a focused workflow inside Foundry VTT. Marketplace makes buying, selling, and running scene vendors easier. Journeys gives exploration a persistent rhythm of planning, travel, discovery, and camp. Encounters helps GMs quickly assemble appropriate monster rosters from the sources available in their world. Craftworks connects gathering, harvesting, loot, materials, recipes, and crafting. Downtime organizes Sessions, ongoing Projects, Training, and item sourcing. Character Export creates portable character files. Morelord Core supplies shared account, interface, documentation, and Location services.

The result is less administrative friction without taking meaningful choices away from the table. GMs stay in control, players remain part of the process, and every world can use the combination of tools that fits its campaign.

## Morelord Marketplace

### One-line hook

Turn your compendiums into a marketplace your players can actually use.

### Micro — launcher, card, or social graphic

Buy, sell, and run immersive scene shops in Foundry VTT.

### Foundry package description

A modern buying, selling, and shop system for Foundry VTT. Browse enabled D&D 5e item sources, filter large catalogs, purchase with character or party funds, sell from actor inventories, and create configurable scene vendors with premium Shop Manager tools.

### Website short

Morelord Marketplace turns your enabled item compendiums into a searchable, player-ready catalog. Characters can buy and sell from their inventories, use personal or shared party funds, and interact with scene vendors built by the GM.

### Website long

Make shopping part of the world instead of a pause in the session. Morelord Marketplace gives players a fast, visual way to browse enabled D&D 5e item sources, compare prices, filter large catalogs, buy equipment, and sell items directly from their character inventories. Purchases can go to one character while payment comes from another character or a shared Group actor.

The Standard global Marketplace supports catalog browsing, buying, and selling, with multi-item Buy and Sell carts. Premium access adds optional GM approval of whole-cart transactions. Premium Shop Manager tools let GMs create reusable scene vendors with their own stock, pricing, rarity and product rules, reputation modifiers, restocking behavior, and buy/sell permissions. Optional GM approvals keep player transactions under control without turning every purchase into manual inventory work.

### YouTube description

Bring shopping and selling into the session with Morelord Marketplace for Foundry VTT. In this video, you'll see how players browse enabled D&D 5e item sources, filter the catalog, pay with character or party funds, sell directly from inventory, and interact with GM-built scene shops.

Morelord Marketplace includes a Standard global catalog experience, while Premium features add Shop Manager vendors, stock, restocking, reputation pricing, and optional GM transaction approvals.

**Morelord Gaming:** https://morelordgaming.com

**Requirements:** Foundry VTT v14, a compatible D&D 5e system, and Morelord Core.

`#FoundryVTT #DnD5e #TTRPG #VirtualTabletop`

### Search title and meta description

**Title:** Morelord Marketplace — Foundry VTT Shops, Buying & Selling

**Meta:** Build a searchable D&D 5e marketplace in Foundry VTT. Let players buy, sell, use party funds, and visit configurable scene vendors.


### Foundry Description (HTML)

```html
<h3>Make every shopping trip part of the adventure.</h3>
<p>The party has gold to spend, gear to sell, and a world to explore. Give them a marketplace worth opening. Morelord Marketplace turns your enabled D&amp;D 5e item sources into a searchable catalog where players can find what they need and handle purchases and sales inside Foundry VTT.</p>
<ul>
  <li><strong>Find the right gear.</strong> Search and filter by item type, rarity, source, price, and more instead of digging through compendiums.</li>
  <li><strong>Keep shopping moving.</strong> Build Buy and Sell carts with multiple items and quantities, then complete the transaction together.</li>
  <li><strong>Shop as a party.</strong> Scene shops let you choose who receives the items and which character or Group actor pays.</li>
  <li><strong>Give your world its own merchants.</strong> Premium Shop Manager adds configurable vendors with stock, pricing, reputation modifiers, restocking, and buy/sell rules.</li>
  <li><strong>Keep the GM in control.</strong> Premium transaction approvals let the GM review player purchases and sales before they commit.</li>
</ul>
<p>The Standard global Marketplace covers browsing, buying, and selling. Add Premium features when your campaign calls for managed transactions and distinctive scene shops. Your existing world data stays in place if Premium access expires.</p>
<p>Requires Foundry VTT v14, a compatible D&amp;D 5e system, and Morelord Core. Item availability comes from your enabled sources.</p>
<p>Put the next great purchase within reach. <a href="https://morelordgaming.com">Explore Morelord Gaming and find the tools for your table.</a></p>
```

## Morelord Journeys

### One-line hook

Make the road part of the adventure.

### Micro — launcher, card, or social graphic

Structured travel, exploration, supplies, and camp for Foundry VTT.

### Foundry package description

A structured, stateful exploration and travel workflow for Foundry VTT. Plan routes, assign expedition roles, resolve weather, navigation, encounters, discoveries, foraging, supplies, camp, watches, and journey history while keeping consequential choices with the players.

### Website short

Morelord Journeys turns overland travel into a persistent part of the campaign. Plan the route, manage expedition roles and supplies, resolve each travel day, and preserve the story of the journey from departure to camp.

### Website long

Travel should create stories, not disappear between two map pins. Morelord Journeys gives exploration a structured, stateful workflow in Foundry VTT. The party plans a route, takes expedition roles, makes travel-day decisions, manages supplies, and faces weather, navigation, encounters, discoveries, foraging, and camp.

Progress and delays remain tied to the active journey, while an expedition log records what happened along the way. Inventory-backed food, water, tents, bedrolls, and blankets make preparation matter. Persistent watch order, private watch rolls, and sleep checks carry the day into camp. Optional integrations with Morelord Encounters and Morelord Craftworks connect travel to the rest of the campaign without taking the players' important decisions away.

### YouTube description

Make overland travel a meaningful part of your Foundry VTT campaign with Morelord Journeys. This video walks through route planning, expedition roles, travel-day phases, supplies, navigation, encounters, discoveries, foraging, camp, watches, and the persistent expedition log.

Journeys keeps the workflow organized while leaving consequential decisions and rolls with the players. Optional Morelord Encounters and Craftworks integrations can connect the road to combat, gathering, and the wider campaign economy.

**Morelord Gaming:** https://morelordgaming.com

**Requirements:** Foundry VTT v14, a compatible D&D 5e system, and Morelord Core.

`#FoundryVTT #DnD5e #Hexcrawl #TTRPG`

### Search title and meta description

**Title:** Morelord Journeys — Travel & Exploration for Foundry VTT

**Meta:** Run structured D&D 5e travel in Foundry VTT with routes, roles, supplies, weather, navigation, discoveries, camp, watches, and journey history.


### Foundry Description (HTML)

```html
<h3>Make the road as memorable as the destination.</h3>
<p>A dangerous route. Dwindling supplies. A discovery that changes the plan. Morelord Journeys gives overland travel a place in your campaign's story, with a persistent Foundry VTT workflow that carries the expedition from departure through the day's challenges and into camp.</p>
<ul>
  <li><strong>Give preparation a purpose.</strong> Plan the route, select travelers, assign expedition roles, and review the supplies the party actually carries.</li>
  <li><strong>Put choices into every travel day.</strong> Work through pace, weather, navigation, encounters, discoveries, and foraging with clear prompts and recorded results.</li>
  <li><strong>Keep players involved.</strong> Request the relevant character rolls while leaving consequential decisions with the table.</li>
  <li><strong>Carry the adventure into camp.</strong> Manage watches, shelter, supplies, and sleep checks instead of ending the journey at sunset.</li>
  <li><strong>Remember the road behind you.</strong> Preserve progress and expedition history across sessions.</li>
</ul>
<p>Optional Morelord Encounters and Craftworks integrations connect travel to monster rosters and gathering workflows. Use the combination that fits your campaign, with the GM guiding the consequences.</p>
<p>Requires Foundry VTT v14, D&amp;D 5e 5.3 or later, and Morelord Core 0.3.0 or later.</p>
<p>Give the party a reason to remember the journey. <a href="https://morelordgaming.com">Discover the Morelord suite.</a></p>
```

## Morelord Encounters

### One-line hook

Build the next encounter before the table loses momentum.

### Micro — launcher, card, or social graphic

Generate game-ready D&D 5e monster rosters in Foundry VTT.

### Foundry package description

An encounter builder for Foundry VTT and D&D 5e. Generate six encounter alternatives, assemble custom rosters with a live difficulty rating, or use supported published Drakkenheim encounters when the required content is available. Review linked, draggable monster Actors for scene placement.

### Website short

Morelord Encounters helps GMs turn a difficulty target and available monster sources into a game-ready roster. Choose from six encounter styles, review the results, and drag linked monster Actors directly into the scene.

### Website long

When the party goes somewhere unexpected, build an encounter without breaking the session's momentum. Morelord Encounters uses the party, target difficulty, and monster sources available in the world to generate a ready-to-review roster inside Foundry VTT.

Choose Pack Skirmish, Boss Battle, Boss and Minions, The Horde, Elite Team / Mirror Team, or Random to shape the result. Generated monsters are linked Foundry Actors that the GM can inspect and drag directly into the scene. Custom mode adds a searchable monster browser and live difficulty rating. Published Drakkenheim encounters depend on available source content. Difficulty budgets guide GM judgment; they do not guarantee a balanced fight. Standard access supports SRD creatures; premium access can use installed core and third-party monster sources, with selection remembered at the individual source-book level.

### YouTube description

Build a game-ready D&D 5e encounter without leaving Foundry VTT. In this video, you'll see how Morelord Encounters uses party difficulty, enabled monster sources, and six encounter styles to create a roster of linked, draggable monster Actors.

Choose Pack Skirmish, Boss Battle, Boss and Minions, The Horde, Elite Team / Mirror Team, or Random, review the result, and drag the creatures directly into your scene.

**Morelord Gaming:** https://morelordgaming.com

**Requirements:** Foundry VTT v14, D&D 5e 5.3+, and Morelord Core.

`#FoundryVTT #DnD5e #EncounterBuilder #TTRPG`

### Search title and meta description

**Title:** Morelord Encounters — D&D 5e Encounter Builder for Foundry VTT

**Meta:** Generate D&D 5e monster rosters against difficulty targets in Foundry VTT. Choose difficulty, sources, and encounter style, then drag linked Actors into your scene.


### Foundry Description (HTML)

```html
<h3>The party went off the map. Have the next encounter ready.</h3>
<p>Turn an unexpected turn in the story into a roster you can use. Morelord Encounters brings encounter preparation into Foundry VTT, helping you move from party levels and a difficulty target to linked monster Actors you can inspect and drag into the scene.</p>
<ul>
  <li><strong>Compare six different approaches.</strong> Generate Pack Skirmish, Boss Battle, Boss and Minions, The Horde, Elite Team / Mirror Team, and Random alternatives.</li>
  <li><strong>Build exactly the roster you want.</strong> Custom mode combines a searchable monster browser with a live difficulty rating as you add creatures and change quantities.</li>
  <li><strong>Use your campaign's sources.</strong> Choose the permitted source books and keep the creature selection appropriate to your world.</li>
  <li><strong>Move from review to play.</strong> Open the linked Actor sheets, review the roster, and drag its Actor links into the scene.</li>
  <li><strong>Bring published encounters to the table.</strong> Use supported Drakkenheim encounters when the required source content is available.</li>
</ul>
<p>Standard access supports available SRD creatures. Premium opens source selection to installed core and third-party monster books; those books are separate content. Difficulty budgets support your judgment while you account for terrain, tactics, and the party's strengths.</p>
<p>Requires Foundry VTT v14, D&amp;D 5e 5.3 or later, and Morelord Core.</p>
<p>Keep the session moving when the players surprise you. <a href="https://morelordgaming.com">Explore Morelord Encounters and the wider suite.</a></p>
```

## Morelord Craftworks

### One-line hook

Let every hunt, harvest, and hard-won material lead somewhere.

### Micro — launcher, card, or social graphic

Gather, harvest, loot, and craft inside Foundry VTT.

### Foundry package description

A connected gathering, harvesting, loot, materials, recipes, and crafting system for Foundry VTT and D&D 5e. Run acquisitions, browse searchable catalogs, track inventory-backed requirements, and turn recovered materials into persistent crafting projects.

### Website short

Morelord Craftworks connects what characters find to what they can make. Run gathering, harvesting, encounter loot, and hoards; browse materials and recipes; and manage inventory-backed crafting projects inside Foundry VTT.

### Website long

Give the party a reason to care about what the monster leaves behind. Morelord Craftworks connects gathering, harvesting, encounter loot, treasure hoards, materials, recipes, and crafting in one Foundry VTT workflow. Materials live as normal actor inventory Items, while searchable catalogs help players and GMs understand what they have, what they need, and what they can make.

Content Packs let each world enable only the material, recipe, and acquisition content appropriate to its campaign. Recipes can support alternate ingredient paths, tools, proficiency, checks, and multi-session progress. Standard tools cover acquisition, reference, and planning workflows; premium crafting execution consumes materials, records work and checks, tracks persistent progress, and awards the completed output to the chosen inventory. Premium utilities include Spell Scroll, Spellbook, and Potion generators. Crafting work uses two-hour attempts; failed checks spend time without consuming recipe materials.

### YouTube description

Turn gathering, monster harvesting, loot, and crafting into one connected Foundry VTT workflow with Morelord Craftworks. This video explores acquisition sessions, hoards, searchable material and recipe catalogs, inventory-aware requirements, tools and checks, and persistent crafting projects.

Craftworks uses modular Content Packs, so each world can enable the material, recipe, harvesting, gathering, and loot content that fits its campaign. Standard features support acquisition and planning; premium features execute crafting projects and add specialized GM utilities.

**Morelord Gaming:** https://morelordgaming.com

**Requirements:** Foundry VTT v14, D&D 5e 5.3+, Morelord Core, and socketlib.

`#FoundryVTT #DnD5e #Crafting #TTRPG`

### Search title and meta description

**Title:** Morelord Craftworks — Gathering & Crafting for Foundry VTT

**Meta:** Connect gathering, harvesting, loot, materials, recipes, and persistent D&D 5e crafting projects inside Foundry VTT.


### Foundry Description (HTML)

```html
<h3>Turn hard-won materials into the party's next ambition.</h3>
<p>The creature is defeated. The rare ingredient is found. What will the party make of it? Morelord Craftworks connects gathering, harvesting, loot, materials, recipes, and crafting in Foundry VTT, giving the things characters recover a purpose beyond another line in their inventory.</p>
<ul>
  <li><strong>Make discovery rewarding.</strong> Run gathering, monster harvesting, encounter loot, and treasure hoards with character inventory rewards.</li>
  <li><strong>Show players what is possible.</strong> Search materials and recipes, review ingredients and tools, and check the selected inventory against recipe requirements.</li>
  <li><strong>Support the way your party works.</strong> Use a shared Group inventory for materials while a separate character provides crafting skills and tools.</li>
  <li><strong>Finish what you start.</strong> Premium crafting execution tracks work and checks, consumes materials as appropriate, and awards completed outputs.</li>
  <li><strong>Prepare more of the rewards players love.</strong> Premium Potion, Spell Scroll, and Spellbook generators add specialized GM tools.</li>
</ul>
<p>Standard features support acquisition, reference, and planning. Premium adds crafting execution and specialized utilities. Configurable Content Packs let you choose the material and recipe content that belongs in your campaign; some packs also require separately installed source products.</p>
<p>Requires Foundry VTT v14, D&amp;D 5e 5.3 or later, Morelord Core, and socketlib.</p>
<p>Give every harvest a future. <a href="https://morelordgaming.com">Explore Morelord Craftworks.</a></p>
```

## Morelord Core

### One-line hook

One trusted connection for every Morelord module in your world.

### Micro — launcher, card, or dependency listing

Shared accounts, UI, and Location services for Morelord modules.

### Foundry package description

The shared foundation for connected Morelord Foundry VTT modules. Manage account access, shared Locations, consistent application controls, documentation, and support diagnostics from common services.

### Website short

Morelord Core connects a Foundry world to a Morelord Gaming account and provides shared access checks for supported modules. It also provides the shared design system, Location management, actor-participation helpers, in-app documentation services, and sanitized diagnostic exports for support.

### Website long

Morelord Core is the quiet foundation of the Morelord module suite. A GM connects the current Foundry world to a Morelord Gaming account once, and supported modules use that shared connection to determine which Standard and premium features are available.

GMs can review membership, refresh access after an account change, open account management, or disconnect the world from one place. Recently validated access can remain available during temporary network or service interruptions through a limited offline grace period. Existing world data is never deleted when access expires. Privacy-conscious diagnostic exports help support investigate technical issues without account credentials, users, campaign content, network addresses, or world identifiers in the JSON. The download filename includes a sanitized world index.

### Search title and meta description

**Title:** Morelord Core - Shared Services for Foundry VTT

**Meta:** Connect your Foundry VTT world to Morelord Gaming once and manage shared membership access, Locations, documentation, and support diagnostics.


### Foundry Description (HTML)

```html
<h3>Bring your Morelord campaign tools together.</h3>
<p>Spend your attention on the campaign. Morelord Core provides the shared foundation behind connected Morelord modules, bringing account access, familiar controls, documentation, and shared Locations into one suite of services inside Foundry VTT.</p>
<ul>
  <li><strong>Connect the world once.</strong> Link a Morelord Gaming account and let supported modules use that shared connection for feature access.</li>
  <li><strong>Know where your access stands.</strong> Review recognized membership and refresh access after an account change.</li>
  <li><strong>Build a consistent campaign context.</strong> Manage shared Locations, settlement capabilities, and Scene associations for modules that use them.</li>
  <li><strong>Feel at home across the suite.</strong> Shared interface and documentation services give connected tools familiar patterns.</li>
  <li><strong>Get useful support information.</strong> Export sanitized diagnostics to help investigate an issue.</li>
</ul>
<p>Recently validated access can remain usable during temporary connection problems through the supported offline grace period. Expired access does not delete your existing world content.</p>
<p>Core is a shared dependency; install the Morelord gameplay modules that fit your table alongside it. Its manifest declares Foundry VTT 13 as the minimum and 14 as verified, and requires socketlib 1.1.3 or later. Individual modules have their own requirements.</p>
<p>Start with a foundation your campaign can grow around. <a href="https://morelordgaming.com">Find your Morelord tools.</a></p>
```

## Morelord Downtime

### One-line hook

Give the time between adventures a lasting purpose.

### Micro

Plan downtime Sessions and advance persistent character Projects.

### Foundry package description

A persistent downtime and campaign-time workflow for Foundry VTT and D&D 5e. Prepare Sessions, offer permitted activities, allocate character time, and track Projects across the campaign with GM-authoritative updates.

### Website short

Morelord Downtime turns time between adventures into visible opportunities and ongoing Projects. GMs prepare and publish Sessions; players create permitted Projects and allocate time for the characters they own.

### Website long

Keep a character's long-term goals moving between sessions. Morelord Downtime separates the opportunity to spend time from the Project that carries progress forward. GMs prepare, publish, start, and finalize downtime Sessions, while players work within the activities offered to their characters.

Training supports instructors and persistent proficiency progress. Source Item connects to Marketplace wishlists and resolves offers after committed time and gold. Shared Core Locations provide campaign context, and optional integrations connect downtime to the wider suite. An active GM validates player requests.

### Video and search copy

**Video:** See how Morelord Downtime turns a published Session into player choices, time allocations, and persistent Project progress. Demonstrate Training first; show Source Item with Marketplace enabled.

**Title:** Morelord Downtime - Sessions and Projects for Foundry VTT

**Meta:** Organize downtime Sessions, Training, and persistent character Projects in Foundry VTT, with player time allocation and GM-controlled activities.

Downtime is a Premium module, included with Tools Premium and Tools Champion. It has no Standard feature offering.


### Foundry Description (HTML)

```html
<h3>The adventure pauses. Your characters' goals do not.</h3>
<p>Training to master a new skill. Searching for a coveted magic item. Investing time in a goal that takes more than one session. Morelord Downtime gives those ambitions a persistent place in Foundry VTT, connecting the opportunities a GM offers with the Projects characters carry forward.</p>
<ul>
  <li><strong>Offer meaningful downtime.</strong> Prepare, publish, start, and finalize Sessions with activities chosen for the campaign.</li>
  <li><strong>Give players a clear next step.</strong> Players create permitted Projects and allocate time for the characters they own.</li>
  <li><strong>Keep progress between opportunities.</strong> Projects persist across Sessions, so long-term goals do not disappear when available time runs out.</li>
  <li><strong>Make Training part of the story.</strong> Support instructors, ongoing effort, and proficiency progress.</li>
  <li><strong>Turn a wishlist into a lead.</strong> With Marketplace, Source Item lets characters commit time and gold toward finding magic-item offers.</li>
</ul>
<p>Shared Core Locations provide context for available capabilities. An active GM validates player requests, keeping campaign time and Project updates under GM control. Journeys, Craftworks, and Marketplace are optional integrations.</p>
<p>Requires Foundry VTT v14, D&amp;D 5e 5.3 or later, and Morelord Core 0.3.0 or later.</p>
<p>Make the time between adventures count. <a href="https://morelordgaming.com">Explore Morelord Downtime.</a></p>
```

## Morelord Character Export

### One-line hook

Take your character beyond the Foundry character sheet.

### Micro

Export D&D 5e characters to My Characters on Morelord Gaming with a free website account.

### Foundry package description

GMs and players can export D&D 5e characters from supported Foundry VTT v14 sheets and import them into My Characters on the Morelord Gaming website after registering for a free account. Each portable JSON file includes character data, prepared sheet values, and available artwork.

### Website short

Bring your Foundry characters to My Characters on the Morelord Gaming website. GMs and players can choose Morelord Export on a supported D&D 5e character sheet, download the character file, and import it after registering for a free website account.

### Website long

GMs and players can take their D&D 5e characters beyond Foundry with Morelord Character Export. Register for a free account on the Morelord Gaming website, then import your exported character file into My Characters.

Each portable file carries the character's source data and a snapshot of its prepared sheet values. The exporter includes embedded Items, activities, Active Effects, and an image library that avoids storing the same artwork repeatedly.

Use the Morelord Export sheet action or the macro API. Exports record their Foundry and system versions. This is a file export workflow, not live synchronization or a guarantee that every destination can interpret every system field.

### Video and search copy

**Video:** Show GMs and players how to export a D&D 5e character from Foundry v14, register for a free Morelord Gaming account, and import the file into My Characters.

**Title:** Morelord Character Export - Portable D&D 5e Character Files

**Meta:** GMs and players: export D&D 5e characters from Foundry VTT and import them into My Characters on Morelord Gaming with a free website account.


### Foundry Description (HTML)

```html
<h3>Your character has a story beyond the open sheet.</h3>
<p>Bring your Foundry characters to My Characters on the Morelord Gaming website. Morelord Character Export lets GMs and players export D&D characters directly from their character sheets and import them into My Characters after registering for a free website account.</p>
<ul>
  <li><strong>Export from the sheet.</strong> Open any character sheet and choose Morelord Export from its title-bar controls.</li>
  <li><strong>Import into My Characters.</strong> Register for a free account on the Morelord Gaming website, open My Characters, and import your downloaded character JSON file.</li>
  <li><strong>Carry the character's underlying detail.</strong> Include source Actor data, embedded Items, item activities, and Active Effects.</li>
  <li><strong>Preserve the prepared snapshot.</strong> Include display-ready values already calculated by Foundry and D&amp;D 5e.</li>
  <li><strong>Bring available artwork.</strong> Embed character and Item images in a library that avoids storing the same asset repeatedly.</li>
  <li><strong>Keep the source context.</strong> Record the Foundry and system versions with the export.</li>
</ul>
<p>Exports are character snapshots, not live synchronization. Exporting from Foundry does not require Morelord Core or an account connection; importing into My Characters requires a free Morelord Gaming website account.</p>
<p>Requires Foundry VTT v14 and a supported D&amp;D 5e ApplicationV2 character sheet. The manifest records D&amp;D 5e 5.3.3 as verified; legacy ApplicationV1 sheets are not supported.</p>
<p>Take your character's journey beyond the table. <a href="https://morelordgaming.com">Register for a free Morelord Gaming account</a> and import your export into My Characters.</p>
```

## Morelord Compendium

### One-line hook

Keep shared campaign content together.

### Micro

Shared D&D 5e content packs for Foundry VTT.

### Package and website copy

Morelord Compendium organizes shared D&D 5e content in Foundry packs, including actors, items, journals, scenes, macros, playlists, and rollable tables.

**Title:** Morelord Compendium - Shared Foundry VTT Content

**Meta:** Organize shared D&D 5e campaign content in Morelord Foundry compendium packs.

This is a manifest-level description. Its manifest declares Foundry 13 as minimum and verified. The review does not establish v14 support, ownership or redistribution rights for individual assets, a public offer, or an account-access tier. Do not describe it as a new v14 suite release.


### Foundry Description (HTML)

```html
<h3>Keep the building blocks of your campaign close at hand.</h3>
<p>A campaign grows from the people, places, treasures, and moments you bring to the table. Morelord Compendium gathers shared D&amp;D 5e content into Foundry VTT packs, giving you a common place to browse the material available to your world.</p>
<ul>
  <li><strong>Browse by the content you need.</strong> Organized packs include Actors, Items, Journals, Scenes, and Rollable Tables.</li>
  <li><strong>Keep useful session resources together.</strong> The package also includes Macro and Playlist packs.</li>
  <li><strong>Work inside Foundry.</strong> Use familiar compendium browsing to find the available entries.</li>
</ul>
<p>For groups using this shared content collection, it is a practical companion to campaign preparation and play. Check the contents of the installed package for the specific entries available.</p>
<p>The current manifest declares Foundry VTT 13 as its minimum and verified version and identifies D&amp;D 5e as its system. Foundry v14 support is not declared.</p>
<p><a href="https://morelordgaming.com">Discover more campaign tools from Morelord Gaming.</a></p>
```

Editorial status: content-package description draft. Confirm distribution scope before using it as a public listing.

# Channel templates

### Foundry package listing

Use this order:

1. Product category and supported platform/system.
2. Three to five concrete actions.
3. The clearest differentiator.
4. Requirements only when the directory provides no separate dependency field.

Keep the first sentence useful when shown alone. Lead the full HTML description with the table benefit, follow with specific capabilities and clear access distinctions, and close with a direct action. Keep requirements in a separate final paragraph and recheck them before publication. Avoid unverified prices, release claims, and “best” language. Use headings, paragraphs, lists, and links so the copy remains readable without custom CSS. Use bold for short benefit labels only.

### Product page hero

**Eyebrow:** `MORELORD [PRODUCT] FOR FOUNDRY VTT`
**Headline:** use the product's one-line hook.
**Subhead:** use the Website short copy.
**Primary action:** `Get [Product]` or `Install [Product]`
**Secondary action:** `Read the Documentation`
**Proof strip:** three short, verified capabilities rather than adjectives.

### YouTube description template

```text
[Viewer benefit and product name in the first two lines.]

In this video:
00:00 Introduction
[timestamp] [workflow or feature]
[timestamp] [workflow or feature]
[timestamp] [result or next step]

Learn more: [product page URL]
Documentation: [documentation URL]
Install: [Foundry package or manifest URL]
Morelord Gaming: https://morelordgaming.com

Requirements: [current platform, system, and dependencies]

#FoundryVTT #DnD5e #TTRPG #[ProductTopic]
```

Put the promise and product name before the fold. Add timestamps only after the final edit. Use three or four relevant hashtags; do not fill the description with keyword variations.

### Release announcement template

```text
[Product] [version] is now available for Foundry VTT.

[One sentence describing the release's most important player or GM benefit.]

Highlights:
- [Outcome, not internal implementation]
- [Outcome]
- [Outcome]

See everything in the release notes: [URL]
Get [Product]: [URL]
```

### Social post template

```text
[Short table problem or desire?]

[Product] helps you [specific outcome] inside Foundry VTT—without [relevant friction].

[One proof point.] [One direct action.]
[URL]

#FoundryVTT #[Topic] #TTRPG
```

# Suite cross-sell copy

### Marketplace + Craftworks

Craftworks defines the materials characters recover and create. Marketplace gives those items a place in the campaign economy. Together, they connect acquisition, inventory, crafting, buying, and selling.

### Journeys + Encounters

Journeys creates the circumstances of the road; Encounters helps the GM populate its dangers. Use them together to move from travel-day decisions to a scene-ready monster roster without losing the journey's momentum.

### Journeys + Craftworks

Make exploration materially rewarding. Journeys structures the expedition, while Craftworks turns foraging, discoveries, encounters, and recovered materials into inventory and future projects.

### Connected gameplay suite

Organize Sessions and Projects with Downtime. Plan the road with Journeys, populate its dangers with Encounters, recover and craft with Craftworks, and bring the results into the campaign economy with Marketplace—all connected through Morelord Core.

# Copy governance

- Verify supported Foundry and game-system versions before publishing requirements.
- Keep **Standard**, **Premium**, and **Champion** capitalized when they name access levels.
- Never imply that premium expiration deletes actors, items, shops, jobs, or campaign data.
- Describe integrations as optional unless the module manifest marks them as required.
- Do not advertise planned features from a README's future-development section.
- Update this page when a release materially changes the product promise, access tier, dependencies, or primary workflow.
- Channel templates are editorial instructions, not finished public copy. Insert verified destination links and final timestamps before publishing; never publish template fields.
- The reviewed working copies are evidence of local implementation, not proof of public release availability. Confirm release status separately.
- Do not imply Premium includes third-party source books; users need the relevant installed content.
- Character Export has no declared Core dependency. Do not claim every Morelord package requires an account connection.

# Evidence and maintenance

Reviewed September 7, 2026: all eight module manifests; the seven available root READMEs; Core's GM Product Guide, token CSS, shared-service registration, and design-system checker; Craftworks and Marketplace user/GM documentation; Journeys travel documentation; Encounters GM manual; and Downtime's current implementation description.

The module reference PDFs preserve source-document version labels. Some manuals predate the local manifest: for example, Craftworks manuals identify 0.4.4 and Marketplace manuals identify 0.6.0. They are reference snapshots, not newly validated manuals for every current workflow. Use the current README and this inventory to understand newer changes, and refresh manuals as part of the next release.

Known documentation differences resolved for branding: Core's older account-only description omitted shared services; Encounters copy omitted custom and published encounters; the prior guide omitted Downtime and Character Export; the Marketplace README's old family list still mentions Drakkenheim Harvesting and Character Manager. Those historical names do not define the current eight-folder inventory.

Maintain one canonical guide. Update its inventory, requirements, product copy, and access claims together when a release changes them; regenerate the PDF and visually verify every page. The legacy marketing file is a redirect, not a second source of truth.
# Page sections

Section headers must use Downtime's exact structure: `<div class="ml-section-heading"><div><h2>Section title</h2><p>Section subtitle</p></div></div>`. Always provide a descriptive subtitle. Keep both text elements inside the header so Core's divider appears below the complete title/subtitle block, never between them. Do not apply `ml-section-heading` directly to an `h3` or add module-specific typography or divider rules.

Use Morelord Downtime as the reference for initial module page sections. Group each section's heading, help text, and controls inside Core's `ml-surface ml-stack` with `data-gap="3"`. Use `ml-section-heading` inside the surface, and `ml-card` for individual items within it. Section borders, backgrounds, padding, and spacing must come from Core rather than module-specific copies. Encounters applies this pattern to Encounter Settings, Verify Party, and Encounter Source.

# Initial module page headers

Use Morelord Downtime's dashboard as the reference for every initial module page: a `header.ml-hero` containing the product's accent-colored `i.ml-hero__icon`, a `div.ml-hero__body` with an `h1` product title and concise `p` subtitle, and a right-aligned `div.ml-actions` with a book-open **Documentation** button sized to its contents. Use Core's shared hero typography, spacing, and divider; avoid module-specific header overrides. Documentation buttons open the module's registered Core documentation. Place unrelated page actions below the header.

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

For dynamically generated sections, use `ui.createCollapsibleSection({ key, title, description, content })` and initialize after insertion. Core owns its heading, description, chevron, spacing, and persistence. Compact item/quantity lists use `dl.ml-quantity-list` with alternating `dt` and `dd` children inside `ml-card`. Party selection with extra controls uses `ml-card.ml-item-row[data-ml-selectable-card]`, a labeled checkbox and shared actor identity inside `ml-stack`, and a sibling labeled control.


Character selectors must retrieve eligible actors through `ui.participation.listCharacterActors()` or `listCharacterChoices()`. Eligibility includes player-owned characters and members of the primary party Group; preserve the operation’s ownership and inventory checks. Use the shared actor choice component for checkbox selection and Core actor-select initialization for dropdowns.


Checkbox labels keep the checkbox and its description side by side at every width. Checkbox descriptions remain on one line. Let the containing action or item row wrap as a unit rather than splitting its label. Core enforces this for labels containing a checkbox, including checkbox-first and checkbox-last settings rows. Use `ml-check` for new checkbox labels; put descriptive text in a sibling `span`. Actor choice cards retain their shared portrait columns.


Settings pages use the complete `ml-hero` header (icon, body, h1 title, and description), `ml-surface.ml-stack` sections with `ml-section-heading`, and the shared page footer. Use `ml-card.ml-item-row` with a `ml-stack` content child for content-pack entries; status badges use `ml-badge[data-tone]`. Do not style settings headers, cards, rows, or badges in a feature module. The design-system check rejects incomplete settings headers and missing footers.

# Generative AI Content Declaration

Morelord Gaming uses generative AI tools to assist with software development, including code generation, debugging, testing, and documentation. The developer understands the submitted code and can explain, modify, troubleshoot, and maintain it independently of AI tools. Morelord Gaming retains full responsibility for each module's functionality, quality, and ongoing maintenance.

## Foundry policy reference

Checked September 13, 2026 against the [Foundry AI Content Policy](https://foundryvtt.com/article/ai-policy/), revised March 18, 2026. Permitted AI assistance no longer requires disclosure under that policy; use the blurb above if the submission form still requests it.

AI-assisted code is permitted subject to the author's understanding and maintenance responsibilities. Prepared content has separate restrictions. Foundry package descriptions must be human-written; rewrite AI-generated listing drafts yourself before submission. A declaration does not override these requirements. Recheck the linked policy for each submission.
