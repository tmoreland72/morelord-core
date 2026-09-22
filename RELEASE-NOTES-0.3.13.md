# Morelord Core 0.3.13

Shared tray surface for Game Master.

## What Changed

### Improvements

- Add a shared tray-handle button that uses the same background and transparency as Core control panels.
- Keep panel scrolling and layout unchanged while allowing feature modules to supply accessible open/close chevrons.

## Compatibility and verification

All 66 release-checkout tests pass. Rendered comparison with Foundry and Core styles confirmed identical tab/panel backgrounds and both directional icons. The existing Core design-system check passes. Foundry compatibility remains 14.368; live verification was skipped because TestA is active.
