# Unreleased

## 0.9.0

### Added

- Shared buttons and quantity controls can say why they are disabled. `templates/components/ml-button.hbs` and `templates/components/quantity-controls.hbs` take an optional `disabledReason`. When it is set, the control renders `disabled`, `aria-disabled="true"`, and a `data-tooltip`: a bold title, then one short line for each following line of the reason. Leave it unset and the markup matches the previous output.
- `ui.setDisabled(element, reason)` is on `game.modules.get("morelord-core").api` and `MorelordCore`. A string disables the element and sets that tooltip. `null`, `""`, or a blank reason enables the element and removes the tooltip and `aria-disabled`. Repeating either call leaves the element as it already is.

## Verification

Node tests in `test/disabled-reason.test.mjs` cover the button and quantity-control markup with and without a reason, and `setDisabled` toggling. `npm run check:design-system` passes. Live Foundry verification is still outstanding.
