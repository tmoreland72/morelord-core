# Demo 06A: After the battle — harvesting and loot

Status: completed; standalone insert and expanded Day Two exported and checked. User narrowed the shown harvesting perspective to Darro after narration submission.

## Requirements and placement

- Insert into Day Two after encounter placement and the complete "You let that play out" narration (including its following joke), before returning to the regional map/Journeys. Fade from black into Old Guard Post to establish the battle is over; preserve the return to the existing Day Two footage.
- Demo1; Chuck as game master plus Darro, Snovlumi, Thalin, Ubeeren in five simultaneous isolated sessions. No facecam; established pointer, full window headers, and existing ElevenLabs music reused at low volume where appropriate.
- View Old Guard Post. User has already set monsters to zero HP. Do not replay combat or reset campaign/journey state.
- Open Craftworks, Harvest; confirm six dead monsters and four participating players; select Skip Skill Checks. Show only Darro's player session claiming components; resolve other participants off-camera. Return to the game master and visibly Finalize Harvest before opening Loot.
- Show Darro's ingredient labels for his marked Antitoxin/Potion of Healing recipes if actual results match. Otherwise explain the feature conditionally; do not fabricate or force matches. Only the character's marked recipes drive these highlights.
- After harvesting, demonstrate Loot, resolve actual results and award through the normal workflow. Explain either/or is typical but both are at the GM's discretion, and encourage crafting material acquisition.
- Preserve complete spoken phrases. Fit footage to intact narration; use only verified natural pauses for necessary audio joins. Inspect existing Day Two insertion boundaries and music transition.

## Verified preflight

- Live Demo1 Old Guard Post contains a Lizardfolk Geomancer and five Venomous Snakes, all at 0 HP. Darro, Snovlumi, Thalin, Ubeeren are on the scene and alive.
- Darro's saved marked recipes are `phb-alchemy-antitoxin` and `phb-alchemy-potion-of-healing`.
- Current Harvest UI names the checkbox "Skip Skill Checks" and describes immediate access to claimable components for included characters.
- Harvest player implementation resolves ingredient matches using that participating actor's marked recipes, not a global crafting-character selection. Loot UI supports Roll Encounter Loot and Award Encounter Loot.
- Still verify the live Harvest setup, five-user routing (including Core Ignored Users), actual component matches, claim results, and loot outcomes during recording. Restore temporary routing changes afterward.

## Approved narration and subsequent correction

The user approved this script, then requested only Darro's harvesting perspective after generation had started. Replace "Let's visit each player's session and claim their parts" with a clean local edit if possible (for example, "Let's claim their parts"); do not narrate showing every player's session. Preserve the rest of the approved wording and intact speech. No duplicate generation merely for this edit.

Now that the battle is over, we're back at Old Guard Post. Before we leave, the party can harvest monster components for crafting. Waste not, want more potions!

As the game master, we'll open Morelord Craftworks and choose Harvest. We'll confirm the defeated monsters and our four party members, then select Skip Skill Checks. That lets everyone go straight to claiming components without another round of skill rolls.

Let's visit each player's session and claim their parts. Darro marked Antitoxin and Potion of Healing before leaving Neverwinter. When a component matches an ingredient in one of his marked recipes, Craftworks labels it with that recipe. These reminders come from the recipes that character marked for crafting.

Once everyone has finished claiming, we'll finalize the harvest.

We can also use Craftworks to roll and award encounter loot. Normally, you might choose harvesting or looting, but the game master can allow both. It's another chance to collect monster components and encourage the party to craft something useful.

With that taken care of, let's get back to our journey.

## Source

`E:/.codex/visualizations/2026/09/16/01a0a870-de17-78e3-b6fa-8c28ce1cc0a6/demo06/Morelord-Demo-06-Journeys-Day-Two.mp4`.

Export the standalone insert and an updated Day Two video, preserving the original. Keep costs and final verification outcomes here.

## Recorded outcomes and edit

- Recorded five isolated simultaneous sessions, showing only the GM and Darro in the insert. Six zero-HP creatures and all four party members included; Skip Skill Checks enabled. No harvest skill rolls fabricated.
- Darro's Common Curative Reagent genuinely displayed Antitoxin and Potion of Healing recipe labels. Recorded the labels and his claim. All four characters resolved six creature claims and clicked Done; the other three players were handled off-camera.
- Recorded the GM clicking Finalize Harvest and the successful completion notification before opening Loot. Loot rolled once, then awarded to the configured Party inventory: Common Reactive Reagent x1, Parts x1, Metal Scraps x2, Common Poisonous Reagent x1, Potion of Healing (Greater), Potion of Growth, Magic Missile spell scroll, and 2 gp / 4 sp / 1 cp. No special treasure; no reroll or invented loot result.
- Saved inventory snapshots and verified journey remains Day Two completed, phase null, 6 thirds traveled and 10 remaining. Restored original Core ignored-user list containing Chuck and closed recording sessions.
- Narration flow `P1vabX3VYEF0Y5cj22Cz`, node `jKeE5iWATjNKwSKuxfAu`, selected take `YveKZbT1K519pbg2fdYN`, Chuck voice `tkJUpzIGyhounepJIUDw`, eleven_v3. Four default takes cost $0.8028288 total. No facecam, music generation, or paid correction.
- Removed the entire superseded sentence "Let's visit each player's session and claim their parts" at measured silence boundaries 23.69 and 26.67 seconds, with 0.31 seconds of added pause. Remaining words retained. Do not use the earlier suggested intra-sentence splice.
- Insert duration 60 seconds, with black fades, complete narration, existing quiet ElevenLabs travel music, and consistent pointer and GM/Darro labels. GM finalization visibly precedes Loot.
- Insert at original Day Two 03:06.500, after the complete initiative/joke passage and before the return to Journeys. Also repaired the original Day Two narration boundaries using the existing speech and measured silence intervals; retained the complete final take rather than trimming its tail. Video timing otherwise preserved. Exact boundaries and executable assertions are in `day2-audio-repair.json` and `assemble.cjs`.
- Production folder: `E:/.codex/visualizations/2026/09/16/01a0a870-de17-78e3-b6fa-8c28ce1cc0a6/demo06a/`. Standalone `Morelord-Demo-06A-Harvest-and-Loot.mp4`; expanded `Morelord-Demo-06-Journeys-Day-Two-with-Harvest-and-Loot.mp4`. Original Day Two output preserved.
- Final expanded video: 390.52 seconds (6:30.52), 2560x1440, 25 fps, H.264/AAC stereo 48 kHz. Entire insert and assembled file decoded without errors. Sampled insert frames and both transition contact sheets inspected; narration cut points asserted inside measured source silence. Saved-state and recipe-label checks passed. Auditory playback review was not performed; these are visual, data, and signal-boundary checks, not a listening review.
