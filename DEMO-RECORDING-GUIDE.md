# Morelord Demo Recording Guide

## Scope and instruction handling

- Read this guide before planning, scripting, recording, editing, or exporting a Morelord demo video.
- Follow the user's current instructions. When the user gives a reusable demo rule or correction, update this guide during that task so it persists across future tasks. Keep requirements specific to one video in that video's brief.
- Preserve explicit requirements about content, sequence, wording, pacing, framing, audio, editing, and delivery. Do not silently replace them with inferred preferences.
- Distinguish user requirements from assistant suggestions. A suggestion is not an approved standing rule.
- If instructions conflict or a required result cannot be achieved, explain the specific issue and ask only for the missing decision. Continue independent work where possible.

## Production service access

- Use the user's designated video destination when provided; otherwise store and reference demo production files using the physical `E:/.codex/visualizations/` path. The legacy `C:/Users/troy/.codex` path is a junction to `E:/.codex`; do not present it as the production location. Record project-specific moves and the new paths in the assembly brief.

- For Chuck's established voice and video production, use the existing direct ElevenLabs MCP server and its `creative_*` tools. The original intro task used `creative_generate_speech`, `creative_generate_video`, and the creative flow tools. Composio is a separate MCP connection; its ElevenLabs toolkit is not the route that produced the original intro. Check both MCP connections and the original task's tool history before diagnosing missing access. Absence of a plugin or restrictions in Composio do not establish that the direct ElevenLabs creative tools are unavailable.
- Reuse Chuck's established voice and production assets. Record video-specific source paths and workflow identifiers in the video's brief.
- For YouTube publishing, use Composio's YouTube tools with the `morelord-gaming` connection and verify the channel is `@morelordgaming` before writing. If Composio tools are absent, check the MCP connection itself; an unauthenticated HTTP 401 does not establish that the YouTube account is disconnected. The supported `codex mcp login composio` flow restored MCP authentication in this installation. Rediscover tools after login before requesting another account reconnect.

## Before recording

- Present the actual spoken script to the user before creating a video, and obtain their approval before generating the spoken performance. Once approved, keep its words unchanged unless the user requests a revision.

- Turn the user's instructions into a concise checklist in the video's brief. Include the intended audience, workflows, sequence, and any specified recording or delivery requirements.
- Read Core's MORELORD-MARKETING-BRANDING.md and, when showing Foundry UI, MORELORD-BRAND-GUIDE.md. Follow the user's explicit direction for the video.
- Carry the brief and checklist forward when resuming a task; record completed sections, selected takes, and remaining work.

## Credit control and correction requests

- Treat generation credits as a limited user resource. Before any paid correction, inspect the rejected output, identify specific defects (with timestamps where possible), and distinguish observed failures from suspected causes. Do not spend credits on vague retries.
- Write a precise correction specifying what must change, what must stay unchanged, and observable acceptance checks. For spoken Chuck shots, describe mouth articulation, expressions tied to the approved delivery, and steady lighting explicitly; avoid conflicting performance cues.
- Confirm the selected model supports the required correction and character style using available guidance and prior results. Verify the actual reference assets, selected audio take, input connections, duration, resolution, and generation count before submitting. Prompt clarity alone does not guarantee a model can perform the correction.
- Check the cost estimate before generation when available. Reuse approved audio and assets; use local editing for defects it can reliably fix. When an uncertain method can be tested on a short representative clip, inspect that test before spending on the full render.
- Record the correction, model/settings, estimate, and result in the video's brief. If a method fails, investigate why before another paid attempt; do not repeat an unchanged request or cycle through models speculatively. Never submit a duplicate generation merely to check progress.

## Before delivery

- Keep Chuck's narration intact across edits. Never cut a spoken phrase and delay its remaining words into a later shot. Prefer continuous narration for short scenes; extend or hold the visuals to fit the complete speech. Make necessary audio edits only at verified natural pauses, with room for the final consonant and a short trailing pause. Transcription timestamps alone do not establish safe cut points. Check every audio join for clipped words, repeats, and delayed sentence tails before delivery.
- Review the assembled video against the brief and every applicable rule in this guide.
- Check that required actions are visible, text is readable, section transitions make sense, and any audio stays synchronized.
- For Chuck's spoken performances, verify visible lip and jaw movement synchronized to the words, with expressions matching the delivery. Reject closed-mouth narration or unrelated expression loops. Keep lighting and exposure steady; reject unintended pulsing or flicker.
- Report any unmet requirement or verification that could not be performed. Do not claim the video was reviewed unless it was actually inspected.

## User-defined standing recording preferences

- Keep repeated player-roll demonstrations concise: show one representative player's roll per workflow, then the GM's aggregate results where useful. Resolve other players off-camera. Preserve multi-player sequences only when explicitly requested or approved; Day Two's sleep/exhaustion rolls are an explicit exception and must remain together.
- After a completed encounter in a campaign demo, include Morelord Craftworks harvesting and offer optional looting as sources of crafting materials. Explain that the GM can allow either or both. Show participating players claiming components in their own sessions, and connect ingredient highlights to that character's marked crafting recipes when applicable. Do not claim a recipe match that the actual results do not show.
- Use ElevenLabs-generated music for demo background music, rather than audio installed in Foundry. Keep music quiet beneath narration and use ambience appropriate to the demonstrated scene. For travel-to-encounter transitions, switch from travel ambience to battle music as the Encounters section begins. Check generation estimates before spending credits.
- Before generating new music, check existing approved intro/demo music for a suitable reusable track. Prefer reuse when it fits the scene.

- During demo walkthrough segments, show Chuck as a small head-and-shoulders facecam overlay, as though he is the one recording the demo. Remove the background; synchronize his mouth with narration and use natural blinks and occasional small, silly reactions. Default to a bottom corner and keep his size and position consistent across segments; reposition only when needed to avoid covering important controls, text, or results. This applies to walkthrough footage; the seated opening and existing intro retain their planned presentation.

- Keep Chuck a little silly: use playful expressions, light comic timing, and small gestures while keeping approved dialogue unchanged.

- Chuck must always introduce himself with the exact words: "This is Chuck from Morelord Gaming."

- Always use the Demo1 world for demo videos.
- Use Chuck as the default login, with no password (leave the password field blank).
- In narration, say "I'm logged in as the game master," rather than "I'm logged in as Chuck," to distinguish the GM role from a player. The actual account remains Chuck.
- The user authorizes logging in as any of the four demo users when needed: Darro, Snovlumi, Thalin, or Ubeeren. All four have no passwords; leave the password field blank.
- For demos involving GM-to-player requests, keep the GM and all participating players logged in concurrently in separate browser contexts or profiles with isolated cookies/storage. Verify each session's identity and show both GM and player perspectives; ordinary tabs sharing a login are not independent sessions.
- Before recording routed requests, check Core's Ignored Users list: an ignored recording account cannot send or receive module messages. Record and restore any temporary recording-specific setting changes.
- The user corrected the Marketplace demo login from Thalia to Thalin. Use Thalin; Demo1 has no Thalia account.

- Fit the entire wide Marketplace window in the video frame, including its header, filters, item list, and cart; keep Chuck clear of controls.
- Always show windows from the top: keep the top of the window, including its header, visible in the recording, and start each window demonstration with its content scrolled to the top before scrolling through it.
- Always show the same mouse pointer. Keep its appearance, size, and any cursor effects consistent across all recorded sections and in the assembled final video.

No recording format, segment length, narration style, or export settings have been established yet.
