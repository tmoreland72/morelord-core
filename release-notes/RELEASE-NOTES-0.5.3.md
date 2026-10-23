# Morelord Core 0.5.3

## What Changed

### Added

- Added a **Reaction** token status (`reaction`) with a lightning-bolt icon (`assets/icons/reaction-used.svg`) and a **Reaction Used** world setting (`reactionTracker`, enabled by default) that marks tokens when a creature in a started combat uses a D&D 5e reaction activity and clears the mark on the incoming turn, across shared Encounters mob turns, and when combat ends.

### Improvements

- The pending Morelord Account connection window now displays the activation code in large type with a **Copy** button and an **Open approval page** link in case the browser blocks the popup.
- Updated pending connection instructions to explain that the code should already be filled in on the approval page and can be pasted if needed.

## Verification

All 90 automated Core tests (`npm test`), the six-module design-system boundary check (`npm run check:design-system`), and the release archive check (`test/release-archive.test.ps1`) passed, covering the **Reaction** token status registration, reaction activity marking, active-GM turn/mob/combat-end clearing, and the pending connection window activation code display, clipboard copy fallback, and approval page link.
