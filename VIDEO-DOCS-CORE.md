# Morelord Core video documentation — production brief and script

Status: installation, initial account setup, Premium and Champion Discord working footage recorded. Test account is Champion. All remaining settings explanations stay in New Install to show defaults. Demonstrate only without added prerequisites; explain Ignored Users without creating accounts and create Phandalin as the example Location. Demo1 is reserved for later practical workflows. Generated narration, editing, and final QA remain pending. This user correction supersedes conflicting earlier Demo1 preparation notes below.
Source baseline: local Core 0.3.13, inspected September 23, 2026. Local implementation does not establish public availability.

## Series and production brief

Audience: GMs configuring Morelord modules; explain player-facing differences where applicable. Core first, Downtime next. Inventory the remaining active modules' existing videos before ranking missing/dated coverage. Campaign Manager is excluded.

User requirements: complete video documentation; scripts and corresponding product documentation before recording; generated voice; no Chuck or facecam; slow, concise narration; clear mouse movement, scrolling, and clicks; explanations of every applicable setting and user-facing option.

Proposed production defaults, not standing user requirements: calm neutral narrator at about 120–135 words per minute; no background music; readable 1080p capture; one chaptered video. Allow roughly 15–20 minutes including navigation and reading pauses, then derive the actual runtime from the approved performance and footage. Do not shorten actions to hit that estimate. Voice/model selection and sample remain outstanding.

For each action: name the target, move the pointer visibly, pause briefly, click once, and hold the result long enough to read. Scroll in small steps, stop fully before discussing a field, and keep window headers visible. Open dropdowns and hold all choices on screen. No pointer teleporting, time-compressed interactions, unrequested captions, overlays, or screenshot montages. Close finished windows visibly.

Narration is the blockquoted text below. Screen directions are not spoken. Approval must cover the actual spoken text before generating the performance, per DEMO-RECORDING-GUIDE.md. Any subsequently required wording change returns that passage to review.

## Preparation and verification

### Real member accounts and Discord coverage

User clarification, September 23: member access to Discord and what members can do at varying levels are part of Core documentation, beyond the Foundry Join Discord button.

- Designated test Gmail: `morelord.gaming@gmail.com`. Created by the user and reported unused as of September 23, 2026. Use this account going forward; Morelord Gaming registration and email verification remain pending.
- Designated test Discord username: `morelord_gaming`. Created by the user and reported unused as of September 23, 2026. Use this account going forward; server joining, website linking, membership assignment, and access verification remain pending. Use it as a regular member without owner, administrator, moderator, or unrelated roles that could mask the membership restrictions being demonstrated. Neither account has been accessed or configured by the assistant in this task. Preserve the fresh onboarding state for the planned walkthrough.
- Establish the actual member path: website registration/sign-in, any required verification, Discord joining, any account-linking/authorization step, membership recognition, role assignment, and the resulting member experience. Verify which steps actually exist before writing their narration.
- Build an evidence table for every offered membership level and the unlinked/new-member state: website membership, Discord roles, visible channels, read/post permissions, usable features, and any instructions or wait required for changes to take effect. Standard, Premium, and Champion are Core's current access labels; do not assume Discord uses identical names or grants matching benefits.
- Prefer one dedicated member account moved through legitimate test membership states if the supported test workflow permits it. Use additional accounts only where simultaneous states or reliable repeatability require them. Do not use Foundry's test-tier dropdown as a substitute for real Discord entitlements, or manual Discord role assignment as proof that member onboarding works.
- Capture each level from that member's own session. Demonstrate the actual available activities, not only a role badge or channel list. Include the verified upgrade/downgrade behavior and recovery path for missing access if supported. Do not invent timing guarantees or membership benefits.
- Record the starting state, approved test-membership mechanism, role synchronization outcome, and restoration steps. Account signup challenges, email verification, and any required interactive authentication must be completed through the normal account workflow; do not put credentials in this file.
- Keep verification messages and unrelated member conversations out of capture. Any demonstration that posts messages or interacts with other members needs an explicitly authorized destination and action before execution.
- Update the written Core guide with the verified membership/access table and member instructions before approving the expanded narration.

### Foundry and capture preparation

User-designated recording environments: a newly created, clean Foundry server is running for module installation and initial settings setup. The setup world is named **New Install**, and the user reports that no password is required. All Foundry installations use `http://localhost:31400`. The URL alone does not identify the running installation. Confirm the intended server and world before capture. The actual New Install world ID remains unverified; do not infer it from the display name. Use that server for the opening installation, world activation, dependency activation, first-run reporting notice, and initial Core settings/account setup. Do not install or configure it in advance of the planned capture and consume its fresh state.

After initial setup, return to the existing Demo1 world for the rest of the videos, including the prepared Location examples and subsequent module workflows. This replaces the earlier assumption that the opening setup would also be recorded in Demo1. Record each server's URL, world ID, Foundry/system/module versions, and completed shots in production notes once verified. Never copy credentials into these notes.

At the handoff, visibly establish that the recording has moved to Demo1 and confirm its prepared setup before continuing. Installation belongs to each Foundry server; module activation, Core account connections, and world settings are world-specific. Do not imply setup on the clean server automatically configures Demo1. Use Demo1's prepared configuration without repeating the complete installation lesson.

Proposed transition narration, for script review: “The installation and initial setup are complete. We'll now continue in our prepared Demo1 world for the practical walkthroughs. Each world has its own module activation, settings, and account connection.”

