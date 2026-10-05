# Morelord Core 0.3.14

Reporting preferences and shared UI readability.

## What Changed

### Improvements

- Show a one-time reporting notice to GMs in new and existing worlds, with feature usage and error sharing preselected while preserving previous opt-outs. Saving dismisses the notice; closing retries next session.
- Keep reporting preferences out of settings transfers and document the settings path, pseudonymous data, and retention.
- Use normal-weight body prose and Foundry theme surfaces for readable light/dark windows, footers, and select options. Preserve the shared roll-request, compendium, and tray services shipped in 0.3.11–0.3.13.

## Compatibility and verification

67 automated tests passed. Core design-system checks passed. Foundry 14.368 remains the latest stable release and the verified build; supported minimum/maximum bounds are unchanged. Existing Dev1 regression records cover the previously implemented workflows on Foundry 14.368 / D&D5e 6.0.3. No new in-Foundry testing was run for this release at the user’s request.
The shared theme-surface adjustment is checked with installed Foundry/Core styles in an isolated browser; live confirmation remains outstanding.
