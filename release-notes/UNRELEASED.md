# Unreleased

## What Changed

### Added

- **Configure Sources** is the primary compendium filter for every Morelord module. `sources.getAllowedPacks({ documentName })`, `sources.getAllowedPack(collection)`, `sources.isSourceAllowed(packOrId)`, and `sources.isUuidAllowed(uuid)` follow dnd5e `CompendiumBrowserSettingsConfig.isSourceEnabled`, calling that method when it is loaded. An explicit `packSourceConfiguration` boolean wins, including every pack turned off by unchecking the System package. Otherwise a pack is allowed only when its `rulesVersion` flag is empty or matches the world rules version. Compendium UUIDs use that pack decision. Other UUIDs stay allowed. Module source lists may only narrow this set. Open lists refresh on `morelordCoreConfigureSourcesChanged`.
