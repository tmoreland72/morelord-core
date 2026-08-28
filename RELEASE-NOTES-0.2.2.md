# Morelord Core 0.2.2

Morelord Core 0.2.2 adds a shared contextual request transport for reliable cross-client module workflows.

## Added

- Added a Socketlib-backed contextual transport with module namespaces, explicit user and GM targeting, queued handlers, execution metadata, and keyed mutation serialization.
- Made the contextual transport initialize immediately when Core loads after Socketlib is already ready.
- Declared Core's module socket namespace and Socketlib dependency.

## Fixed

- Added a message ID fallback for environments where `crypto.randomUUID` is unavailable.