- Read DEMO-RECORDING-GUIDE.md and CORE-GM-PRODUCT-GUIDE.md when resuming.
- Before any in-Foundry testing, verify world ID `dev1`; otherwise skip tests without switching worlds. The clean-server and Demo1 recording assignments do not authorize regression tests in those worlds. Record the capture world and installed versions before production.
- Verify the installed capture build matches this script; enumerate additional capability types registered by enabled public modules. Resolve differences before narration generation.
- Use a clean GM session, a disposable example Location and Scene, and an observer account for Ignored Users. Avoid showing unpublished modules, real account details, account tokens, or unrelated campaign information. Complete credentials off-camera; preserve the visible navigation into and out of account approval.
- Do not opt a demo world into reporting. Show both controls, then leave both off when saving. Do not reset consent in an existing world just to recreate the first-run notice; capture that notice only in a suitable prepared world.
- Record and restore changed settings, location/Scene associations, and ignored-user choices. Delete only the disposable example Location. Use an unchanged export for the import demonstration.
- User requires background capture while they use the computer. Use a headless browser and its recorded pointer for remaining Foundry footage; do not foreground windows, use the desktop pointer, or run desktop capture. The standard recording world is Demo1 in E:/Foundry14Dev-Data. At this handoff, port 31400 still served New Install in E:/Foundry14Fresh-Data; requested the user switch servers gracefully. Prepared record-demo1.cjs by reusing the verified Foundry capture script with headless mode, Chuck login, and a demo1 world check. It has passed syntax checking but has not yet been launched.
- Verify account linking, refresh, and external destinations before recording, within the applicable world/testing rules. The temporary-code, expiry, and unavailable-service explanations do not require manufacturing error banners.
- Record a short pointer/audio/encoder test, finalize it, and inspect decoded frames before full capture. Store production media under `E:/.codex/visualizations/` unless the user designates another destination; this file is the repository planning source.
- Review the final timeline for readable controls, complete option coverage, natural narration joins, error-free footage, consistent pointer, and correctly paced actions. Add chapter timestamps only after editing.

## Coverage ledger

Foundry controls are source-reviewed and drafted; the installation interaction and member/Discord workflow require live verification. Final-video inspection remains pending for all rows.

| Surface / options | Chapter | Implementation evidence |
| --- | --- | --- |
| Setup installation of the series modules, world activation, automatic required dependencies, GM scope, six menu entries | 1 | Seven local module manifests; dependency prompts and public installation availability still to verify |
| Reporting notice: both choices, save, close without saving | 2 | TELEMETRY.md; scripts/services/telemetry-service.js |
| Not connected, Connect, pending approval, Reopen Approval Page, expiry, connected status | 3 | templates/connection.hbs; scripts/main.js activation handlers |
| Installation, Membership, Last validated, Offline access through; Refresh Access; Open Account | 3 | templates/connection.hbs; scripts/main.js |
| Website, feature usage, errors, Developer Mode, Standard/Premium/Champion, Save | 4 | templates/connection.hbs; scripts/main.js |
| Ignored user checked/unchecked, Save | 5 | templates/ignored-users.hbs; scripts/ui/ignored-users-app.js |
| Empty/create, plus, saved-location selection, Name, all seven settlement choices, Notes | 6 | templates/location-manager.hbs; scripts/location/location-manager-app.js |
| Add/remove capability; all eight built-in types; five tiers; Specialty; Source | 7 | scripts/main.js registry; scripts/location/location-domain.js |
| Scene filter, select/deselect, multiple selection, reassignment, Save/reopen, Delete/cancel/confirm | 8 | scripts/location/location-manager-app.js; scripts/location/location-service.js |
| Included modules/counts, Export, file chooser, Import, counts/reload, exclusions | 9 | templates/settings-transfer.hbs; scripts/services/settings-transfer.js |
| Troubleshooting download, Documentation sections, Discord | 10 | scripts/main.js; scripts/documentation/documentation-app.js |
| Real member onboarding, Discord joining/linking, every membership level's roles/channels/actions, access changes | New member chapter, before closing | Test accounts created; onboarding and website/server access inspection pending; not established by Foundry source |
| Disconnect/cancel/confirm, disconnected result, reconnect path | 11 | scripts/main.js disconnect handlers |

Scope boundary: internal credentials, caches, storage keys, shared CSS, routing APIs, and developer APIs are not user-configurable settings to teach. Visible Developer Mode is included. Shared roll prompts, actor selectors, and other components are demonstrated in the owning module's workflow; Core has no standalone roll-request launcher. Do not imply every Morelord package requires Core or an account.

## 1. Install the series modules, enable them, and open settings

User direction: installation is the first step. Start on Foundry's home/Setup page and install the modules for the series together, so later videos can refer back to this chapter. Then enter the world, show enabling modules and automatic required-dependency activation, and continue to Game Settings. Do not begin with modules already enabled.

Installation inventory: Core, Character Export, Craftworks, Downtime, Encounters, Journeys, and Marketplace, plus required socketlib. Campaign Manager remains inactive; do not include unpublished Game Master. Verify public availability before capture; local manifests do not establish downloadable public releases. Install the supported public builds without overwriting development working copies to stage this shot.

Local manifest dependency audit, September 23, 2026:

| Module | Required modules | Optional recommended integrations |
| --- | --- | --- |
| Core | socketlib 1.1.3+ | None declared |
| Craftworks | Core 0.3.10+, socketlib 1.1.3+ | None declared |
| Downtime | Core 0.3.10+ | Journeys, Craftworks, Marketplace |
| Encounters | Core 0.3.10+ | None declared |
| Journeys | Core 0.3.10+ | Encounters |
| Marketplace | Core 0.3.10+ | None declared |
| Character Export | None declared | None declared |


Use a compatible D&D 5e world for the suite; Core's broader Foundry baseline does not establish compatibility for every module. Recheck installed/public manifests before capture.

Screen sequence:

1. Start on Foundry Setup. Open Add-on Modules, then the installation dialog. Search for the first module or use its verified public manifest URL. Keep the product name and Install action readable; show completion and any required-package installation prompt.
2. Install every module in the inventory through visible navigation. Show each name and completion; retain deliberate movement without repeating the same explanatory narration seven times. Verify socketlib is installed. Do not invent catalog availability or skip a failed install in the final footage.
3. Open Worlds, launch the prepared compatible world, and log in as GM. Open Game Settings → Manage Modules. The target modules should initially be inactive in this prepared world.
4. Select Downtime first to demonstrate its required Core dependency and Core's socketlib dependency. Show Foundry's actual prompt/automatic selection and the resulting checked dependencies; verify exact behavior and labels before locking narration. Do not manually pre-enable them and describe that as automatic activation.
5. Select the remaining installed series modules explicitly. Explain that recommended integrations differ from required dependencies. Hold the completed selection list, save, and show the resulting reload if prompted.
6. Handle the reporting notice in chapter 2 if it appears on reload, then continue to Game Settings → Configure Settings → Module Settings → Morelord Core. If it appears here, do not postpone it artificially until after opening settings. Slowly show all six entries.

