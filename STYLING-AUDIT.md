# Morelord UI styling audit

The durable rules derived from this audit live in [MORELORD-BRAND-GUIDE.md](./MORELORD-BRAND-GUIDE.md). Future UI changes should treat that guide as the authoritative product contract.

Audited 2026-08-21 across:

- `morelord-core`
- `morelord-marketplace`
- `morelord-journeys`
- `morelord-craftworks`
- `morelord-encounters`

## Executive summary

The modules already share a recognizable visual language: compact Foundry-native windows, muted translucent panels, warm-gold accents, 32–36 px controls, rounded cards, uppercase eyebrow labels, and icon-led headings. The inconsistency is architectural rather than conceptual. Each module independently expresses that language with its own prefix, values, layout rules, and component markup.

`morelord-core` is required by every feature module and is therefore the correct owner for design tokens and generic UI primitives. It currently provides only the account-window styles, so repeated components have drifted into feature stylesheets.

Recommended direction:

1. Put opt-in design tokens and generic `ml-*` primitives in `morelord-core`.
2. Keep feature layouts and domain-specific visuals in their modules using readable namespaces (`ml-marketplace-*`, `ml-journeys-*`, `ml-craftworks-*`, and `ml-encounters-*`).
3. Migrate duplicated components progressively; do not perform a flag-day selector rename.
4. Make every Morelord ApplicationV2 window opt in with an `ml-window` class and every template root with `ml-app`.

## Inventory and risk

| Module | Stylesheet shape | Approximate size | Main concern |
| --- | --- | ---: | --- |
| Core | One stylesheet | 23 lines | Shared dependency has no shared design system |
| Marketplace | One stylesheet | 1,913 lines | Monolith, repeated settings/premium UI, many literal translucent colors |
| Journeys | Entry file plus 11 focused files | 378 effective lines | Best file organization, but duplicates Craftworks shell/dashboard ideas |
| Craftworks | One stylesheet | 5,700 lines | Highest regression risk; 31 media queries, 54 `!important` declarations, several generations of component styling |
| Encounters | One stylesheet | 505 lines | Mixes `morelord-*` and copied `mcw-*` contracts; no responsive rules |

The raw size is not itself a defect. The important signal is that Core defines no custom properties while the feature modules collectively contain hundreds of literal pixel/color values. Craftworks alone contains roughly 1,314 pixel values, 174 literal hex/RGB colors, and only eight locally declared custom properties.

## Findings

### P0 — Cross-module ownership is inverted

All feature manifests require `morelord-core`, but generic shell, panel, header, status, action, and settings styles live in feature modules. This makes visual consistency dependent on copy/paste and prevents a single compatibility layer for Foundry theme variables.

Core should own the stable presentation contracts, including all global font families, type sizes, weights, line heights, text colors, muted text, heading treatment, and other typography rules used across Morelord modules. It should not own feature-specific grids, monster stat blocks, marketplace tables, journey phase logic, or harvest workflows.

### P0 — Encounters leaks the Craftworks namespace

`morelord-encounters/templates/encounter-settings.hbs` uses `mcw`, `mcw-header`, `mcw-settings-*`, `mcw-premium-access`, `mcw-setting-card`, and `mcw-content-pack-*`. Encounters then copies a subset of those rules into its own stylesheet under `.morelord-encounters`.

This is the strongest immediate migration candidate. The markup is semantically shared settings UI and should use neutral `ml-*` components. A module must never depend on another feature module's CSS prefix unless that dependency is explicit and intentional.

### P1 — Premium access is triplicated

The same three-column crown/copy/actions banner exists in:

- Marketplace: `mlm-premium-access` around stylesheet line 1071
- Craftworks: `mcw-premium-access` around stylesheet line 2772
- Encounters: copied `mcw-premium-access` around stylesheet line 431

The border, gradient, icon circle, locked state, copy, and action stack are nearly identical. This should become one `ml-access-card` component with a `data-state="locked"` state and optional `ml-access-card__icon`, `__body`, and `__actions` elements.

### P1 — Core account UI does not use the suite's newer language

Core uses hard-coded `#d49a24`, `#4f9f55`, `#b3261e`, and an unscoped `.danger` descendant, while newer modules mostly defer to Foundry semantic variables with fallbacks. The account view should be the reference implementation of the shared system, not a visual outlier.

### P1 — Shared components exist under four vocabularies

The following concepts recur with different names and subtly different geometry:

