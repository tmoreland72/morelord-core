# Morelord Core 0.6.0

## What Changed

### Added

- **Morelord Tools** is a left scene control with a sharp crown icon. It lists tools registered by Morelord modules, stays selected after a tool is clicked, and is hidden when the current user has no visible tools. Modules register tools through `api.tools` from `init`, or with the `morelord-core.registerTools` hook during `setup`.

### Fixed

- The sharp crown icon uses the Sharp webfont Foundry already ships. Core loads `fa-sharp-solid-900.woff2` and points `.fa-sharp.fa-solid` at the Font Awesome 7 Sharp family, so the icon no longer falls back to the classic crown.
