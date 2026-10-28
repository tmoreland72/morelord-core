# Morelord Core 0.8.0

## What Changed

### Added

- Modules can reorder cards in a list or a grid with `api.sortable.bind`. Dragging shows the whole card under the pointer, dims and outlines the original card, and draws a landing line where the card will drop. The `onReorder` callback receives the new id order when the drop changes it.
- **Select multiple** on the Compendium Packs sidebar, including its pop-out, uses the same checkboxes, **Select visible**, **Clear selection**, and **Done selecting** as the other sidebar directories. **Move selected (N)** places the checked packs in a compendium folder or **Root (no folder)**. **Lock selected (N)** locks the unlocked packs. **Unlock selected (N)** unlocks the locked packs, and asks before unlocking a system or module pack that a package update can overwrite. **Delete selected (N)** deletes the checked world compendiums after confirmation. System and module compendiums, and folders, stay.

## Verification

Node tests cover compendium selection, move, lock, unlock confirmation, and world-only deletion. Live Foundry verification in Dev1 was not run because this environment could not confirm world id `dev1`.
