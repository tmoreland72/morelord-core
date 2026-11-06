# Morelord Core 0.9.2

## What Changed

### Added

- `MorelordCore.currency` converts SRD 5.2 coins and reads or updates an actor's purse. It is the same object as `game.modules.get("morelord-core").api.currency`. `addCoins(actor, coins)` adds or spends exact pp, gp, ep, sp, and cp without re-splitting the purse.
- `MorelordCore.rolls.formatModifier` returns a signed modifier such as `+5`. `skillChoiceLabel(actor, skillKey)` returns the skill name and that actor's total, such as `Religion (+5)`.
- `MorelordCore.ui.itemCard` renders the shared award chat card: header, item rows, coin line, and footer.
- `MorelordCore.inventory.addItems(actor, items)` grants item data or documents. Compatible consumables and loot combine quantity. Equipment, weapons, and tools combine only when they have a positive whole-number quantity. Containers, and items carried in a container, stay separate. Items that differ in charges, identified, or attunement stay separate. An invalid quantity rejects the whole add before anything is written. If creating the new documents fails, quantity changes from that call are restored.
- A roll request can opt in with `preserveMessageMode: true` so `ChatMessage.create` keeps the caller's whisper, blind flag, and message mode. Omit `messageMode` on that call to leave a custom whisper list as given. `holdCompletion: true` leaves that row open: it does not show Completed on click, and resolve does not mark it completed unless the handler returns `{ complete: true }` or the caller uses `completeChatRoll`.

### Changed

- The shared roll-request card uses the award header. One character's name is shown once, in the header. A party card still names each character on its row.
- `register` still accepts a function. It also accepts `{ prepare, resolve }`. `prepare` runs on the client that clicked. `create` accepts optional `speaker`, `whisper`, and `flags` and still posts `{ messageMode: "public" }` unless `preserveMessageMode` is true. `updateEntry` lets an eligible GM patch one entry and render it again.
- `completeChatRoll(message, entryKey)` still only marks that entry completed. `completeChatRoll(message, entryKey, { reopen: true, title, actionLabel })` still reopens it. Callers that do not pass the new flags are unchanged.

## Verification

`npm test` passed 243 tests. `npm run check:design-system` passed. Node coverage is in `test/currency-service.test.mjs`, `test/skill-roll-service.test.mjs`, `test/item-card.test.mjs`, `test/chat-roll-requests.test.mjs`, and `test/inventory-service.test.mjs`.

The Dev1 regression is `scripts/testing/release-regression.js`. Run `releaseRegressionChecks` through `runInGameTests` as Chuck, with the Chat tab open and a temporary player logged in. This preparation did not run Foundry. `module.json` stays at 0.9.1 and `compatibility.verified` stays `14.369` until that Dev1 pass on Foundry 14.370. Game Master does not yet pass the new opt-in flags, so its private hoard still restores whisper after create and still reopens a completed step.
