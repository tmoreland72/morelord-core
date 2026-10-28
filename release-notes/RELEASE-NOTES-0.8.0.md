# Morelord Core 0.8.0

## What Changed

### Added

- Modules can reorder cards in a list or a grid with `api.sortable.bind`. Dragging shows the whole card under the pointer, dims and outlines the original card, and draws a landing line where the card will drop. The `onReorder` callback receives the new id order when the drop changes it.
