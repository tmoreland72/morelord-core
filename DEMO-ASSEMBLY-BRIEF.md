# Campaign demo combined preview

## Full Road to Phandalin assembly — 2026-09-17

YouTube publication completed through Composio's `morelord-gaming` connection: https://www.youtube.com/watch?v=kubQ5qZ6B0I on verified channel `@morelordgaming`. Uploaded with public visibility on 2026-09-18 UTC; title, description with 16 chapter timestamps, tags, and custom thumbnail verified by API. YouTube processing was still in progress at the first verification. Thumbnail `YouTube/thumbnail.jpg` matches the supplied Journeys/Craftworks artwork from `P:/Gaming/TTRPG/Morelord Gaming`; PNG master retained. Publication status saved in destination `YouTube/publishing-status.json`. The MCP authentication issue was resolved using `codex mcp login composio`. No paid promotion started.

User requested the full series and relocation of all produced video files to `E:/Morelord Gaming Videos/Road to Phandalin Demo`.

Final output: `Morelord-Road-to-Phandalin-Complete.mp4` at the destination root. Assemble the existing pacing-revised complete video (1033.341016 seconds), Demo07 Day Four (90.52 seconds), and Demo08 arrival/downtime/outro (143.92 seconds), in that order. Total approximately 21:07.78. The recipes and harvesting inserts are already embedded in the pacing-revised assembly; do not duplicate them. Preserve its removed token drag, concise player rolls, all Day Two sleep rolls, music, and black fades.

Relocation scope: all 255 video files in the campaign production root and original introduction production root, including prior exports, generated takes, raw recordings, and intermediate edits. Preserve relative folder structures under `Archive/Campaign` and `Archive/Introduction`. Do not overwrite existing destination files. Verify each moved file against its original SHA-256 hash. Keep non-video assets in their existing production folders and record old/new video paths in `Production Notes/video-move-manifest.json`; historical scripts require that path mapping.

Assembly reuses existing media, copies the picture stream, reconciles audio timestamps, and adds chapters for Day Four, arrival, downtime, crafting, language training, and Chuck's outro. No new generation credits. Final verification and move totals are recorded in the destination's `Production Notes/assembly-report.json`.

The paths in historical sections below describe the files before relocation. Use the move manifest for their current locations.

## Complete campaign assembly — 2026-09-16

Pacing revision requested: remove the post-Day-One party-token dragging and its narration. For repeated rolls, retain one player per workflow: Darro for Day One encounter/foraging/gathering and Day Two encounter; Snovlumi for Day Two Press On to show an actual failed save. Retain all Day Two sleep/deprivation rolls and resulting exhaustion, plus existing single-player discovery/navigation/sleep demonstrations. Remove the now-inaccurate "Let's see each player's roll" line as a complete sentence. Preserve the harvesting insert, recipe insert, background music, and all other narrative content. The executable edit and exact source intervals are in `assembly/pacing-revision.cjs` and `assembly/pacing/plan.json`.

Latest complete output: `E:/.codex/visualizations/2026/09/16/01a0a870-de17-78e3-b6fa-8c28ce1cc0a6/Morelord-Campaign-Demo-Complete-Pacing-Revision.mp4`.

Pacing revision duration: 17:13.34, about 1:53 shorter. Same 2560x1440, 25 fps, H.264/stereo AAC format and ten embedded chapters. Existing music retained; no generation credits used. The three-frame tail of another player's gathering view is replaced with a hold of the first GM results frame, preserving the audio and total duration. Original exports remain available.

Revision verification: full-file audio/video decode passed; duration and chapter metadata checked; all seven cut-point contact sheets inspected, including the corrected gathering join. The full four-player Day Two sleep sequence was visually verified. New audio joins were placed at measured speech-free intervals; auditory playback review was not performed. Final size: 277,654,223 bytes.

Revised chapter starts: opening 00:00; introduction 00:15.200; gearing up 01:03.280; locations/shop 01:51.200; downtime 03:32.800; recipes 04:41.720; Day One 05:10.120; Day Two 11:53.200; harvest/loot 14:22.660; Day Two continues 15:22.660.

