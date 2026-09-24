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

- Before a long capture, record and finalize a short test clip with the same browser, encoder, resolution, and permissions. Verify that it decodes and contains the visible pointer. Finalize and check sections during production; a running browser or an empty output placeholder does not prove video is being saved.
- Dismiss welcome dialogs in every recording session after startup finishes. Inspect the canvas as well as ApplicationV2 windows; third-party welcome dialogs may use different markup. Check frames immediately after each window closes.

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
- Do not deliver footage with visible error notifications. Inspect notification areas across the final timeline and closely review GM/player transitions; coarse chapter samples can miss short banners. Use clean recorded footage or re-record the affected action, preserving narration and pointer continuity. A recording edit does not establish that an underlying software issue was fixed.
- Check that required actions are visible, text is readable, section transitions make sense, and any audio stays synchronized.
- For Chuck's spoken performances, verify visible lip and jaw movement synchronized to the words, with expressions matching the delivery. Reject closed-mouth narration or unrelated expression loops. Keep lighting and exposure steady; reject unintended pulsing or flicker.
- Report any unmet requirement or verification that could not be performed. Do not claim the video was reviewed unless it was actually inspected.

## User-defined standing recording preferences

- Demo thumbnails/banners must match the existing Morelord demo series. Use `E:/Morelord Gaming Videos/Road to Phandalin Demo/YouTube/thumbnail.png` as the campaign-demo layout reference and the `Morelord [module] Youtube Image.png` files in `E:/Morelord Gaming Videos` as style references: prominent gold Morelord Gaming masthead, framed parchment title, illustrated Chuck/scenery and a restrained feature ribbon. Inspect the actual references before generation; retain the series design while adapting the setting and title.
- Do not add captions, lower thirds, explanatory overlays, or subtitles unless requested.
- Record a visible, consistent mouse pointer throughout the walkthrough. Show the navigation and click that opens each window; close completed windows before proceeding. Favor continuous workflow recordings over screenshot montages or unexplained cuts between windows.
- Keep setup grouped by its owning module. Finish Core account connection and Core Locations before moving to Craftworks settings.
- Morelord Game Master is not publicly available. Exclude that module, its dashboard, triggers, and product references from public demos. Demonstrate Lucky Finds by clicking it manually in the Craftworks dashboard.
- Keep narration focused on using the public product. Omit development history, former control labels, and behind-the-scenes demo inventory preparation.
- Do not create facecam videos for walkthrough sections. Animated intros and outros are allowed. Reuse suitable existing media and assess the cost before paid generation. The user explicitly authorized ElevenLabs animation for the Drakkenheim outro on September 21.

- Keep repeated player-roll demonstrations concise: show one representative player's roll per workflow, then the GM's aggregate results where useful. Resolve other players off-camera. Preserve multi-player sequences only when explicitly requested or approved; Day Two's sleep/exhaustion rolls are an explicit exception and must remain together.
- After a completed encounter in a campaign demo, include Morelord Craftworks harvesting and offer optional looting as sources of crafting materials. Explain that the GM can allow either or both. Show participating players claiming components in their own sessions, and connect ingredient highlights to that character's marked crafting recipes when applicable. Do not claim a recipe match that the actual results do not show.
- Use ElevenLabs-generated music for demo background music, rather than audio installed in Foundry. Keep music quiet beneath narration and use ambience appropriate to the demonstrated scene. For travel-to-encounter transitions, switch from travel ambience to battle music as the Encounters section begins. Check generation estimates before spending credits.
- Before generating new music, check existing approved intro/demo music for a suitable reusable track. Prefer reuse when it fits the scene.

- Use animated Chuck intros and outros, with narration over Foundry footage during the walkthrough. No walkthrough facecam videos or facecam overlays. Reuse suitable existing assets and synchronize Chuck's mouth movement to the approved intro or outro dialogue.

- Keep Chuck a little silly: use playful expressions, light comic timing, and small gestures while keeping approved dialogue unchanged.

- Chuck must always introduce himself with the exact words: "This is Chuck from Morelord Gaming."

- Use Demo1 for demo videos unless the user specifies a different world for that video. Record any world-specific choice in its brief and verify the world's users and prepared scenes before recording; do not assume Demo1's roster carries over. The Drakkenheim video's Demo2 requirement is recorded in its brief.
- Use Chuck as the default login, with no password (leave the password field blank).
- In narration, say "I'm logged in as the game master," rather than "I'm logged in as Chuck," to distinguish the GM role from a player. The actual account remains Chuck.
- The user authorizes logging in as any of the four demo users when needed: Darro, Snovlumi, Thalin, or Ubeeren. All four have no passwords; leave the password field blank.
- For demos involving GM-to-player requests, keep the GM and all participating players logged in concurrently in separate browser contexts or profiles with isolated cookies/storage. Verify each session's identity and show both GM and player perspectives; ordinary tabs sharing a login are not independent sessions.
- Before recording routed requests, check Core's Ignored Users list: an ignored recording account cannot send or receive module messages. Record and restore any temporary recording-specific setting changes.
- The user corrected the Marketplace demo login from Thalia to Thalin. Use Thalin; Demo1 has no Thalia account.

- Fit the entire wide Marketplace window in the video frame, including its header, filters, item list, and cart; keep Chuck clear of controls.
- Always show windows from the top: keep the top of the window, including its header, visible in the recording, and start each window demonstration with its content scrolled to the top before scrolling through it.
- Always show the same mouse pointer. Keep its appearance, size, and any cursor effects consistent across all recorded sections and in the assembled final video.

## Video documentation series

