# Morelord Core 0.4.3

## What Changed

### Added

- GM sidebar multiselect and confirmed bulk deletion for Scenes, Actors, Items, Journals, Rollable Tables, Cards, Macros, and Playlists, including pop-outs. Shared Core toolbar and checkbox components support individual selection, Select visible, Clear selection, and Done selecting. Folders are preserved; no account or premium access is required.
- Token Distance Indicator, enabled by default per user. Players hover from their selected owned token or unique assigned-character token; GMs select one token first. Uses nearest occupied spaces, native grid rules, and scene units; adjacent tokens show 5 and distances round up in 5-unit intervals across token sizes. Disable it in Core settings when using another hover-distance module.

## Verification

74 module automated tests passed, including the token-distance cases. Core's design-system boundary check passed for six feature modules. In-Foundry Dev1 tests were skipped for this release by Troy's explicit approval, because Foundry was not running. Compatibility remains the previously verified Foundry VTT 14.368. Existing support bounds are unchanged.