| Concept | Current examples | Canonical component |
| --- | --- | --- |
| Application shell | `mlm-shell`, `mjourneys app-shell`, `mcw app-shell` | `ml-app` |
| Hero/header | `mlm-brand-row`, `mjourneys-dashboard-hero`, `mcw-dashboard-hero`, `mlc-header` | `ml-hero` |
| Surface/card | `mlm-shopper-card`, `mjourneys-panel`, `mcw-panel`, `mlc-card` | `ml-surface` |
| Settings section | `mlm-settings-section`, `mcw-settings-section` | `ml-settings-section` |
| Premium/access banner | three copies noted above | `ml-access-card` |
| Status text | `mlc-status`, `mlm-status-*`, `mcw-success/failure`, journey state classes | `ml-status` with `data-tone` |
| Badge/pill | `mlm-tab-count`, `mlm-wishlist-status`, `mcw-pills`, content-pack status | `ml-badge` |
| Icon button | `mlm-actions button`, `mcw-icon-button`, journey icon button, encounter preview buttons | `ml-icon-button` |
| Empty state | `mlm-empty-results`, `mlm-cart-empty`, `mcw-browser-empty-state`, settings-empty | `ml-empty-state` |
| Toolbar/actions | `mlm-actions`, `mcw-actions`, journey action areas | `ml-actions` / `ml-toolbar` |
| Selectable portrait card | journey traveler, Craftworks character picker, encounter party/source card | `ml-choice-card` |
| Progress | journey progress, Craftworks progress cards/status | `ml-progress` |

### P1 — Accessibility behavior is not centralized

Focus treatment is sparse relative to the number of interactive controls. Icon-only buttons often rely on `title`, and selected controls are represented by visual classes or `:has(input:checked)` without one consistent ARIA contract. Reduced-motion and forced-colors behavior are not defined centrally.

The shared layer should provide `:focus-visible`, disabled, busy, selected, and reduced-motion behavior. Templates should still provide semantic labels (`aria-label`) because CSS cannot supply accessible names.

### P2 — Responsive behavior differs by module

Marketplace has five media queries, Craftworks has 31, Journeys has one compact breakpoint, and Encounters has none. Comparable two-column choice/card grids therefore collapse at different widths or not at all.

Use component-level breakpoints for shared primitives. Feature-level breakpoints remain local when driven by domain content.

### P2 — Theme fallback values drift

Warm accents include `#d49a24`, `#e2a82e`, `#c5a05b`, `#b99452`, `#f0a33a`, and related variants. Success/error colors and surface alpha values likewise vary. Some variation is intentional, but most is acting as an undocumented token system.

Core should map Foundry variables into Morelord semantic tokens once, with fallbacks. Feature styles should consume the semantic token rather than restating a fallback.

### P2 — Stylesheet organization varies widely

Journeys has the healthiest source layout: a stable entry stylesheet imports focused files. Marketplace and especially Craftworks are monoliths. Splitting source files while retaining one manifest entry makes ownership clearer without changing load order.

## Proposed global CSS contract

All rules are opt-in. Core should not style bare `button`, `label`, `table`, or heading elements globally.

### Tokens

Define tokens on `.ml-app` (and optionally `.ml-chat-card`) rather than `:root` to avoid affecting unrelated Foundry modules.

```css
.ml-app,
.ml-chat-card {
  --ml-color-accent: var(--color-warm-1, #d6a34a);
  --ml-color-accent-strong: var(--color-warm-2, #b98227);
  --ml-color-success: var(--color-level-success, #4f9f68);
  --ml-color-warning: var(--color-level-warning, #c98b20);
  --ml-color-danger: var(--color-level-error, #b94b4b);
  --ml-color-border: var(--color-border-light-2, var(--color-border-light-primary));
  --ml-color-surface: color-mix(in srgb, var(--color-cool-5, #23212a) 8%, transparent);
  --ml-color-surface-raised: rgb(255 255 255 / 6%);
  --ml-color-surface-sunken: rgb(0 0 0 / 14%);
  --ml-color-muted: var(--color-text-subtle, var(--color-text-dark-secondary));

  --ml-space-1: 4px;
  --ml-space-2: 8px;
  --ml-space-3: 12px;
  --ml-space-4: 16px;
  --ml-space-5: 24px;
  --ml-radius-sm: 4px;
  --ml-radius-md: 6px;
  --ml-radius-lg: 8px;
  --ml-control-height: 34px;
  --ml-avatar-sm: 32px;
  --ml-avatar-md: 48px;
}
```

Do not encode module identity as a different accent by default. If a product needs an accent, override `--ml-color-accent` on that application's root.

### Primitive selectors

