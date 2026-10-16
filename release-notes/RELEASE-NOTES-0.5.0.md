# Morelord Core 0.5.0

## What Changed

### Added

- Shared Mass Combat activity profiles, group attack and saving throw resolution, and creature placement services support Encounters' new Mass Combat alpha. Existing Game Master integration retains its namespace and selection behavior.
- Shared compact choice groups provide responsive native encounter-type controls using Core's UI components.

### Improvements

- Group attack results summarize hits, kills, damage and attached on-hit saves. Native activity choices include critical damage, typed defenses, temporary HP, zero-damage saves and directly named or linked repeated-weapon Multiattack counts.
- Attack previews are bound to native combat identity; stale previews clear safely, and pending results can be reviewed, applied or discarded.

## Verification

Core's 80 automated tests and design-system check passed. Encounters' 103 and Game Master's 50 automated tests passed. Dev1 regressions on Foundry VTT 14.368 / D&D5e 6.0.3 passed the nine-check Mass Combat suite and the five-check combined-attack suite. Shared services and Core components serve Encounters and Game Master.

The latest official Foundry stable release was checked: 14.369. Troy explicitly authorized a release-specific exception to testing on that build because it is unavailable in the current test installation. Compatibility remains verified 14.368; supported bounds are unchanged. No claim of verification on 14.369 is made.
