# Demo 04: Commissions and language training

Status: completed; voiceover-only video exported and checked.

Follow-up: the expanded segment with Darro's Craftworks recipe insert and repaired narration cut points is documented in `DEMO-04A-CRAFTWORKS-RECIPES-BRIEF.md`. Use that expanded output when assembling the campaign sequence; retain this original as the source.

## User requirements

- Demo1; user confirmed Thalin and Ubeeren (dictated as Fallon and Ubiran).
- Log in as Thalin with no password. Open Morelord Downtime before leaving Neverwinter. Owner defaults to Thalin; do not narrate choosing her.
- Create a Commission project owned by Thalin. Invented NPC contractor: Brynja Copperhand. Choose an available magic shield (prefer Shield +1), set Neverwinter as the contractor/collection location, and save.
- Explain that the commission progresses while Thalin is away, that Morelord Journeys automatically counts elapsed days toward the required labor, and that collection is in Neverwinter.
- Create a second project for Thalin to learn Common Sign Language from party member Ubeeren, with no location restriction. Save.
- Keep established full-window framing, pointer and fades. User explicitly requested Chuck voiceover with screen footage only for this segment: no facecam generation.

## Approved narration

Before we leave Neverwinter, Thalin has two projects to set up in Morelord Downtime.

First, she wants to commission a magic shield. We'll create a Commission project and name our NPC contractor Brynja Copperhand. We'll select a magic shield, set the location to Neverwinter, and save the project.

The work continues even while Thalin is away. As days advance in Morelord Journeys, those days automatically count toward the commission's required labor. Once it's ready, she'll need to return to Neverwinter to collect it. Sadly, magical shields don't come with roadside delivery.

Next, Thalin wants to learn Common Sign Language. We'll create a Training project and choose her party member Ubeeren as the instructor first. That determines which languages she can learn. Then we'll select Common Sign Language.

We won't assign a location to this project, so the training isn't tied to one settlement. We'll save it, ready for the party to spend downtime training together.

## Verified implementation and remaining preflight

- Commission editor calls the NPC a Contractor, not a Trainer. It records Owner, Contractor Name, Location, Total Labor (Days), and a compendium item. Start Commission saves the new project.
- Local commission code tracks elapsed days, sets collectionLocationId to the contractor location, and completes labor into awaiting-collection status. Journeys integration calls advanceDay; commissions do not consume Session hours.
- Character instructors must already know the proficiency and contribute training hours alongside the student. User has verified Ubeeren knows Common Sign Language. Select the instructor before selecting training. Do not change proficiencies to force the premise without reporting any mismatch.
- Verify the actual magic shield listing, its labor estimate, the Neverwinter record, and the live collection workflow. Do not advance campaign days, complete projects, or collect a shield merely to demonstrate their setup.

## Production result

- Output: `E:/.codex/visualizations/2026/09/16/01a0a870-de17-78e3-b6fa-8c28ce1cc0a6/demo04/Morelord-Demo-04-Downtime-and-Training.mp4`.
- Duration 68.92 seconds; 2560 × 1440, 25 fps, H.264/AAC; 0.4-second fades from/to black. Chuck narration only, no facecam.
- Recorded as Thalin in Demo1. Created Sentinel Shield commission with Brynja Copperhand, Neverwinter collection location, and automatically calculated 10 labor days. Created Common Sign Language training with Ubeeren selected first and no fixed location. Both projects saved once; no campaign days advanced or projects completed.
- Verified saved project data, instructor knowledge, full window framing, and sampled final video frames. Full output decode passed. Narration transcription and word timestamps informed the edit; auditory playback review was not performed. Collection behavior was checked in implementation, not exercised by completing the live commission.
- ElevenLabs flow `Sf7FBWFTp8uIuQxHnyQu`; voice `tkJUpzIGyhounepJIUDw`; model `eleven_v3`; speech node `EGN0K0wj3MpY17V1jgUR`. Selected take `40TkKoK0L6xkaAGmyxQf` (52.96 seconds). The service generated four default speech takes, totaling 3895.6104 credits (about $0.71). No paid video generation or correction retries.
- Production folder retains capture, before/after project snapshots, screenshots, narration, transcription, edit plan, and local render script. Do not rerun `record.cjs`: it creates the projects and requires the initial project list to be empty.