- `ml-app`: scroll-safe ApplicationV2 content root and token scope
- `ml-stack`: vertical layout; spacing selected with `data-gap="1|2|3|4"`
- `ml-cluster`: wrapping horizontal alignment
- `ml-grid`: responsive grid; `data-columns="2|3|auto"`
- `ml-surface`: border/radius/surface; variants `data-depth="flat|raised|sunken"`
- `ml-hero`: title/copy/actions composition
- `ml-toolbar`: controls and result metadata
- `ml-actions`: end-aligned action group
- `ml-icon-button`: square icon-only control using the shared control height
- `ml-badge`: compact inline label with `data-tone`
- `ml-status`: icon/text status with `data-tone="neutral|success|warning|danger|premium"`
- `ml-empty-state`: centered icon/title/help composition
- `ml-choice-card`: selectable card; state represented with `aria-checked` or a contained native input
- `ml-settings-section`: settings heading/body grouping
- `ml-access-card`: account/entitlement banner with `data-state="active|locked|loading"`
- `ml-progress`: track/fill plus accessible value attributes in markup

### Naming and state rules

- Shared classes use `ml-*`.
- Feature classes use human-readable namespaces: `ml-core-*`, `ml-marketplace-*`, `ml-journeys-*`, `ml-craftworks-*`, and `ml-encounters-*`.
- Existing abbreviated selectors remain only as temporary migration aliases; no new `mlc-*`, `mlm-*`, `mjourneys-*`, or `mcw-*` selectors should be introduced.
- Use `data-tone` and `data-state` for finite visual states; reserve `.is-*` for transitional compatibility aliases.
- Avoid generic descendants such as `.danger`; use `.ml-button[data-tone="danger"]` or a Foundry-supported button attribute.
- Shared CSS never depends on a feature prefix.
- Feature CSS may enhance a shared component only beneath its own application root.

## Shared template components

Start with Handlebars partials only where markup is truly repeated. Keep primitives such as stack/grid/surface as classes, not partials.

Recommended Core partials:

1. `templates/components/access-card.hbs`
   - Crown/status icon, account state copy, actions slot/data
   - First consumers: Core, Marketplace settings, Craftworks settings, Encounters settings
2. `templates/components/empty-state.hbs`
   - Icon, title, description, optional action
   - First consumers: Marketplace results/cart, Craftworks browsers/settings, Journeys no-party states
3. `templates/components/status-badge.hbs`
   - Text/icon/tone only; no domain status logic
4. `templates/components/app-hero.hbs`
   - Use only after confirming titles/actions can share a stable data contract

Foundry partial registration should happen during Core `init`, and the Core API should expose the registered paths/contract version. Components must accept already-localized display strings; Core should not own feature copy.

## Ownership by module after migration

### Core

- Tokens, focus/disabled behavior, common spacing and surface primitives
- Global typography and text styling for every opted-in Morelord application, including font families, scale, weight, line height, heading treatment, semantic text colors, and muted text
- Generic badges, statuses, access card, empty state, choice card, progress, icon button
- Shared partial registration and a `designSystemVersion` API field
- Core account screen as the reference implementation

### Marketplace

- Shop identity, tabs, faceted filters, item tables, cart, price/currency layouts, transaction chat cards

### Journeys

- Phase track semantics, expedition/party/supply/role/foraging layouts
- Retain the current multi-file CSS entry pattern

### Craftworks

- Recipe/material browsers, crafting/harvest workflows, generators, content-specific result layouts
- Split the monolith by feature while preserving `styles/craftworks.css` as the manifest entry

### Encounters

- Encounter option, monster stat/roster, source selection, encounter-specific dialogs
- Remove all `mcw-*` selectors after shared settings migration

## Migration plan

### Phase 1 — Foundation in Core

1. Add `styles/morelord-tokens.css`, `morelord-primitives.css`, and `morelord-components.css`.
2. Import them from the existing Core stylesheet so dependent modules receive one stable entry point.
3. Add `ml-window` to Core ApplicationV2 classes and `ml-app` to its root template.
4. Migrate Core account cards/status/actions and add compatibility aliases for `mlc-*` during one release.
5. Add visual fixtures or a developer-only gallery covering light/dark Foundry themes, narrow widths, keyboard focus, disabled, locked, empty, and loading states.

Implementation status: started in Core. The stylesheet layers, typography tokens, shared primitives/components, Core account migration, API contract version, and initial development fixture are present. Full in-Foundry visual verification remains before Phase 1 is considered complete.

### Phase 2 — High-value duplication

1. Migrate premium/access cards in Marketplace, Craftworks, and Encounters.
2. Migrate settings sections/cards and content-pack badges.
3. Replace Encounters' `mcw-*` markup with neutral `ml-*` classes.
4. Migrate icon buttons, status badges, and empty states across modules.

Implementation status: complete for the initial high-value slice. Marketplace, Craftworks, and Encounters settings consume Core's access card; shared settings surfaces, badges, empty states, and representative icon buttons are adopted across the modules; and Encounters no longer borrows the Craftworks namespace. Remaining legacy components can migrate feature-by-feature without reintroducing duplicate shared contracts.