> We'll start by installing the Morelord modules from Foundry's Setup page. We'll install the tools for this series together, so you can use this chapter as the setup reference for the later guides.
>
> Open Add-on Modules, then Install Module. Find the module, check its name and compatibility, and select Install. If you're using a manifest address, paste the supplied address into the installation dialog. Complete any required-dependency installation prompt.
>
> We'll install Core, Character Export, Craftworks, Downtime, Encounters, Journeys, and Marketplace. Core also requires socketlib. Installing these packages makes them available to Foundry; enabling them is a separate step for each world.
>
> Return to Worlds and launch your compatible Dungeons and Dragons fifth-edition world. I'm logged in as the game master. Open Game Settings, then Manage Modules.
>
> Select Morelord Downtime. Foundry lists Core as a required dependency and the other Morelord integrations as optional. Socketlib is already enabled in this prepared world. Choose Activate, then check that the Morelord modules you want are selected. Enable Character Export separately.
>
> Now select the other Morelord modules we'll use in this series. Recommended integrations are optional; they are different from required dependencies. Installing the full set here prepares this world for the later walkthroughs. You can choose the modules you need for your own game.
>
> Save the module configuration and complete the reload if Foundry requests it.

After the reporting notice, continue:

> Open Game Settings, then Configure Settings. Under Module Settings, select Morelord Core. We'll work through its account controls, shared locations, configuration transfer, and support tools. Players do not configure these world settings, but they can use the Discord community link.

Installation narration is provisional until actual public package availability and dependency activation are verified. Later module videos should point to this chapter and begin with their own settings/workflows, repeating installation only if a module has a new prerequisite or changed setup.

## 2. First-run reporting preferences

Screen: capture the actual one-time notice if available in the prepared environment. Hold each checkbox and its explanation. Uncheck both, then save. Do not fabricate the notice if unavailable; resolve the missing shot before final production.

> On first setup, the game master may see Morelord Reporting Preferences. Feature usage and error reports are separate choices. Both start selected unless you've already saved a preference.
>
> Feature reporting describes product actions and software versions. Error reporting describes failures and Morelord code locations. Reports use a random world reporting identifier, so they are pseudonymous. They exclude campaign content and account credentials.
>
> Uncheck either option to decline it, then select Save Reporting Preferences. We'll leave both off in this recording world. Closing without saving leaves your preferences unchanged and offers the notice again at the next game-master session. You can change your choices later in Core Settings.

## 3. Connect and review an account

Screen: open Connect or Manage Account. Show Not connected and Connect Morelord Account. Show pending code and Reopen Approval Page, then approval on the website without exposing private account material. Return to the connected window. Pause over each status field; click Refresh Access and then Open Account, returning afterward.

> Select Connect or Manage Account. A connection lets supported Morelord modules recognize the access provided by your Morelord Gaming account in this world.
>
> Choose Connect Morelord Account. Core opens the website and displays a temporary code. Confirm the code matches, then choose Approve Foundry Connection on the website. Return to Foundry; Core checks for approval automatically.
>
> If the page did not open, use Reopen Approval Page and check your browser's pop-up settings. The code expires after fifteen minutes. Start a new connection attempt if it expires.
>
> Once connected, Installation identifies the connected world. Membership shows the recognized access level. Last validated shows the most recent successful check. Offline access through shows the server-provided expiration time.
>
> Refresh Access checks for account or membership changes. Open Account takes you to your account on the website. Core also checks access when a connected game master loads the world.
>
> During a temporary service interruption, cached access can remain usable through its expiration plus a seven-day grace period. After that, paid features may be unavailable until validation succeeds. Expired access does not delete your world data.

## 4. Every Core setting

Screen: scroll slowly to Core Settings. Pause at the website, each reporting checkbox, Developer Mode, and the open tier dropdown. Show disabled options as they actually appear. Demonstrate Standard with Developer Mode, save, then restore Developer Mode off and save. Both reports remain off. Do not claim a tier effect in another module without verifying it.

> The Morelord Gaming Website field controls where Core sends account activation and access checks. Normally, leave the default Morelord Gaming address in place.
>
> Share feature usage and Share error reports are the same independent reporting choices we saw earlier. Recent feature actions accompany error reports only when feature sharing is also enabled. Neither choice requires an account connection or changes your paid access.
>
> Enable Developer Mode is a testing control. It starts off. When enabled, it applies a subscription limit across Morelord modules and pauses reporting.
>
> Test Subscription Level offers Standard, Premium, and Champion. Standard disables paid access for testing. Higher choices are limited by the connected account and each module's actual access. Disabled choices cannot be selected. This control does not unlock a subscription you do not have.
>
> Select Save Core Settings to apply changes. Reopen other module windows to refresh their access displays. For normal play, we'll leave Developer Mode off.

## 5. Ignored Users

Screen: in New Install, open Select Ignored Users and show the existing unchecked Gamemaster and Chuck rows. Explain checking and saving without changing either user or adding an observer account. Close the window.

> Select Ignored Users excludes observer or recording accounts from Morelord user lists and routed messages. Check an account to ignore it, then Save.
>
> An ignored account cannot send or receive those module messages. Keep participating game masters and players included. To restore an account, clear its checkbox and save again. This does not delete the user or change their Foundry role.

## 6. Create a shared Location

Screen: open Manage Shared Locations in New Install. Show its empty state and Create First Location. Show blank name/notes and the default Road settlement type, then name the example Phandalin. Open all settlement choices, choose Village, and enter a short example note. Keep Phandalin as the walkthrough example.