- The series narrator is Todd from Morelord Gaming: ElevenLabs Todd — Clear, Engaging and Educational (`g14YnDYCsy3k7XLlcKlO`). American male, upbeat and professional, enthusiastic about the product, with clear instructional delivery. This replaces the earlier unselected-voice status; no Chuck performance or facecam.

- Audit pauses by mouse/keyboard inactivity and meaningful UI progress. Animated backgrounds, blinking carets, and compression changes do not count as activity. Full-frame freeze detection alone is insufficient; inspect the edited timeline and directly verify known long holds, including dependency dialogs, before presenting a pacing revision.

- User-approved pacing correction: play the Core walkthrough footage at 1.25× its captured speed. This supersedes the normal-speed preference for this edit. Still trim long idle holds; keep generated narration clear and independently paced.

- Developer Mode and its Test Subscription Level control are owner-only tools. Exclude them from public video explanations and dedicated demonstrations, even when covering all settings.

- Keep idle pauses to no more than a few seconds (target three seconds). Trim waiting and preparation holds, including installation waits, while retaining real actions in their original order and at normal speed. Slow instruction means clear delivery and navigation, not prolonged inactivity. Do not combine rejected takes to fabricate a workflow.

- While New Install retains fresh module defaults, capture each module's settings as a separate asset for that module's later video. Do not append these recordings to Core. Explain modules without a standalone settings menu rather than inventing configuration steps.

- Record all settings explanations in New Install so viewers see the original defaults. Demonstrate only actions that require no additional prerequisites; otherwise explain the control without constructing supporting users, Scenes, or campaign data. For Core, explain Ignored Users without adding a user and create Phandalin as the example Location. Reserve Demo1 for subsequent practical workflows that need prepared data. This supersedes the earlier plan to move remaining settings recordings to Demo1.

- When the user needs to keep using the computer, capture Foundry in a background browser context. Do not bring recording windows to the foreground, move the desktop pointer, or use desktop screen capture. Native Firefox account recordings require a separate coordinated desktop session; background Foundry capture does not.

User direction, September 23, 2026. These rules apply to the module video documentation series and override conflicting campaign-demo defaults above.

- Start with Morelord Core, followed by Morelord Downtime. Prioritize other modules with missing or dated videos after reviewing their existing coverage; do not assume that review has already happened. Campaign Manager remains inactive.
- Core video documentation includes member onboarding and Discord: how members gain access and what they can do at each membership level. Use real test accounts for workflows that require actual account state. Use the newly created Gmail and Discord accounts designated by the user going forward; their identifiers and onboarding state are recorded in VIDEO-DOCS-CORE.md. They replace the previous test-account choice. Verify actual membership-to-role mappings and effective Discord permissions before scripting benefit claims. Foundry Developer Mode is not evidence of website membership or Discord access. Keep account identifiers and non-secret preparation state in the production brief; never store passwords, tokens, or recovery codes in documentation.
- Produce instructional video documentation: build the spoken scripts, align product documentation with the implemented behavior, then record.
- Begin Core's video on Foundry's Setup/home page: visibly install the modules for the series, launch the prepared world, show enabling modules and Foundry's required-dependency activation, then continue to Game Settings. Use this as the shared installation reference for later videos. Verify actual prompts and distinguish required dependencies from optional integrations; do not stage automatic activation by manually enabling dependencies beforehand.
- Use the user's clean Foundry server for the series' installation and initial settings setup, then return to Demo1 for the remainder of the videos. All installations use `http://localhost:31400`; verify the running installation and world rather than identifying them by URL alone. Preserve first-run states until capture. Record server/world identities in the brief and make the handoff clear; setup on one server/world does not automatically configure another.
- Use a generated narrator voice, with no Chuck performance, Chuck introduction/outro, or facecam. Voice selection is not yet established.
- Keep the delivery slow and concise. Explain one action at a time, make every mouse movement, click, and scroll clear, and leave time to read the resulting state. Concise wording must not remove necessary demonstrations or explanations.
- Cover every user-facing option and all applicable settings, including defaults, effects, saving, role/access restrictions, and conditional options. Maintain a source-backed coverage checklist in each video's brief. Separate user controls from internal storage and developer APIs.
- Present the actual spoken script for review before generating narration, as required above. Record only after the corresponding product documentation and script agree.
- Keep the existing visible-pointer, readable-window, continuous-navigation, and no-unrequested-overlays rules. Do not assume the campaign-demo music or illustrated-Chuck thumbnail format applies to this series.
- Verify the loaded world is Dev1 (`dev1`) before any in-Foundry testing under AGENTS.md. Demo1 remains the recording default; do not treat that recording preference as permission to run tests in another world or switch worlds for testing.

Exact speaking rate, chapter duration, export settings, and series artwork remain production choices to establish in the first video's brief.

- Graypes Compendium is unrelated to Morelord Gaming. Never discuss it or include it in Morelord video narration, module inventories, or demonstrations.
- For suite installation, search Morelord once and install directly from that filtered list. Scroll clearly between results; do not repeat a separate search for each module.

- When an installation take uses the wrong workflow, discard it and record the actual corrected installation from its starting state. Never splice separate searches or installations to imply a single continuous filtered-list workflow. The September 23 correction specifically requires one Morelord search followed by real scrolling and installation from that same list.

- Prepare unrelated/non-Morelord modules off-camera before recording Morelord activation. Pause capture for this preparation, close their startup notices, then resume with the Morelord modules disabled so their actual activation and dependencies can be demonstrated.

- For Google/Discord account authentication, let the user enter credentials directly with capture stopped. Google rejected the automation-controlled Chrome session during Core production; use normal supported-browser sign-in and verify a suitable recording method afterward. Do not assume an automated/incognito login will work or try to conceal automation from the identity provider.
