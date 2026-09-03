# Morelord Core 0.3.1

Morelord Core 0.3.1 expands the shared module foundation with reusable skill rolls, product documentation, improved locations, and safer client-local window state.

## Added

- Added shared D&D 5e skill-roll helpers, including configured native rolls, skill modifiers, and natural d20 extraction for feature modules such as Craftworks.
- Added a shared product-documentation registry and responsive documentation viewer.
- Added reusable resource-list, help, stepper, toolbar, toggle, and icon callout components to the Core design system.
- Added the Other location type for strongholds, garrisons, and other non-settlement locations.

## Improved

- Improved Location Manager with searchable multi-Scene selection, selected-Scene ordering, direct location opening, and cleaner location cards.
- Stored window geometry in per-user local storage so player window changes never attempt to update world settings.
- Prevented player clients from refreshing or persisting the GM-authoritative entitlement cache.