> Shared Locations describe places that Journeys, Craftworks, Marketplace, and Downtime can use. Open Manage Shared Locations. Choose Create First Location, or use the plus button when locations already exist.
>
> Enter a name. Settlement Type offers Road, Hamlet, Village, Town, City, Metropolis, and Other. The population ranges beside the settlement names are suggestions. They do not set the location's capabilities.
>
> We'll choose Village. Notes provide space for game-master information about this location.

## 7. Capabilities and every field

Screen: Add Capability and show its defaults: Forge, Common, blank Specialty, and blank Source. Hold the full Type dropdown with all eight choices, then the Tier dropdown with all five. Retain Common for this example and enter Village smithy as Source. Explain optional Specialty without implying arbitrary text meets another module's requirements. Add and remove a second row to show those controls; no NPC, shop, recipe, or project is needed.

> Add Capability records a facility or service available here. Core includes Forge, Marketplace, Alchemist, Library, Temple, Contractor, Instructor, and Workshop. Enabled modules may add more choices.
>
> Choose the service type your activity needs. These entries describe what is available; adding Marketplace does not create a shop, and adding Instructor does not create an NPC or training project.
>
> Tier offers Common, Uncommon, Rare, Very Rare, and Legendary. A higher tier can meet a lower-tier requirement of the same type. A small settlement can have a powerful facility; settlement size and capability tier are independent.
>
> Specialty is optional. Use it when an activity requires a specific specialty, using the value that workflow expects. Source is also optional and records where the capability comes from, such as the village smithy.
>
> Add another row for another capability. Use its trash button to remove it. Save Location commits the edited list.

## 8. Scenes, saving, editing, and deletion

Screen: scroll to Associated Scenes. Explain filtering and selection using the existing default Scene list, without creating Scenes or assigning the default canvas to Phandalin. Save Location and show Phandalin in the list. Explain Delete, optionally opening its confirmation and cancelling; retain Phandalin. Explain reassignment/multiple selection without staging prerequisite Scenes.

> Associated Scenes connects Foundry Scenes to this shared location. Filter Scenes narrows the list by name. Click a Scene to select it, and click again to remove the selection. Several Scenes can belong to the same location.
>
> Clear the filter to see the full list. If a selected Scene already belongs to another location, saving moves that association here. The current Scene determines the location used by applicable workflows.
>
> Choose Save Location. The editor stays open. Select a saved location on the left to review or edit it. Save your changes before switching to another entry.
>
> Delete opens a confirmation. No keeps the location. Yes removes it, and projects or integrations referring to it may become unavailable. Its Foundry Scenes remain. We'll keep Phandalin for this example.

## 9. Export and import configuration

Screen: close Locations; open Export / Import Settings. Hold module counts and click Export Settings. Point to Settings File and explain Import Settings and its replacement/skip rules; do not import or reload merely to stage the explanation.

> Export and Import Settings transfers eligible configuration for enabled Morelord modules. The list shows which modules have settings to include and how many.
>
> Export Settings downloads a JSON file containing world configuration and preferences from this browser. Export your current settings before importing replacements.
>
> To restore configuration, choose the file under Settings File, then select Import Settings. Matching settings are replaced. Settings absent from the file stay unchanged. Missing or disabled modules and unknown settings are skipped. Enable the relevant modules before importing.
>
> Read the imported and skipped counts, then reload Foundry to refresh module views.
>
> This is not a world backup. It excludes account credentials, cached access, reporting preferences, campaign records, shared locations, and window positions. Actor and user references keep their original identifiers; they are not automatically matched to different records in another world.

## 10. Support and documentation

Screen: click Download Troubleshooting File and show successful download. Open account → Documentation; select both current sections, scroll deliberately, close. Close account; click Join Discord and show landing page without joining or posting on the user's behalf.

> Download Troubleshooting File saves a support report immediately. It includes software versions, browser and graphics details, and diagnostics supplied by supported Morelord modules. You do not need a connected account.
>
> The report excludes credentials and campaign content. Its filename includes the world identifier, so review the filename before sharing. Downloading does not upload the report or send a support request.
>
> For missing Craftworks components, save a report before Sync with Compendiums and another afterward. Recent diagnostic outcomes cover this browser session since reload, not a complete error history.
>
> The account window's Documentation button opens the built-in account and troubleshooting reference. The written GM guide provides the fuller settings and Locations reference.
>
> Join Discord opens the Morelord Gaming community for support, feature requests, and discussion. It is available to both game masters and players without connecting an account.

## 11. Disconnect and finish

Screen: return to the account window. Refresh Access to show Champion, then open Disconnect and choose No. Explain Yes without disconnecting the working example.

> To remove this world's account connection, choose Disconnect. No leaves it connected. Yes clears this world's account connection and cached access, without deleting its campaign content.
>
> You can reconnect with Connect Morelord Account. Other worlds have their own connections.
>
Closing narration will be rewritten after the member onboarding and Discord chapter is verified and scripted, so the final wrap-up includes that coverage.

## Member onboarding and Discord — chapter to develop

Place the member journey beside account setup in the final chapter order. Show the real website and Discord member sessions, with generated narration and the same deliberate pointer pacing as the Foundry walkthrough.

Sequence: new member/sign-in → verified joining/linking path → initial access → each offered membership level and its usable features → verified access-change/recovery workflow. Explain the distinction between opening the community invite from Foundry and obtaining membership-specific Discord access.

Spoken text is intentionally pending: the local Core implementation only establishes the invite button and Foundry account controls. It does not establish the Discord role mappings or membership benefits. This chapter must be completed before the full Core script is considered ready for approval or recording.

## Completion and outstanding work

- Foundry draft spoken text and source-backed control coverage: available for review. Full Core coverage is incomplete until member onboarding and Discord are verified and scripted.
- Written GM guide: updated for current settings, Locations, transfer, and support behavior.
- Built-in Documentation: currently only two sections; expansion remains a separate implementation decision. The script describes it accurately rather than claiming it contains this full guide.
- User approval of spoken script, generated voice selection/sample, capture environment verification, live walkthrough, recording, editing, and final inspection: pending.
- Existing-video inventory for modules after Downtime: pending; no priority claims made beyond the requested starting order.

