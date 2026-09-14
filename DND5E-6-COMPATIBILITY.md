# D&D 5e v6 compatibility verification

Checked September 14, 2026 against the development world running Foundry 14.367 and D&D 5e 6.0.1. Prepared for Core 0.3.8, Craftworks 0.4.10, Marketplace 0.9.7, Encounters 0.1.13, Journeys 0.3.5, and Character Export 0.3.4. These releases declare Foundry 14.367 verified.

## Resolved

- Marketplace classified v6 Item source data with `system.rarities: ["rare"]` as Common and nonmagical. The same live v6 document now produces Rare and magical catalog classification.
- Craftworks now requests both rarity index fields for potion, special-treasure, and recipe catalogs. Raw Item data, material matching, recipe outputs, and award summaries use the same Core reader.
- Core's reader supports legacy strings/choice objects and v6 arrays/Sets without rewriting documents. Empty v6 collections are authoritative. Single-rarity operations use the lowest listed rarity.
- Journeys documentation distinguishes its sleep/Exhaustion resolution from native recovery and calendar advancement, including avoiding duplicate Exhaustion reduction. No rest rules or world-time behavior were changed.

## Verification completed

- 304 automated tests pass across Core, Craftworks, Marketplace, Encounters, Journeys, Character Export, and Downtime. This includes regression cases for old/new rarity data, multiple/empty rarities, shop capability restrictions, potion availability, treasure pools, and recipe resolution.
- Syntax and whitespace checks pass for changed runtime files; Core's design-system boundary check passes across six feature modules.
- Live v6: all enabled Morelord modules initialize without uncaught browser errors; Core Survival, native Constitution saves, and native tool checks return valid rolls with chat creation disabled.
- Live v6: a character export round-trips through JSON with matching calculated AC and all 33 items in the sampled character; item activities remain serializable.
- Live v6: Craftworks, Encounters, Journeys, and Marketplace settings windows render and close using Core shells and footers. This is a rendering smoke test, not exhaustive visual/responsive verification.
- Live v6 multiplayer: a separate temporary player session received a Core socket message with the correct sender identity. Journeys routed an unsaved character owned by that player to the online player and fell back to the GM after disconnect. A blind test roll had GM-only whisper recipients and was not readable by the player. The user authorized the temporary player/message records, and both were removed after the checks.
- No permanent character, Item, journey, or chat changes were made by the completed tests.

## Limits and release requirements

- Backward compatibility is covered by legacy-data regressions; a live pre-v6 world was not available.
- The live multiplayer check covers Core transport, Journeys recipient selection after disconnect, and native blind-roll privacy. Complete module-specific player workflows were not exercised end to end; duplicate request resolution remains covered by the automated service tests.
- Exhaustion logic and request serialization/disconnect behavior have automated coverage, but a complete live overnight recovery scenario was not performed. Website-side character import was not exercised.
- Core 0.3.8 provides the new reader and must be published before Craftworks and Marketplace, which now require Core 0.3.8. Keep the existing Foundry/system minimums unless separately changing support. Follow AGENTS.md to verify the latest stable Foundry build and update both the manifest and Foundry release listing; these checks do not establish full v6 certification.