The historical assembly and music-pass details below describe the source export before this pacing revision.
Previous music-complete output: `E:/.codex/visualizations/2026/09/16/01a0a870-de17-78e3-b6fa-8c28ce1cc0a6/Morelord-Campaign-Demo-Complete-with-Travel-Music.mp4`.

Music follow-up: added the existing ElevenLabs travel track to the previously music-free campaign opening (00:00–00:15.200), gearing up, locations/shop, downtime/training, recipes, and Day One (01:03.280–12:36.120). Source render scripts confirmed those sections contained narration only. Existing Morelord introduction and Day Two music, including battle music and harvest insert, receive no additional music layer. Bed normalized to -29 LUFS before speech-driven ducking, with 0.5-second section fades; narration remains continuous and untrimmed. Picture stream and chapter metadata preserved. No new generation or credits. The earlier complete export remains available as the source. Full-file decode passed; measured audio peak -0.8 dBFS. Auditory playback review was not performed. Exact mix retained in `assembly/travel-music-filter.txt`.

Duration 19:06.66; 2560x1440, 25 fps, H.264 with stereo AAC 48 kHz; 406,454,724 bytes. Ten embedded chapters include both inserts. No generation credits used.

| Start | Section |
| --- | --- |
| 00:00.000 | Campaign opening |
| 00:15.200 | Morelord Gaming introduction |
| 01:03.280 | Gearing up |
| 01:51.200 | Locations and shop creation |
| 03:32.800 | Downtime and training |
| 04:41.720 | Darro's Craftworks recipes |
| 05:10.120 | Journeys Day One |
| 12:36.120 | Journeys Day Two |
| 15:42.620 | Harvesting and loot |
| 16:42.620 | Day Two continues |

Sources: approved three-part combined preview, Demo03 Locations and Shop, Demo04A expanded Downtime/Training/Recipes, Demo05 Day One, and Demo06A expanded Day Two with Harvest/Loot. The expanded sources already contain the inserts and repaired narration joins; do not add the standalone inserts again.

Joined complete segments without trimming spoken content. Video packets copied without picture re-encoding; audio timestamps reconciled and encoded once for the assembly. Existing black fades and source levels preserved. Original files unchanged. Exact source paths, durations, and chapters are retained under the production root's `assembly/` directory.

Verification: full output audio/video decode passed; format, duration, and all ten chapter markers checked. Contact sheets at all four new section joins inspected. No new auditory playback review was performed; existing internal edits in unchanged source segments were retained.

## Earlier three-part preview

Requested order, assembled 2026-09-16:

1. New campaign opening: `E:/.codex/visualizations/2026/09/16/01a0a870-de17-78e3-b6fa-8c28ce1cc0a6/Morelord-Campaign-Opening-02.mp4` — starts 00:00.000, duration 15.200 seconds.
2. Morelord Gaming introduction: `E:/.codex/visualizations/2026/09/15/01a0a740-6696-7461-a459-da1d2a3acd84/v3/Morelord-Gaming-Interlude-V3.mp4` — starts 00:15.200, duration 48.080 seconds.
3. Gearing up as Thalin: `E:/.codex/visualizations/2026/09/16/01a0a870-de17-78e3-b6fa-8c28ce1cc0a6/demo02/Morelord-Demo-02-Gearing-Up.mp4` — starts 01:03.280, duration 47.920 seconds.

Output: `E:/.codex/visualizations/2026/09/16/01a0a870-de17-78e3-b6fa-8c28ce1cc0a6/Morelord-Campaign-Demo-Combined-Preview.mp4`.

Export is 2560x1440, 25 fps, H.264 with stereo AAC at 48 kHz, duration 111.200 seconds. The first two clips are upscaled without cropping; Marketplace retains its original resolution and complete framing. Existing fades, performances, and audio levels are preserved. Source files remain unchanged. No new generation credits used.

Verification: complete audio/video decode passed; output dimensions, frame rate, audio sample rate, and duration checked. Contact sheet inspected around both joins and within all three segments. User approved the combined video and specifically approved the fades to and from black.