## Recording capability probe — September 23, 2026

User authorized a short technical recording test. Confirmed `http://localhost:31400/setup` serves Foundry 14.368 and lists New Install. Stayed on Setup; no world was entered, no in-game tests ran, and no modules were installed or initial world settings changed. The clean installation already contains some third-party modules ; do not describe it as having zero installed packages.

Reused the established Playwright/Chrome recording approach and consistent white SVG pointer that follows actual automated mouse events. Captured Setup → Add-on Modules → Install Module dialog, with deliberate pointer movement and pauses. Dismissed the backup tour in the isolated recording browser before the delivered clip begins. No speech or music was generated.

The sandboxed attempt failed to finalize because the video encoder process could not spawn (EPERM). The same script succeeded with approved elevated execution. Use this verified permission context for production; do not assume sandboxed capture works. Raw capture finalized as WebM, then FFmpeg encoded a trimmed H.264 MP4, 1920×1080, 25 fps, 14.76 seconds, 2,305,841 bytes. Full MP4 decoding passed without errors. Inspected four decoded timeline frames: visible pointer, complete window headers, expected navigation, no visible error notifications in those samples. This is a technical capture proof, not full production QA or verification of installation/dependency behavior. Increase text size for the final instructional capture and verify again at that framing.

Artifacts: `E:/.codex/visualizations/2026/09/23/01a0cfb5-3381-7661-bed5-12c3e226828f/core-recording-probe/` contains `capture.cjs`, `probe.webm`, `recording-test.mp4`, `marks.json`, screenshots, and `decoded-contact-sheet.jpg`. The script and clip contain no account credentials. The recording context was closed after finalization.

Production corrections: Graypes Compendium is unrelated to Morelord Gaming and must never be discussed in this series. Exclude it from narration, suite inventories, and demonstrations. Search for Morelord once in the installation dialog, then install from that filtered list with deliberate scrolling; do not search separately for each module.

## Activation recording correction

User instructed: stop recording, enable every non-Morelord module off-camera, then resume recording to enable Morelord. Completed the preparation in New Install as Gamemaster with blank password: 12 other installed modules active, seven public Morelord tools inactive. Closed startup notices off-camera. Do not use the abandoned take of enabling unrelated modules.

The resumed activation shot opens the Settings sidebar, selects **Module Management**, searches **Morelord**, and checks **Morelord Downtime**. The actual Dependency Resolution dialog lists Core as required and Journeys, Encounters, Craftworks, and Marketplace as optional. socketlib is already enabled during background preparation, so it does not appear as an inactive dependency here. Select **Activate**, then enable Character Export explicitly, save with **Save Module Settings**, and complete the actual reload. Do not narrate socketlib becoming enabled in this shot. Its installation was shown earlier.

Foundry 14.368 labels the sidebar buttons **Game Settings** and **Module Management**. Use those visible labels in the final script rather than the older Configure Settings / Manage Modules wording where it differs.
User correction: Hero Mancer is unnecessary for these videos and must remain disabled. The user prepared the world and explicitly resumed module enablement. Before the clean retake, confirmed New Install / Gamemaster, Hero Mancer inactive, all seven Morelord tools inactive, and no open welcome windows. Reject the earlier interrupted enablement takes rather than patching around the popup.

## Installed release behavior observed during capture

Public catalog installed Core 0.3.13, Character Export 0.3.4, Craftworks 0.4.13, Downtime 0.1.1, Encounters 0.1.14, Journeys 0.3.6, Marketplace 0.9.8, and socketlib v1.1.4 on Foundry 14.368 / dnd5e 6.0.5. This records the environment, not a compatibility regression certification.

The installed Core 0.3.13 does not register telemetryNoticeVersion and did not display the one-time reporting notice. Its account window has Share feature usage and Share error reports, both initially unchecked in this recording world. The local development draft describing a newer first-run notice must not be narrated as part of this installed build. Record the settings as they exist. No reporting consent was enabled for the recording world.

Narration amendment for this installed build: “Core Settings contains two independent reporting choices: Share feature usage and Share error reports. Read the description beside each choice, then select Save Core Settings to apply your preferences. We'll leave both off in this recording world.” Omit the first-run-notice chapter from this cut unless the product is updated and the actual notice is separately recorded.

The clean activation retake is take 7. Takes 5 and 6 are rejected enablement attempts. Take 4 is the actual complete reinstallation with one unchanged Morelord search; take 2 is rejected and take 3 is off-camera reset work. Never splice take 2 into take 4 to simulate a different workflow.
## Current production handoff

Latest settings capture: user corrected the scope to keep every settings explanation in New Install and avoid creating prerequisites. Captured take 9 entirely in headless Chrome, without foreground windows or desktop mouse input. Showed unchecked existing Ignored Users; empty Locations; Phandalin creation with initial Road/blank defaults followed by Village, example notes, Common Forge, and Village smithy Source; capability add/remove; Scene picker with no associations; Save and Delete → No; configuration export and import explanation; troubleshooting download; built-in documentation; Refresh Access to Champion; Disconnect → No. Phandalin remains saved, both users remain included, and the account remains connected. No import, extra users, new Scenes, or regression tests were performed.

Take 9 finalized at about 437 seconds and passed full decoding. Nine timeline samples and individual UI screenshots inspected. Background capture includes the pointer and headers, but native select popup menus are not visible in sampled headless video; option lists must be explained accurately in narration, and any desired expanded-menu insert still needs a background-compatible capture method. Long preparation/reading holds need editing. This is working footage, not a final narrated video. Configuration export and diagnostics were saved locally in the production directory. No files were uploaded. Other module settings remain untouched for their own default-value recordings.

Selected footage, physical production directory `E:/.codex/visualizations/2026/09/23/01a0cfb5-3381-7661-bed5-12c3e226828f/core-install-production/`:

