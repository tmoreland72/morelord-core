# Demo 03: Shared Locations and Neverwinter potion shop

Status: exported; user playback review pending.

## Required sequence

1. Log into Demo1 as Chuck with no password; narrate the role as the game master.
2. Open Game Settings > Morelord Core > Manage Shared Locations.
3. Create Neverwinter, settlement City, with Rare Forge and Rare Workshop capabilities. Save.
4. Create Phandalin, settlement Hamlet, with Common Forge and Common Workshop capabilities. Save.
5. Open Marketplace Shop Manager. Choose Apothecary (user corrected Alchemist), name the shop Tovin Merrick, assign Neverwinter.
6. Scroll down; uncheck Other Consumables and Loot, leaving only Potions under item options. Then select Limited Stock with dynamic generation. Enable buying and selling.
7. Return to the top and click Create Shop; scroll down to show generated stock.
8. Manually add Potion of Healing if absent. If already generated, add Antitoxin or Alchemist's Fire instead. Demonstrate static alongside dynamic stock.
9. Save; place on scene; close Marketplace Shops.
10. Locate the token on the map and double-click. Show Buy and Sell tabs; explain that players can sell only potions.

Preserve full window framing, consistent cursor, Chuck facecam and approved fades.

## Approved narration

I'm logged in as the game master. We want to create a shop for Neverwinter, but before we do that, we need to create some locations.

Under Game Settings, we'll open Morelord Core and manage Shared Locations. First, we'll create Neverwinter as a city, add a rare forge and a rare workshop, and save. The players will want to come back here for sure to make some cool stuff with Morelord Craftworks.

Next is Phandalin. We'll make it a hamlet, with a common forge and a common workshop, and save that too.

Now we'll open Morelord Marketplace's Shop Manager and choose the Apothecary template. We'll name the shop Tovin Merrick, and assign it to Neverwinter.

Scrolling down, we'll uncheck Other Consumables and Loot, leaving only Potions selected. Then set the inventory to limited stock. Then we'll head back up and click Create Shop.

Here's the first inventory Marketplace generated for us. We'll also add an item manually, so this shop has both dynamic stock and static stock we've chosen ourselves. A little planning now, fewer panicked adventurers later.

We'll save, place the shop on the scene, and close the shop manager. Now we can find its token on the map and double-click to open the storefront.

There's a Buy tab and a Sell tab. Players can shop from the available stock, but they can only sell potions to this vendor. Tovin has no interest in your spare bedroll.

## Preflight

- Code inspection confirms initial stock generation on creation and preservation of manually added stock on restocking.
- Manual inclusion bypasses catalog category filtering; player sell filtering separately uses the selected item options. Manually stocking a non-potion therefore does not imply accepting non-potions from players. Do not claim all purchasable stock is potions if a non-potion is added manually.
- Check existing location records before creation to avoid duplicates. Live capability controls, inventory, scene placement and storefront behavior still need verification.
- Generic manual-item narration covers the conditional choice without generating alternative paid takes.
- No generation credits spent during preparation.


## Production results (2026-09-16)

- Approved all script changes, including the exact new opening, Craftworks sentence, and moving Limited Stock after the item filters. Approved one facecam generation at the $11.88 estimate.
- Production folder: E:/.codex/visualizations/2026/09/16/01a0a870-de17-78e3-b6fa-8c28ce1cc0a6/demo03.
- Created Neverwinter (4NyVi7UAyAT98oZ4): City, Rare Forge and Rare Workshop. Created Phandalin (ADZijZYMFxKgAP99): Hamlet, Common Forge and Common Workshop. Both saved, no scene associations added.
- Created Tovin Merrick (iXeU5X1S52wyEehe) from Apothecary, associated with Neverwinter, Limited Stock, only Potions selected, buying and selling enabled. Initial inventory generated on Create Shop. Potion of Healing was already present, so manually added one Antitoxin, shown with Manual badge. Saved and placed one shop token: Scene.pbsoPhandalinReg.Token.mZ1TkUg3ixhhpTzu.
- Recorded storefront opening by double-click after activating the Tokens layer, and both Buy and Sell tabs. No player transactions performed. The GM's default Party shopper has no eligible sell items; the Sell tab is shown empty.
- Snapshot assertions passed for both settlement types, all four capabilities, location assignment, potion-only item options, Limited Stock, manually included Antitoxin quantity one, and one scene token.
- Reused the established cursor, Chuck reference image, voice, local background removal, and narration timing tools. No new illustration generated. Local transcription confirmed the approved narration; timing edits introduce pauses without changing spoken words.
- ElevenLabs flow: https://elevenlabs.io/app/flows/3rj3SuKTaTnj3jFI7ub9. Voice tkJUpzIGyhounepJIUDw, selected narration 3CxHtSvxMlwU7zdXT8lG (76.32 seconds), facecam EPunZsgTX8E86C6nt29H (76.4 seconds).
- Actual reported costs: narration default four takes 5,511.4488 credits / $1.0020816; one Aurora facecam 65,320.26732 credits / $11.87641224. Total 70,831.71612 credits / $12.87849384. Aurora reported a retryable provider status error before completing successfully on the same run; no second video generation submitted.
- Screen edit: 2560x1440, 25 fps, 101.6 seconds. Facecam and narration receive identical pauses to preserve synchronization. Final export completed. Full audio/video decode passed; final metadata verified; sampled final frames inspected for framing, compositing, visible articulation and expressions. User playback approval remains pending.

- Final video: E:/.codex/visualizations/2026/09/16/01a0a870-de17-78e3-b6fa-8c28ce1cc0a6/demo03/Morelord-Demo-03-Locations-and-Shop.mp4 (101.6 seconds, H.264/AAC stereo 48 kHz, 35,798,399 bytes).
