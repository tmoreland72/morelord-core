# Morelord Core 0.3.7

## What Changed

### Improvements

- Added GM-only settings export/import in Core for all enabled Morelord modules. Missing modules and unknown settings are skipped; campaign records and account credentials are excluded.

- Fixed shared multi-select controls collapsing to one row and hiding saved selections when unfocused, including Associated Scenes in Manage Locations.

- Shared settings rows now own responsive label/control layout. Settings template checks require a complete Core hero and footer.

- The Core settings Troubleshooting button downloads diagnostics directly. The Troubleshooting section is removed from Connect or Manage Account.

- Shared Locations uses standard Delete and Remove Capability buttons, including Core’s shared icon button component.

- Checkbox descriptions stay beside their controls at narrow widths, including existing settings labels; wrapped text remains in its own column.

- Core account settings, Ignored Users, and the Location editor use the shared page footer. Save actions remain outside the scrolling content, with native form submission preserved.

- Character eligibility is centralized in `MorelordCore.ui.participation.listCharacterActors()` and `listCharacterChoices()`: player-owned characters plus character members of the primary party Group, deduplicated. Party members may be Actor documents or stored Actor references. `ownedOnly` further limits the result to characters the current user owns. Modules should use these helpers for character selection and retain their operation-specific permissions.

- Added shared collapsible sections with native keyboard controls and remembered state per browser, world, and user. Journey Steps is the first consumer.

- Added a DOM builder for shared collapsible sections and a compact two-column quantity list. Journeys uses these for all creation sections and supply cards.

- Added shared source-pack labels that distinguish adventure folders and compendium types.
- Release archive validation accepts required runtime files and preserves numbered LevelDB pack logs.

## Validation

- All 44 module tests pass; Core's design-system check passes across six feature modules.
- Live Foundry visual and multiplayer verification was not performed.