- `01-installation-continuous.mp4`: take 4, only leading pre-roll trimmed; actual continuous single-search installation with required and optional dependency prompts. Internal waiting time remains intact. No rejected-take footage inserted.
- `02-enablement-initial-settings.mp4`: take 7 from clean-enablement-start; Morelord activation, reload, Core settings navigation, website/reporting/developer controls, and Save Core Settings. Hero Mancer remained disabled. Both reports and Developer Mode saved off.
- Both are silent 1920×1080 H.264 working footage, rendered from 1600×900 browser captures. Full decode checks passed for both; decoded contact sheets inspected. These checks are not a claim of completed narration, final timeline QA, or comprehensive in-game regression testing.
- Capturing is stopped. The interactive Chrome account session is unrecorded and on Morelord Gaming's sign-in page. Asked the user to Continue with Google as the designated test account and stop at the account page before membership selection or Discord linking. Morelord uses Google/Discord identity providers and does not require a separate Morelord password.
- Next: finish account-registration/linking capture with passwords and verification off-camera, use the user-provided test promotion through the supported membership flow, verify access, then record remaining initial account settings. Keep the promotion out of public narration. Resume subsequent practical walkthroughs in Demo1 as instructed.
- No account password, OAuth token, or recovery code has been written to these notes. Authenticated browser state, if needed for resuming capture, stays in process memory.
Account sign-in blocker: the user supplied a Google “This browser or app may not be secure” screenshot from the automation-controlled account browser. No successful account login is established. Launched standard Chrome through its normal executable with only --new-window and the Morelord login URL, without automation or remote-debugging flags. User must complete sign-in there. Keep recording off. Do not repeat the blocked automated Google flow or try to disguise the automation. A normal-browser screen/window capture path must be checked before resuming website footage; the successful Playwright Foundry captures do not establish capture of this separate browser session.
User selected Firefox for account sign-in because existing Chrome sessions are in use. Opened a normal Firefox window and verified the title 'Sign in | Morelord Gaming — Mozilla Firefox'. Recording remains off; leave the user's Chrome sessions untouched. Normal-browser website capture remains to be verified before recording resumes.

Firefox sign-in resolved: the user completed authentication in Firefox Private Browsing. Verified Chuck Morelord and the designated test email on the account page, with Standard membership, zero premium entitlements, Discord not connected, and no authorized Foundry installations. Earlier sign-in blocker notes above are historical. Preserve this private window while producing account footage.

Account overview take 2 (`03-account-overview-take2.mp4`) begins at the verified page top and shows actual scrolling through membership, Discord connection, installation approval, and authorized installations. The 52-second silent capture passed full decoding; six sampled frames show a visible pointer and readable section content. Final pacing and full-timeline review remain outstanding.

Membership inspection: the annual plan view offers Standard free, Tools Premium at $55/year, and Tools Champion at $110/year. These are observed September 23 prices, not permanent script claims. Premium lists premium module features, Craftworks core-source packs, early releases, and Premium Discord channels. Champion additionally lists specialized Craftworks packs including Drakkenheim, priority support, development previews, and roadmap voting. These are website descriptions; effective Discord permissions remain unverified.

Off-camera test promotion: clicked Add promotion code in the Tools Premium annual checkout and applied the user-provided CHUCK_MORELORD code. Checkout displays 100% off, $0.00 per year and $0.00 due today. No payment details were entered. Automatic approval review rejected Subscribe because it establishes a recurring annual membership and promotion duration remains unverified. Requested explicit user approval; checkout has not been submitted and membership is still Standard. Do not use test-promotion screenshots or checkout preparation in public footage.

The user subsequently explicitly approved subscription creation. Clicked Subscribe once with the discount applied; checkout then required card number, expiration, security code, and name. Subscription completion is not established. Capture is stopped; requested that the user either complete payment entry privately or leave membership pending. Do not enter test card numbers into this checkout or claim Premium/developer access is active.

After the user completed checkout privately, verified Tools Premium / active on the account page, with renewal September 23, 2027. Website still displayed zero entitlements and a checkout-confirmation banner; do not claim the feature count has populated or that Champion/developer privileges are granted.

Connected New Install through Core's real activation flow. Entered its code in the signed-in Firefox account page and selected Approve Foundry Connection. Website confirmed approval and listed New Install (local). Foundry displayed Connected / Premium, validation timestamp, and offline-access expiry. Clicked Refresh Access and finalized take 8. Website approval footage is `04-approve-foundry.mp4` (24 seconds); full decoding passed and four sampled frames show code entry and successful approval. Take 8 marks identify connection navigation and the connected confirmation; long waiting spans need honest pacing edits. Reporting choices and Developer Mode remain off. No regression tests were run.

Draft narration addition: “If you use a different browser for your Morelord account, enter the code shown in Foundry into Activation code. Check the code, then select Approve Foundry Connection. Return to Foundry and wait for Connected. Review the membership and validation details. Refresh Access checks for updates.” Spoken approval and generated narration are still pending.

Discord onboarding verified September 23: the user completed identity authorization privately. Website showed Chuck Morelord / @morelord_gaming, initially not_in_server. Followed its server invite, continued in browser, and accepted as Chuck Morelord. Reviewed and acknowledged the server's ten community rules; the onboarding gate then disappeared. Returned to the account page and selected Synchronize roles; website reported synced and “Tools Premium roles are synchronized.” No chat messages were sent.

Member-side inspection: tool announcements, general discussion, installation help, module chat/bug/feature-request channels, premium-support and premium-previews became visible after joining/onboarding/synchronization. Opening premium-support succeeds, but its composer explicitly says “You do not have permission to send messages in this channel.” This blocks any narration claiming the Premium member can submit support there. Actual role badges and channel overrides still need diagnosis; website synchronization status alone does not establish effective permissions. Standard/Champion comparisons and developer access remain unverified. Do not change production server permissions as part of capture without establishing the intended policy.

Silent native captures `05-discord-join.mp4` and `06-discord-accept.mp4` saved the invite/browser handoff and acceptance, respectively; both passed full decoding. They remain working takes requiring visual timeline review. Identity authorization and rules acknowledgement were off-camera and must not be represented as recorded. Recording is stopped with the test account at premium-support.

