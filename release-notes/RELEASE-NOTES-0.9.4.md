# Morelord core 0.9.4

## What Changed

### Improvements

- Added opt-in enabled/muted badge tones and left-aligned footer status text to the shared components. Encounters, Craftworks, and Downtime now consume these Core styles instead of local overrides; ordinary elements keep their existing styling.

- Added personal Performance Setup for players and GMs: Low, Balanced, and High match Potato Or Not's seven Foundry settings, including Photosensitivity Mode. An optional once-per-browser offer and permanent Open Performance Setup menu preserve later manual tuning. When Dice So Nice is active, the presets hide all 3D dice, show only the user's dice, or show all players' dice respectively.
- Performance Setup includes the standard Documentation header button, linked directly to the Personal Performance guide section and its exact preset settings.

- Added shared editable number steppers and radio selection for cards; kept Core stack, setting-row, and action-bar layout consistent inside Foundry dialogs. Shared Mass Combat now cycles attacks across living targets, including attached saves and limited-target saving activities.

- Added a shared paused-card state with a dashed border, sunken surface, and muted quantities, while preserving selection needed to resume paused workflows. Encounters uses it for wave pause controls.

## Compatibility

- Verified on Foundry VTT 14.370 with D&D5e 6.1.1 in Dev1.
