# Demo 04A: Darro plans recipes

Status: completed; approved narration, recipe insert, and expanded Downtime segment exported.

## Requirements

- Insert immediately after Thalin finishes her Downtime projects in Demo 04, before journey preparation. The user's dictated "Fallen" refers to Thalin.
- Demo1, Darro login with blank password. Show login and open Morelord Craftworks to browse recipes.
- Select Player's Handbook source, then Common rarity. Use the user's approved explanation below verbatim.
- Search instead of scrolling. Find Antitoxin and mark it for crafting later, then search for Potion of Healing and mark it as well. Verify both saved selections; do not craft either item.
- Chuck voiceover only, no facecam. Full window header visible, initial scroll at top, established pointer and black fades.
- Preserve current journey progress and existing Downtime projects. Do not rerun Demo 04's project-creation script.
- Use one continuous narration take for this short scene, retaining complete words and a trailing pause. Fit screen footage around the narration. Verify the insertion join does not interrupt Thalin's closing narration.

## Approved narration

Before we head out, Darro has a little crafting homework. We'll log in as Darro and open Morelord Craftworks to browse recipes.

First, let's filter the recipes by selecting Player's Handbook, then Common rarity. That helps us focus on recipes we can easily craft early in the campaign.

We'll search for Antitoxin and mark it for crafting later. Then we'll search for Potion of Healing and mark that too. A little preparation now, a little less panic later.

## Assembly target

Existing segment: `E:/.codex/visualizations/2026/09/16/01a0a870-de17-78e3-b6fa-8c28ce1cc0a6/demo04/Morelord-Demo-04-Downtime-and-Training.mp4` (68.92 seconds).

Export the new insert and an expanded Downtime-plus-recipes segment, preserving the original. The documented combined preview currently contains only the opening, brand introduction, and gearing-up segments; it does not yet contain Downtime. Do not append the insert to that preview in the wrong position.

## Production result

- Folder: `E:/.codex/visualizations/2026/09/16/01a0a870-de17-78e3-b6fa-8c28ce1cc0a6/demo04a/`.
- Insert: `Morelord-Demo-04A-Craftworks-Recipes.mp4`, 28.4 seconds. Expanded segment: `Morelord-Demo-04-Downtime-Training-and-Recipes.mp4`, 97.34 seconds, 2560x1440, 25 fps, H.264/AAC stereo 48 kHz. Original files preserved.
- Recorded Darro login, Craftworks opening, Recipes, Player's Handbook then Common filters, searching Antitoxin and Potion of Healing, and each Mark for Crafting action. Verified Darro's saved flags contain both PHB recipes. No crafting jobs created or journey days advanced.
- Voice: Chuck — Morelord Gaming, `tkJUpzIGyhounepJIUDw`, eleven_v3. Flow `qKMHQMIXqaa1pps8mvnv`, selected take `MZrBvAoDvlfUEdY43Ofc`, 26.88 seconds. Default four takes cost $0.3330576 total; no facecam, new music, or correction generation.
- The new scene retains the entire continuous narration with a 0.4-second lead-in and trailing silence. Repaired the existing Downtime segment's seven internal audio boundaries to measured silence intervals, retaining all source speech and existing video timing. No paid regeneration. See `downtime-audio-repair.json` and `render.cjs` for exact boundaries.
- Saved-state verification, sampled visual review, measured audio-boundary checks, and full-file decode passed. Auditory playback review was not performed; do not describe these checks as a listening review.
