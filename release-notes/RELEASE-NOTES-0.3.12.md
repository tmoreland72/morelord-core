# Morelord Core 0.3.12

Fix saved-roll results failing to display after the Core 0.3.11 update.

## What Changed

### Fixes

- Expose runSerialized through Core’s public socket API so Game Master, Craftworks, and Journeys can finish saved-roll outcomes after dice animations.
- Add a regression that exercises the public socket facade from the actual entry point, rather than only the internal socket service.

## Compatibility and verification

The regression reproduced the missing export in 0.3.11 and passes with the fix. Foundry compatibility remains 14.368. Run publicSocketCheck from scripts/testing/public-socket.js through Core’s shared runner in Dev1. All 66 automated tests in the release checkout pass. Live verification was skipped because the active world is TestA; no world was switched.
