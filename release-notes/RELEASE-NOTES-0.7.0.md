# Morelord Core 0.7.0

## What Changed

### Added

- **Configure Sources** is now the main compendium filter for every Morelord module. Core keeps one shared list of the compendiums you have enabled in the D&D system's Configure Sources setting, and other modules read that list.
- Modules can ask Core whether a compendium is allowed, whether a source is allowed, or whether a compendium item is allowed. Anything from a compendium you turned off is refused.
- Core announces when Configure Sources changes, so open Morelord windows refresh on their own.

### Fixed

- A compendium you did not select in Configure Sources is no longer counted as enabled just because it was never switched off. Core now follows the same rule as the D&D system.
- Core's item picker lists only items from compendiums you have enabled.
