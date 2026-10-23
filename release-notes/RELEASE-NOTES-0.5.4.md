# Morelord Core 0.5.4

## What Changed

### Fixed

- Sidebar multi-select checkboxes are now the leftmost control on every directory row and use Foundry's flat checkbox styling, with a crisp, visible square and a dark checkmark on the orange accent fill. Actor, item, roll table, card, and macro checkboxes sit to the left of the thumbnail instead of splitting the thumbnail and entry name, and playlist checkboxes are the first control in the playlist header.
- Scene directory checkboxes stay in the upper-left corner of each scene card and isolate click and pointer events in capture phase so checking a scene no longer triggers scene activation when another module listens for row clicks.

### Improvements

- Shift-clicking sidebar multi-select checkboxes now selects or clears the visible range across directory rows.
- Packaged a cumulative root CHANGELOG.md inside release archives so in-Foundry changelog viewers (such as Big Bad Module Manager) can display release history directly in-app.

## Verification

All 94 automated Core tests (
pm test), the six-module design-system boundary check (
pm run check:design-system), the release archive check (	est/release-archive.test.ps1), and live Foundry v14 (dev1) in-game verification (unInGameTests) passed across all seven sidebar directory tabs.