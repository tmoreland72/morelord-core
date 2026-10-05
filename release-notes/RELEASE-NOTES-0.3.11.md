# Morelord Core 0.3.11

Shared services required by Game Master and the current roll workflows.

## What Changed

### Improvements

- Add reusable chat roll requests, grouped participant cards, GM fallback, and immediate Completed feedback while maintaining player permissions and private outcome ownership.
- Add shared dice-animation waiting and serialized outcome commits for Game Master, Craftworks, and Journeys.
- Add shared compendium organization and display labels, preserving pack identities and manual organization after migration.
- Add hotbar-sized macro buttons and preserve tray/window scroll positions during redraws.

## Compatibility and verification

Foundry 14.368 / D&D5e 6.0.3: Dev1 live trigger, surge, selected-token Fate, compendium loading, and roll-completion checks passed using these shared services. Existing supported Foundry bounds remain unchanged. Node and shared design-system validation run before publishing. Separate player-client visibility, light theme and 200% zoom checks for Game Master remain outstanding.
