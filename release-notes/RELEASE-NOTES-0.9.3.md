# Morelord Core 0.9.3

## What Changed

### Fixed

- Prevented duplicate reaction statuses when Midi-QOL is active. The duplicate could stop the token HUD from opening and interrupt scene loading.
- Midi-QOL controls the reaction status while it is active. Its **Enforce Reactions** setting controls whether its marker is available. Core retains the saved **Reaction Used** setting for worlds running without Midi-QOL.

## Compatibility

- Verified on Foundry VTT 14.370 with D&D5e 6.0.6.
