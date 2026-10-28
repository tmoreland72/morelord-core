# Unreleased

## What Changed

### Added

- **Configure Sources** is the primary compendium filter for every Morelord module. `sources.getAllowedPacks({ documentName })`, `sources.isPackAllowed(packOrId)`, `sources.isUuidAllowed(uuid)`, and `sources.filterAllowed(entries)` honor dnd5e 6.0.6 `packSourceConfiguration`. A compendium set to off there is omitted, including every pack turned off by unchecking the System package. Compendium UUIDs and world actors, items, or tokens that reference an excluded pack are rejected. Module source lists may only narrow this set. Open lists refresh on `morelordCoreConfigureSourcesChanged`.
