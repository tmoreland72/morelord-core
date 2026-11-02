# Morelord Core 0.9.0

## What Changed

### Added

- `MorelordCore.deleriumSearch` is the shared Delerium Search API, and it is the same object as `game.modules.get("morelord-core").api.deleriumSearch`. The caller keeps the session. `available()` is true when a supported content module for this search is active. Zones are Outer City (DC 15) and Inner City (DC 20). Skills are Arcana, Investigation, and Survival. Three successes award a Delerium Chip (`3d6`), four add a Delerium Fragment (`1d6`), and five or more also add a Delerium Shard (`1`). Two or more failures mark a random encounter and still keep any rewards. `openResults` opens **Delerium Search Results**, with **Roll & Award All Delerium** and **Open Morelord Encounters**.
- Shared buttons and quantity controls can say why they are disabled. `templates/components/ml-button.hbs` and `templates/components/quantity-controls.hbs` take an optional `disabledReason`. When it is set, the control renders `disabled`, `aria-disabled="true"`, and a `data-tooltip`: a bold title, then one short line for each following line of the reason. Leave it unset and the markup matches the previous output.
- `ui.setDisabled(element, reason)` is on `game.modules.get("morelord-core").api` and `MorelordCore`. A string disables the element and sets that tooltip. `null`, `""`, or a blank reason enables the element and removes the tooltip and `aria-disabled`. Repeating either call leaves the element as it already is.

## Verification

Node tests in `test/delerium-search.test.mjs` cover availability, zones and skills, scoring, cumulative rewards, a random encounter that still keeps those rewards, and **Delerium Search Results**. Node tests in `test/disabled-reason.test.mjs` cover the button and quantity-control markup with and without a reason, and `setDisabled` toggling. `npm run check:design-system` passes. Live Foundry verification is still outstanding.
