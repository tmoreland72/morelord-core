# Demo 02: Gearing up for Phandalin

Status: Recorded and exported for user review. User approved the script, corrected the login to Thalin, and changed the weapon to a scimitar. Follow DEMO-RECORDING-GUIDE.md.

## User requirements

- Continue the campaign video after the approved opening and existing intro.
- Campaign premise: the party is asked to transport goods from Neverwinter to Phandalin, a trip of just over five days. Treat this duration as the user's campaign premise.
- Use Demo1 and the Thalin login, explicitly confirmed by the user. User corrected the earlier Thalia name to Thalin.
- Sell one extra bedroll, retaining the bedroll she needs, and the entire stack of three oil.
- Buy one scimitar (user changed the approved weapon choice because Thalin has low Strength).
- Fit the entire wide Marketplace UI in frame, including its header, filters, item list and cart. Keep Chuck clear of these controls.
- Show the Amulet of Health as unaffordable and click its heart to wishlist it. Do not buy it or add funds.
- Show Chuck's consistent small facecam with approved voice, synchronized articulation, fitting expressions and lightly silly delivery. Keep important UI visible, window headers in frame, and the cursor consistent.

## Approved narration

The party has been asked to take goods from Neverwinter to Phandalin. It's a little over a five-day trip, so before they head out, they need to make sure they're geared up and ready.

Let's log in as Thalin and open Morelord Marketplace. First, she'll sell her extra bedroll and this stack of three flasks of oil. One bedroll is plenty. She's going adventuring, not opening an inn.

Next, she'll buy a scimitar.

She's also got her eye on an Amulet of Health, but it's out of her price range for now. Clicking the heart adds it to her wishlist, so she can come back to it when her coin purse catches up with her ambitions.

## Recording and verification

- Inspect the actual login, actor ownership, starting inventory, funds, shop stock/prices and approval behavior before recording; do not change world data merely to make the premise true without identifying the discrepancy.
- Capture the real sell and buy workflows, including any required approvals, in the requested order. Show final inventory and currency changes.
- Show the heart's selected state and confirm the amulet appears in the wishlist.
- Pace narration to the real UI actions; approve wording changes before speech generation.
- Record the selected assets, estimated and actual costs, and output path here. Reuse approved assets and verify model inputs before spending credits.

## Production result (2026-09-16)

- Output: `E:/.codex/visualizations/2026/09/16/01a0a870-de17-78e3-b6fa-8c28ce1cc0a6/demo02/Morelord-Demo-02-Gearing-Up.mp4`.
- Capture/export: 2560x1440, 25 fps, H.264/AAC. The Marketplace window is positioned at (300,30), sized 2220x1330, entirely inside the frame. The transparent 280x246 Chuck facecam sits at (12,1170), outside the Marketplace window.
- Actual authorized transactions completed once: bedroll R4l8ssYNxt9qyWPk sold for 1 gp; three-oil stack yNpSbO4zSBdsSKtH sold for 3 sp; one standard Scimitar purchased for 25 gp. Starting funds were 25 gp 2 sp. Final funds: 1 gp 1 ep (1.5 gp). One bedroll and the separate two-oil stack remain. Amulet of Health (400 pp) is saved in Thalin's wishlist and was not purchased. Before/after snapshots and capture timing marks are saved beside the export.
- Flow: https://elevenlabs.io/app/flows/nfd7JU5XYqCNLlA3gVcn. Narration take OVSNu5spJHYseBtxQ6Be uses the established Chuck voice. Aurora facecam generation SN1otzCG7H9Uas8yOcpx completed in one paid video run.
- ElevenLabs reported charges: four narration variations total 2,763.72 credits / $0.5025; one facecam animation 28,842.72 credits / $5.2441. Combined: 31,606.44 credits / $5.7466. These figures exclude the separate imagegen cutout, whose cost was not returned by that tool. Local screen capture, editing, background removal, and speech timing checks did not use ElevenLabs generation credits.
- Used a local transcription pass for timing and local compositing to remove the facecam background. The generated animation did not honor the requested blue backdrop; no paid correction was needed. Narration and facecam receive matching pauses during UI actions.
- Verification: inventory/currency/wishlist assertions passed; full export decode passed. Sampled final frames reviewed for layout, mouth movement, and compositing. User playback approval remains pending.
