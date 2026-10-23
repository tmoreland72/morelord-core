# Morelord Core 0.5.2

## What Changed

### Improvements

- Added the shared stacked-right number stepper option: increment above decrement on the right of its number input. Existing horizontal steppers retain their layout.
- Labels containing shared steppers inherit the same uppercase muted field styling and spacing as direct-input labels.
- Documented the shared markup and native stepUp/stepDown interaction contract for consuming modules.

## Verification

All 82 Core tests and the six-module design-system boundary check passed. Game Master's repeatable shared-runner regression passed in Dev1 on Foundry 14.369 / D&D5e 6.0.6, checking actual stepper placement, increment/decrement, the zero floor, and computed field-label typography/color. Dark/light 1280px/700px layouts and effective 200% zoom passed. Journey's existing labeled horizontal stepper receives the shared label styling; Encounters' unlabeled quantity stepper retains its existing layout. Full Journeys/Encounters workflows were not rerun for these CSS-only additions. Game Master 0.1.13 requires this version.