### Phase 3 — Layout primitives

1. Adopt shared shell/hero/toolbar/action patterns in new code first.
2. Migrate selectable actor/source/traveler cards to `ml-choice-card` while keeping domain sub-elements local.
3. Normalize shared responsive collapse points and focus treatment.

Implementation status: complete for the initial structural migration. Core now supplies the shared application shell; Marketplace adopts the shared hero and action layouts; Journeys adopts shared heroes, responsive traveler choice cards, and accessible progress; Craftworks adopts shared shells and dashboard hero; and Encounters adopts responsive party/source choice grids plus shared icon-button behavior. Readable feature selectors are authoritative on migrated choice components, with legacy selectors retained as compatibility aliases.

### Phase 4 — Source cleanup

1. Split Marketplace and Craftworks monoliths into token-free feature files imported by their current entry files.
2. Remove compatibility aliases after all supported module versions consume the shared classes.
3. Add a release check that rejects new feature-owned definitions of protected shared selectors/tokens.

Implementation status: cleanup complete. Marketplace and Craftworks retain their manifest-facing stylesheet names as stable import-only entry points. Marketplace feature CSS is divided into catalog/settings and shop/transaction sources; Craftworks CSS is divided into foundation/browser/settings and extended workflow sources. Core, Journeys, and Encounters have removed completed migration aliases. All abbreviated namespaces have been replaced by readable `ml-marketplace-*`, `ml-journeys-*`, `ml-craftworks-*`, `ml-craftworks-harvest-*`, and `ml-encounters-*` names across CSS, templates, and JavaScript. Core's release check rejects both feature-owned shared selectors and any reintroduced abbreviated namespace.

## Verification checklist

For each migrated window:

- Compare at minimum widths and at the normal configured width.
- Test Foundry's light and dark themes when available.
- Navigate every control by keyboard and confirm a visible focus indicator.
- Verify icon-only buttons have accessible names.
- Verify 200% zoom without clipped actions or unreachable scroll regions.
- Confirm sticky headers/footers do not cover focused controls.
- Confirm loading, disabled, locked, empty, success, warning, and error states.
- Confirm the window remains usable when another Morelord feature module is disabled.

## Configuration ownership

Each module exposes one Foundry module-settings Configure button. All user-facing world settings belong inside that module's custom configuration application; individual `game.settings.register` entries remain `config: false` so Foundry does not render a second, inconsistent settings form. Marketplace and Journeys now follow the same contract as Craftworks and Encounters while retaining their existing setting keys and stored world values.

## Semantic color ownership

Core owns the meaning of operational colors through `--ml-color-accent`, `--ml-color-success`, `--ml-color-info`, `--ml-color-warning`, `--ml-color-danger`, and `--ml-color-muted`. Feature modules use these tokens for availability, readiness, active processing, warnings, failures, premium/access emphasis, and disabled or secondary text.

Feature-owned palettes remain appropriate when color communicates domain identity rather than application state. Examples include Craftworks' harvest gold and Delerium treatment, Marketplace shop presentation, and encounter artwork. Those colors must not be reused as substitutes for semantic status colors.

Implementation status: Marketplace availability, wishlist, premium, warning, and danger states; Journeys orchestration and foraging states; Craftworks requirements, readiness, crafting progress, and ready/active/missing states; and Encounters accent treatments now consume Core tokens. Core also provides display-neutral semantic text tones and compact/full empty-state primitives.

## Suggested first implementation slice

The safest useful slice is Core tokens plus `ml-surface`, `ml-status`, `ml-badge`, `ml-icon-button`, `ml-settings-section`, and `ml-access-card`, followed by migration of the four account/access screens. This removes the clearest duplication, establishes the naming contract, and avoids touching high-complexity marketplace tables or Craftworks workflow screens until the foundation is visually proven.

## Final implementation status

The code-level standardization is complete. Core owns the shared typography, semantic colors, tokens, primitives, chat-card text contract, settings layouts, and reusable components. Every Morelord application/dialog opts into the shared token scope; feature namespaces are readable; all five modules use a single Configure application for user-facing settings; and feature-specific styling is isolated behind stable stylesheet entry points.

Core's release check enforces protected component ownership, readable namespaces (including JavaScript dataset properties), shared application/dialog and chat-card roots, accessible icon-only template buttons, and Configure-application ownership of feature settings. The namespace migration is deterministic and idempotent.

Only interactive visual acceptance remains: review the supplied fixtures and real module windows inside Foundry at narrow/normal widths, light/dark themes, keyboard navigation, and 200% zoom. This is runtime QA rather than unfinished standardization code.