Premium correction: user reported the server permission corrected and requested a new scroll-down capture, followed by a real Champion upgrade and its additional Discord access. Verified the test member now has an enabled Message #premium-support composer. Saved `07-premium-support-corrected.mp4`, 44 seconds, with the channel list starting at the top, actual scrolling to PREMIUM MEMBERS, and selection of premium-support. Full decoding passed and six sampled frames were inspected. The main pane already displays premium-support at the opening; do not describe this shot as first opening the channel. No message was entered or sent. This supersedes the prior Premium composer blocker.

Champion upgrade attempt: Choose Tools Champion on the signed-in membership page returned to Account without changing the subscription. Manage billing opened the existing Premium subscription portal, which offers Cancel subscription but no visible update/change-plan control. Requested user assistance to enable plan changes or switch the test membership. Did not cancel Premium, create a duplicate subscription, or claim Champion access. The billing portal confirmed the existing test discount applies to its next estimated renewal. Billing pages remained off-camera; do not include payment information in video assets. Champion capture remains pending the membership change.

Champion upgrade resolved: after the user enabled subscription changes, Manage billing offered Update subscription. Selected the annual Tools Champion plan, continued to its confirmation, and confirmed the user-requested upgrade at the displayed $0 yearly amount. Billing verified the existing subscription now Tools Champion, with the 100% test promotion retained and next estimated renewal $0 on September 23, 2027. No duplicate subscription was created. Account page showed Tools Champion / active; Synchronize roles reported Tools Champion roles synchronized. These billing operations were off-camera.

Verified additional member-visible Discord channels: champion-tavern, champion-support, champion-polls. Premium support and previews remain visible. Recording the three Champion channels as `08-champion-discord.mp4`; no messages or votes are submitted. Channel availability is not proof of every permission or voting workflow; verify the individual controls before claiming those features.

Champion capture completed: `08-champion-discord.mp4`, 44 seconds, 1600×900, silent H.264. Full decoding passed; six timeline samples show the continuous scroll and opening of champion-tavern, champion-support, and champion-polls, with visible pointer and readable channel headers. Each channel had an enabled message composer. All three were empty during inspection; an actual poll and voting workflow remain unverified. No messages, polls, or votes were submitted. Capture is stopped; the test account remains Champion and Discord is on champion-polls. Final narration and full timeline QA remain outstanding.

Draft Discord narration: “Link your Discord account from the Morelord account page. If you have not joined the server, follow its invite and complete the server's required onboarding. Return to your account page and select Synchronize roles. With Premium access, scroll to Premium Members for premium-support and premium-previews. Champion adds champion-tavern, champion-support, and champion-polls. Open the channel you need. After changing your subscription through Manage billing, synchronize roles again and check Discord for your updated access.” Do not imply that a live poll was demonstrated in this recording.

Champion capture completed: `08-champion-discord.mp4`, 44 seconds, 1600×900, silent H.264. Full decoding passed; six timeline samples show the continuous scroll and opening of champion-tavern, champion-support, and champion-polls, with visible pointer and readable channel headers. Each channel had an enabled message composer. All three were empty during inspection; an actual poll and voting workflow remain unverified. No messages, polls, or votes were submitted. Capture is stopped; the test account remains Champion and Discord is on champion-polls. Final narration and full timeline QA remain outstanding.

Draft Discord narration: “Link your Discord account from the Morelord account page. If you have not joined the server, follow its invite and complete the server's required onboarding. Return to your account page and select Synchronize roles. With Premium access, scroll to Premium Members for premium-support and premium-previews. Champion adds champion-tavern, champion-support, and champion-polls. Open the channel you need. After changing your subscription through Manage billing, synchronize roles again and check Discord for your updated access.” Do not imply that a live poll was demonstrated in this recording.

The retried `03-account-overview-native.mp4` finalized and decoded successfully, with actual scrolling visible in sampled frames. This remains a technical working take: the opening does not establish the full account-page header and the scroll holds do not yet frame each section adequately. Do not select it as finished documentation footage. Website membership, Discord linking, and Foundry approval remain unchanged and outstanding.

Normal Firefox page capture verified with an eight-second H.264 probe, full decoding and visual inspection. Capture uses the visible 1600×900 page region and native pointer, excluding browser chrome. Initial overview attempt failed to scroll and is rejected. User explained that they were moving the mouse outside the browser; retry with Firefox foreground and the pointer inside the page scrolled successfully. Leave the mouse untouched during automated native capture, and verify actual page movement before accepting footage. No credentials, promotion, Discord authorization, or account linking were recorded in these checks.

## Assembly review — September 23

The current clean narration source is `E:/.codex/visualizations/2026/09/23/01a0cfb5-3381-7661-bed5-12c3e226828f/core-assembly/core-narration.md`. It supersedes the historical spoken drafts above. Script approval and generated narration are pending. All settings remain in New Install; no first-run reporting notice or Demo1 transition is narrated. Every applicable Core settings control and choice is explained, including controls only discussed rather than executed.

`core-assembly/assemble.ps1` assembles the selected real takes into `core-rough-cut.mp4`, with chapter metadata and `edit-decision-list.json`. This is a silent editorial rough cut, not a final deliverable. Installation remains continuous from the actual single-search retake. Long activation waiting is trimmed; Discord acceptance ends before unrelated chat appears. Account authorization, onboarding and subscription operations completed privately are explained rather than presented as captured. No promotion or billing footage is included. Other-module settings assets remain separate.

Outstanding: approve exact narration; select/generated voice and synchronize its delivery; trim excess idle holds while retaining clear actions; inspect the complete final timeline, pointer consistency and notification areas. Standard-only Discord permissions and live poll voting were not verified and no corresponding feature demonstration is claimed. Native dropdown expansion is absent from headless footage; choices are explained in the narration. No product code, shared assets, or regression tests changed for this editing work.

