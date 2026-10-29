# Morelord Core 0.9.0

## What Changed

### Changed

- In Manage Shared Locations, an Instructor capability's Specialty is a dropdown. Any is the default. The choices are the languages, skills, tools, weapons, armor, and weapon masteries that Downtime Training uses. A saved specialty that is not in that list stays in the dropdown. Other capability types hide Specialty and keep a specialty that was already saved. The capability Source label is now Notes. Saved location fields are unchanged.

### Added

- Locations can list that same D&D 2024 training set and map a capability type to its specialty options, so other modules can use the list the Instructor dropdown uses.

## Verification

Node tests cover the training catalog, the capability type to specialty options mapping, preserved free-text specialties, and unchanged specialty and source storage. Live Foundry verification is still outstanding.
