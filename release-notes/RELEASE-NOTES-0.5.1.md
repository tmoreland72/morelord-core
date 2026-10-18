# Morelord Core 0.5.1

## What Changed

### Improvements

- Action badges can use data-tone="action" for an orange background and white text. Passive badges retain their existing appearance.
- Added the shared monster-card renderer consumed by Encounters and Craftworks, preserving each caller's actions.
- Added opt-in artwork fallback through Core page layout, also used by shared monster portraits.
- Added shared image-link buttons for accessible Craftworks recipe/material navigation, replacing its local output-image control styles.


## Verification

Core's 82 automated tests and the design-system check pass. Shared-runner GM checks and the shared action pills, monster cards, artwork fallback, and reference-image controls passed in Dev1 on Foundry VTT 14.369 / D&D5e 6.0.3. Source matching, native Actor/Item sheet opening, and image navigation were exercised through Craftworks. Release Core before Craftworks 0.4.18 and Encounters 0.2.1. Full consumer workflow coverage is not claimed.
