# Morelord Core 0.1.3

Adds a privacy-conscious troubleshooting report that makes user environment and compatibility issues easier to diagnose.

## Added

- Added a GM-facing diagnostics download with Foundry, game system, active module, browser, display, and graphics details.
- Added reusable `getDiagnostics()` and `exportDiagnostics()` methods to the Morelord Core API.
- Added the sanitized world index to diagnostic filenames so reports from different worlds remain distinct.

## Changed

- Marked Morelord Core as verified for Foundry VTT 14 while retaining Foundry VTT 13 as the minimum supported version.
- Standardized the release workflow and website release metadata configuration.

## Security

- Diagnostic contents exclude account credentials, installation and world identifiers, network addresses, users, and campaign content.
