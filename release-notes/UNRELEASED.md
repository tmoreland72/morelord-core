# Unreleased

## What Changed

### Fixed

- Sidebar multi-select keeps a compact-directory portrait beside the checkbox. When a directory style absolutely positions `.thumbnail`, the portrait shifts to the right of `.ml-core-directory-check`. A name placed directly after the checkbox, such as a journal row, no longer keeps the extra compact left padding.

### Added

- **Move selected (N)** in the sidebar multi-select toolbar moves the checked world documents into a chosen folder or **Root (no folder)**. **Cancel** leaves them where they are. The move uses Foundry's document update API and reports the destination in an info notification.

## Verification

Node coverage is in `test/directory-selection.test.js`. The in-game check `directorySelectionCheck` moves its own Macro and RollTable fixtures into a temporary folder and back to root, then deletes only those fixtures and temporary folders. Live Dev1 verification of this change is still outstanding.
