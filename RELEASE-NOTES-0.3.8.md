# Morelord Core 0.3.8

## What Changed

### Improvements

- Added shared, non-mutating Item rarity readers supporting legacy D&D 5e strings/choice objects and v6 arrays/Sets. Single-rarity workflows use the lowest listed rarity.
- Verified Foundry compatibility is explicitly recorded as 14.367; existing Foundry and system support minimums remain unchanged.
- Release guidelines require checking the latest stable Foundry build and confirming the published Foundry listing.

## Validation

- 45 Core tests pass; shared design-system checks pass across six feature modules. Live Foundry 14.367 / D&D 5e 6.0.1 initialization, rolls, socket routing, and blind-roll privacy checks pass.
- Legacy rarity compatibility is regression-tested; a live pre-v6 world was not available.
