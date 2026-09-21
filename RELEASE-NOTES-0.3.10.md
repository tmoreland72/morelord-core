# Morelord Core 0.3.10

Updates to shared reporting and core workflows.

## What Changed

### Improvements

- Troubleshooting exports include optional module diagnostics, with Craftworks catalog/access/source/sync state and privacy-safe recent harvesting outcomes. Existing synchronous export APIs remain compatible.
- Shared checkbox grids wrap long labels inside their columns, preventing overlapping Downtime activity and contributor choices.
- Added shared plain-text log formatting for nested result details. Downtime history uses readable sentences and Core cards without changing stored records.
- Added shared opt-in feature/error reporting, separate error consent, pseudonymous world IDs, bounded retries and an API consumed by the active gameplay modules. Historical version-sharing consent does not enable broader reports. The reporting website is deployed; reporting requires fresh GM consent.
- Shared participation supports opt-in `includePartyNpcs` for primary-party NPC companions; existing character-only consumers retain their behavior.
- Added a Discord Community entry in Core’s settings with a Join Discord button for support, feature requests, and general discussions, available to GMs and players.
- Added an opt-in compact badge layout that truncates long labels while keeping trailing quantities visible. Craftworks uses it for Harvest recipe pills; existing badges retain their layout.
- Core settings use a short anonymous-version-sharing checkbox label with its full explanation below, preventing text clipping in narrow windows.
- Shared skill rolls accept optional advantage/disadvantage while preserving native automatic rules.

## Compatibility and verification

Verified release workflows on Foundry VTT 14.368 with D&D5e 6.0.3 in a disposable test world. Supported minimum/maximum bounds are unchanged. Existing Node tests and the shared Core design-system check passed; in-game evidence is retained in the repositories.
