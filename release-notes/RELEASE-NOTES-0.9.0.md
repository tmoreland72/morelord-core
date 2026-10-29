# Morelord Core 0.9.0

## What Changed

### Changed

- In Manage Shared Locations, an Instructor capability's Specialty is a dropdown. Any is the default. The choices are the languages, skills, tools, weapons, armor, and weapon masteries that Downtime Training uses. A saved specialty that is not in that list stays in the dropdown. Other capability types hide Specialty and keep a specialty that was already saved. The capability Source label is now Notes. Saved location fields are unchanged.

### Added

- Locations can list that same D&D 2024 training set and map a capability type to its specialty options, so other modules can use the list the Instructor dropdown uses.
- `api.locations.activeContext(user)` returns the current place: the active Downtime session's location, On the Road when that session has no location, or the location for the scene that user is viewing. When Downtime is not active, or it has no active session, the viewed scene is used.
- Settings transfer includes Marketplace's Enable Locations setting.
- Workshop capabilities use a Specialty dropdown of the D&D 2024 artisan's tools that do not already match another capability. Smith's Tools stay with Forge and Alchemist's Supplies stay with Alchemist. Any remains the default, and a saved specialty that is not in the list stays available. `api.locations.toolCapabilityType(tool)` and `api.locations.listWorkshopSpecialties()` expose that map. A registered Tavern capability takes Brewer's Supplies and Cook's Utensils.

### Fixed

- Saving a location, or another background refresh, no longer brings a different open Morelord window to the front. The window where the button was clicked stays frontmost. A re-render of a window that is already open does not call `bringToFront` unless that render passes `focus: true`. `api.ui.renderInBackground(application)` is the shared refresh for an open window.

## Verification

Node tests cover the training catalog, the capability type to specialty options mapping, the artisan tool to capability map, preserved free-text specialties, unchanged specialty and source storage, the active location context, Enable Locations in settings transfer, and background re-renders that must not call bringToFront. Live Foundry verification is still outstanding.
