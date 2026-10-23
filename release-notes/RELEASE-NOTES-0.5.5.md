# Morelord Core 0.5.5

## What Changed

### Added

- **Move selected (N)** in the sidebar multi-select toolbar moves the checked world documents into a chosen folder or **Root (no folder)**. **Cancel** leaves them where they are. The move uses Foundry's document update API and reports the destination in an info notification.

### Fixed

- Sidebar multi-select keeps a compact-directory portrait beside the checkbox. When a directory style absolutely positions `.thumbnail` (such as Plutonium's Compact Directory), the portrait shifts to the right of `.ml-core-directory-check`, and an entry name placed directly after the checkbox (such as a journal row) no longer keeps extra compact left padding.

## Verification

All 98 automated Core tests (`npm test`), the six-module design-system boundary check (`npm run check:design-system`), the release archive check (`test/release-archive.test.ps1`), and live Foundry v14 (`dev1`) in-game verification (`runInGameTests`) passed across all eight sidebar directory tabs.