Assembly result: `core-rough-cut.mp4` completed at 18:31.52, 1920×1080, 25 fps, silent H.264, approximately 102 MB. Full-file decoding passed. A twelve-frame chronological contact sheet was generated for coarse sequence review; this does not replace full visual QA. Narration has not been generated.

## Pacing revision

User requested pauses of only a few seconds, exclusion of owner-only Developer Mode, and 1.25× video playback. Removed Developer Mode and Test Subscription Level narration from the approval script. `trim-pauses.cjs` creates `core-review-1.25x.mp4` from the existing rough cut: shortens detected idle spans, omits the dedicated Developer Mode inspection, and applies 1.25× speed to visuals. Narration has not been generated or time-stretched. Source takes remain untouched. The correction does not authorize a fabricated installation workflow.

The new edit removes 133.36 seconds across 56 cut intervals before speed adjustment, targeting approximately 13:03. Native dropdowns and incidental Developer Mode labels may still be visible within wider account-window shots; they are not explained. Automated pause detection is a first pass, especially where the animated Foundry canvas prevents static-frame detection. Full visual pacing review remains required before final delivery.

User clarified the membership transition must be spoken explicitly because the subscription upgrade is not captured. Updated chapter 4 of the current narration script: identify Tools Premium as the starting plan; explain Manage billing → Update subscription → Tools Champion → review terms → confirm; verify active Champion, synchronize roles and return to Discord. State that the upgrade occurs between the two recorded Discord views. Do not imply Premium itself grants Champion channels.

Paced review export completed and passed full decode: `core-review-1.25x.mp4`, 13:02.52. Narration remains pending approval and generation.

Membership wording correction: Standard is the initial free membership. Premium was deliberately selected for this walkthrough, not the default or required starting plan. Members can upgrade or downgrade at any time through Manage billing → Update subscription; review the displayed terms and effective date. Current narration chapters 3 and 4 now make this explicit. This supersedes earlier wording describing Premium as the starting plan.

## Second pause correction

The first automatic trim was insufficient. User specifically identified the Downtime installation dependency dialog and later mouse/keyboard inactivity in-world. Reviewed the entire 13:02.52 cut as a timestamped four-second contact sheet, identified long idle intervals directly, and used targeted window analysis as supplementary evidence. Animated backgrounds are one source of missed holds, but not an explanation for all missed installation pauses.

`tighten-reviewed-pauses.cjs` and `reviewed-pause-cuts.json` record the new edit against `core-review-1.25x.mp4`. Keep real actions and meaningful results; do not count background animation, blinking carets, or compression changes as useful activity. Maintain the already-applied 1.25× rate. The second pass removes approximately 305.96 additional seconds and targets 7:56.56; final render review is pending. This is still a silent picture edit, and narration synchronization is outstanding.

User requested that the public narration encourage GMs to enable Share feature usage and Share error reports. Updated the approval script to recommend both, explain their purposes and independent optional status, and describe fresh-install defaults accurately. Removed the spoken statement that we will leave both off. Recorded settings remain off; do not falsely describe an on-screen enablement or silently change reporting consent for the recording world.

## Reporting default mismatch — verified source comparison

User confirmed both reporting choices are intended to default on. The recording installation at `E:/Foundry14Fresh-Data/Data/modules/morelord-core` is version 0.3.13. Its telemetry service registers `shareErrorReports` with false, and its account view renders feature usage as `telemetryConsentVersion === 1 && shareUsageStatistics` despite the underlying usage default being true. Current Core development source already registers errors true and renders usage directly; the reporting notice reads these choices. No product code was changed for this finding.

Removed the incorrect blanket “both default off” narration. Recommend both optional reporting controls. The captured off-state should not be presented as intended fresh defaults. Replacement reporting footage matching the intended build remains necessary before final delivery; do not silently enable reporting, alter installed files, or publish a release merely to hide this discrepancy.

Latest reporting direction: for this video, recommend enabling Share feature usage and Share error reports and omit any claim about their defaults. This supersedes the requirement above to replace the reporting shot solely because of the default mismatch. Keep the existing footage and describe the options without claiming they were enabled on screen. No release or settings changes are required for this narration adjustment.

## User-selected endpoint

User requested the video end at 7:16. Export `core-review-7m16s.mp4` from the tightened review, retaining 00:00 through 07:16 only. Keep source footage and narration draft available; final voice alignment must respect this selected endpoint. This supersedes the 7:56.56 picture-edit duration. No other timing or setting changes are requested in this revision.

## Narrator shortlist

User direction: American male, upbeat but professional, excited about the product. ElevenLabs library search returned Todd - Clear, Engaging and Educational (`g14YnDYCsy3k7XLlcKlO`) as the strongest descriptive match for tech tutorials, with Charismatic Chris - Midwest Millennial (`UPlXPHEQFgDFTFd0qJ9R`) as a warmer, lively alternative. Recommend Todd provisionally based on library descriptions; supplied existing previews for audition. No custom speech generated or credits spent. Keep enthusiasm conversational and instructional.

## Todd narration approval

User selected Todd and authorized the presenter identity Todd from Morelord Gaming. Voice: ElevenLabs Todd - Clear, Engaging and Educational, `g14YnDYCsy3k7XLlcKlO`; American male, upbeat, professional, product enthusiasm with clear instructional pacing. No Chuck or facecam.

Current approval document: `core-assembly/core-script-for-approval.md`; exact spoken text: `core-assembly/core-spoken-script.txt`. Earlier narration drafts are superseded. Includes Todd introduction/outro, every applicable public Core control, Standard as free initial membership, Premium selected for this demonstration, upgrades/downgrades and the off-camera Champion transition, recommendation for both reporting choices without default claims, and no Developer Mode explanation. Corrected the unsupported claim that this world has no Scenes: the example leaves Scenes unassigned.

User explicitly resolved the timing conflict: keep full coverage and allow a longer narrated video with no long silent pauses. The 7:16 source endpoint remains; it is no longer a final narrated runtime cap. Retiming visuals must support clear spoken explanations without restoring unproductive silence or fabricating actions. Exact script approval remains pending; no speech generated.
