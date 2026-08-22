# Morelord Product UI Brand Guide

This is the authoritative visual and implementation contract for Morelord Core, Marketplace, Journeys, Craftworks, Encounters, and future Morelord Foundry modules.

## Brand principle

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

Feature modules own:

- Domain-specific layout and data presentation
- Marketplace tables, cart, prices, and shop workflows
- Journeys phases, supplies, routes, roles, and expedition workflow
- Craftworks recipes, materials, harvest, crafting, and generators
- Encounters party, source, monster, and encounter-result layouts
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
- Content reserves no fake transparent overlay space.

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
- Content-sized buttons must use `height: auto`, `max-height: none`, and normal wrapping when labels can wrap or be localized.

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

Do not introduce `mlm-*`, `mjourneys-*`, `mcw-*`, `mlh-*`, `morelord-encounter-*`, or generic cross-module feature names. Apply the same readable convention to data attributes and JavaScript `dataset` properties.

Preserve module IDs, stored setting keys, flags, pack IDs, and public API identifiers unless a separate data migration is explicitly planned.

## Settings

Each module exposes exactly one Configure application. All user-facing settings live inside it. Individual `game.settings.register` entries use `config: false`, preserving their existing keys and stored values.

## Accessibility

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

1. Run `npm run check:design-system` in Morelord Core.
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
