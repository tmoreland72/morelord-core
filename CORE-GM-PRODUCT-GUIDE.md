# Morelord Core: GM Product Guide

## Documentation

**Documentation** opens the corresponding module's documentation on the Morelord Gaming website in a new browser tab. Use the website's module tree and nested section links to navigate the complete guides. Modules without a dedicated website page open the documentation index.

Every player and GM page, including module Game Settings, must document each field and action using its displayed label, accepted values, defaults, dependencies, and effects. Examples belong in the guide.

Morelord Core provides shared account access, Locations, user participation controls, settings transfer, and support tools for Morelord Gaming modules. Supported Morelord Tools modules use its account connection to check which premium features are available in the world.

Reviewed against local Core 0.3.13 on September 23, 2026. This implementation review is not a new compatibility test or public-release announcement.

Recording check: the public Core 0.3.13 package installed from Foundry's catalog does not include the one-time reporting notice described below from the development worktree. In that package, open **Connect or Manage Account → Core Settings** to choose reporting preferences directly. The video documentation must follow the installed package's actual controls.

This guide is for Game Masters. Players can change their own **Token Distance Indicator** preference in Module Settings; they do not need to configure account access. **Reaction Used** is a world setting changed by a GM.

## What Morelord Core Does

Morelord Core provides one shared account connection for supported Morelord Tools modules. From Foundry, a GM can:

- Connect the current world to a Morelord Gaming account.
- Review the membership level recognized for the world.
- Refresh premium access after an account or membership change.
- Open the Morelord Gaming account page.
- Disconnect the world from the account.

Morelord Core does not remove existing world data if premium access expires.

### Select, move, and delete sidebar documents

GMs can use **Select multiple** in Scenes, Actors, Items, Journal, Rollable Tables, Cards, Macros, and Playlists, including their pop-out directories. Core must be enabled; account linking and premium access are not required. Selection starts empty and is kept separately for each directory window.

- **Select multiple** shows a labeled checkbox as the leftmost control on each world document. Actor, item, roll table, macro, and card checkboxes sit to the left of the thumbnail. The portrait stays to the right of the checkbox, including when a compact directory style absolutely positions that portrait. Journal checkboxes sit to the left of the name, and a row without a portrait does not keep extra space before the name. Playlist checkboxes sit at the left of the playlist header, before the expand control and the playlist name. Scene checkboxes sit on the upper left of the scene card. The checkbox matches Foundry's flat checkbox. Checking a box does not open the document, activate the scene, or expand the playlist, even when another module listens for clicks on that row. Check or uncheck individual documents. Shift-click checks or unchecks every currently visible entry from the last clicked checkbox through the one just clicked; entries hidden by search or a collapsed folder are not added by that range. Opening and dragging a row still work from the name or thumbnail.
- **Select visible** adds all currently displayed entries, respecting the current search and collapsed folders. Previously selected entries stay selected even when hidden by a later search or folder collapse.
- **Clear selection** unchecks every selected document, including hidden entries.
- **Move selected (N)** is disabled when its label is **Move selected (0)** and while a move or deletion is pending. With one or more documents selected, the label shows that count. Choosing it opens a dialog titled **Move N selected documents**, or **Move 1 selected document** when one document is selected. The dialog lists those document names and a **Destination folder** selector. **Root (no folder)** is the first choice. The other choices are that directory's folders, sorted as paths such as `Parent / Child`. **Cancel** is the default and changes nothing. **Move selected** sets the folder on every selected document that still exists, through Foundry's native document API. Documents already in the chosen folder are included and remain there. The selection stays checked. Folders themselves are not moved or deleted. Core then shows an info notification: `Moved 2 documents to Parent / Child.`, `Moved 1 document to Root (no folder).`, or `No selected documents remain to move.` A failed update shows an error notification and keeps the selection.
- **Delete selected (N)** opens a confirmation listing the selected document names. It is disabled with no selection and while confirmation, a move, or deletion is pending. **Cancel**, the default confirmation action, keeps the documents and selection. **Delete selected** in the confirmation permanently deletes the listed documents through Foundry's native document API. There is no undo; native deletion effects apply, including a document's embedded content. Folders are kept.
- **Done selecting** exits selection mode and clears selection.

For example, search the Actors directory for a batch's common name, choose **Select multiple → Select visible**, then **Move selected (N)** and choose `Cities / Neverwinter`. Choose **Move selected (N)** again and **Root (no folder)** to return them. To remove them instead, review **Delete selected (N)**, then confirm. Selection survives directory rerenders but resets when the client reloads. Only world documents are included: compendium packs, chat messages, combat entries, journal pages, and individual playlist sounds are outside this directory action.

### Token Distance Indicator

**Token Distance Indicator** accepts checked (enabled) or unchecked (disabled), defaults to checked, and applies only to the current user's client. Choose **Save Core Settings** to apply it in **Connect or Manage Account → Core Settings**, or change the same checkbox directly in **Game Settings → Configure Settings → Morelord Core**. Players use that settings checkbox. No account connection or premium access is required. Disable it when using another distance indicator such as TheRipper's Hover Distance to avoid duplicate displays.

Select exactly one token, then hover over another visible token to see distance between their nearest occupied spaces using native grid/diagonal rules. Adjacent tokens show 5 ft on feet-based scenes, and distances round up to 5-unit intervals in the scene's units. Token size does not add extra center-to-center distance. Gridless scenes measure nearest footprint edges with a half-space allowance for adjacency. Players can instead hover without selecting: Core uses their assigned character's token if exactly one owned, visible token exists. Multiple selections, ambiguous character tokens, and hovering the source itself show nothing. The indicator measures flat map distance without elevation, walls, reach, or movement costs; it never exposes hidden or unseen tokens to players.

### Reaction Used

**Reaction Used** accepts checked (enabled) or unchecked (disabled), defaults to checked, and applies to the whole world. Only a GM can change it. Choose **Save Core Settings** to apply it in **Connect or Manage Account → Core Settings**, or change the same checkbox in **Game Settings → Configure Settings → Morelord Core**. No account connection or premium access is required. Automatic marking listens for a D&D 5e activity whose activation type is reaction.

While **Reaction Used** is checked, a creature in a started combat that uses such an activity is marked on its token. In the right-click token HUD status effects the status is labeled **Reaction**, so the name fits the grid. Anyone allowed to update that token can toggle **Reaction** there, including for an opportunity attack, a readied action, or a mark that should not stay on. The active GM removes the mark when that creature's turn starts. When the turn is a shared mob turn from Morelord Encounters, the active GM removes it from every token in that mob on the scene. When combat is deleted, ends, or the round returns to 0, the active GM removes it from tokens on that combat's scene. A player client, and a GM who is not the active GM, does not clear marks. Unchecking **Reaction Used** stops automatic marking and clearing. The status remains on the token HUD for manual use.

### Morelord Tools

**Morelord Tools** is a button on the left scene controls. Its icon is a sharp crown. It is shown to the current user only when at least one Morelord tool is visible to that user, and it is hidden when none are. Players and GMs use the same control. Choosing **Morelord Tools** opens its tool palette and leaves **Morelord Tools** selected. Choosing a tool runs that tool and does not switch the scene controls back to Tokens.

The tools are listed alphabetically by title, ignoring capitalization and a leading Morelord prefix. The button labels stay as registered, so **Morelord Craftworks** still reads **Morelord Craftworks**. With **Morelord Craftworks**, **Morelord Downtime**, **Morelord Encounters**, **Morelord Journeys**, **Manage Marketplace Shops**, and **Morelord Marketplace**, that is the palette order. A GM also sees a first entry labeled **Morelord Modules**, with an info icon. It stays selected. Choosing **Morelord Modules** opens a window of the same name. Players do not see **Morelord Modules**, and the window does not open for them. Players still see the other tools, including **Morelord Craftworks**, **Morelord Downtime**, and **Morelord Marketplace**. Choosing **Morelord Tools** still only opens the column, and choosing one of those tools leaves **Morelord Tools** selected. The window says "Each module shows whether it is active, installed but inactive, or not installed in this world." It lists **Morelord Core**, **Morelord Journeys**, **Morelord Encounters**, **Morelord Character Export**, **Morelord Craftworks**, **Morelord Marketplace**, **Morelord Downtime**, and **Morelord Game Master**. Each row shows that module's icon, name, one-line description, and one status: **Active**, **Installed but inactive**, or **Not installed**. **Documentation** opens the Morelord Gaming documentation index in a new browser tab. A module that is **Not installed** also has **Learn more**, which opens its Morelord Gaming tools page in a new browser tab. **Morelord Game Master** has no tools page, so **Learn more** opens its GitHub repository instead. **Support** contains **Get support**, which opens the Morelord Gaming Discord server, **Morelord Gaming**, which opens morelordgaming.com, and **YouTube**, which opens the Morelord Gaming channel. Choosing the crown does not open this window or a tool window. Core does not put **Connect or Manage Account** or the Game Master tray in this palette. The other entries come from the other Morelord modules. There is no Game Settings field for this control, and it does not require a Morelord account.

## Requirements

- Foundry Virtual Tabletop 13 or later, within the installed manifest's supported range. The reviewed manifest records 14.368 as verified; this guide does not establish additional version testing.
- socketlib version 1.1.3 or later.
- Permission to configure the world as a GM.
- A Morelord Gaming account for account linking. Shared Locations, reporting preferences, and troubleshooting do not require an account connection.
- Internet access for the initial connection and periodic access checks.

## Install and Enable Morelord Core

1. From Foundry's **Setup** screen, open **Add-on Modules**.
2. Select **Install Module**, find **Morelord Core**, and install it. Complete the required dependency installation for **socketlib** if prompted. If you are installing by manifest URL, use:

   `https://raw.githubusercontent.com/tmoreland72/morelord-core/main/module.json`

3. Install the other Morelord Gaming modules you intend to use from the same Setup page, checking each package's compatibility and dependencies. Installation makes packages available to Foundry; activation is separate for each world.
4. Launch the compatible world you want to connect and log in as a GM.
5. Open the **Settings sidebar → Module Management** (Foundry 14).
6. Enable the desired modules and accept Foundry's required-dependency activation when offered. Verify **Morelord Core** and **socketlib** are enabled for modules that require them. For example, Downtime requires Core, and Core requires socketlib. Recommended integrations are optional and are not the same as required dependencies.
7. Save the module configuration and complete any requested reload. Handle the reporting-preferences notice if it appears, then open **Game Settings → Configure Settings → Module Settings → Morelord Core**.

The Core video is a concise options reference for GMs already familiar with Foundry. It focuses on Morelord-specific choices and their effects; these installation steps remain available as a written reference. A complete suite installation is not required to use Core. Character Export does not declare Core as a required dependency in its reviewed local manifest.

<div class="docs-video">
	<iframe
		src="https://www.youtube-nocookie.com/embed/2advzIa3o9Q"
		title="Morelord Core demo"
		loading="lazy"
		allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
		allowfullscreen
	></iframe>
</div>

The account connection applies to the current world. Repeat the connection process in each world that should use your Morelord Gaming access.

## Connect a Morelord Gaming Account

1. Open **Game Settings → Configure Settings → Module Settings → Morelord Core**.
2. Select **Connect or Manage Account**.
3. In the **Morelord Account** window, select **Connect Morelord Account**.
4. Foundry opens the Morelord Gaming approval page in your browser. The **Morelord Account** window shows the temporary code in large type at the top of the pending view.
5. It should already be filled in on that page; if not, paste it.
   Select **Copy** to put the code on the clipboard. If copying is unavailable, select the code itself and copy it manually.
   If you signed in using a different browser, open your Morelord Gaming account page there and paste the code into **Activation code**.
6. On the website, select **Approve Foundry Connection**.
7. Return to Foundry. Foundry checks for approval automatically and reports when the account is connected.

While approval is pending, the window provides:

- **Copy:** Copies the temporary code. If the browser cannot access the clipboard, select the code and copy it manually.
- **Open approval page:** Opens the same approval address Foundry uses when it tries to open the page automatically, including when that page was blocked.

The temporary code expires after 15 minutes. If it expires or activation fails, start the connection process again to create a new code.

If the browser page does not open, select **Open approval page**. Check your browser's pop-up settings if you want the page to open automatically next time.

## Review Account and Access Status

### Connect Discord from the website

On your Morelord Gaming account page, select **Connect Discord** and authorize the Discord account you intend to use. Linking an identity does not automatically join the community server. If the page reports that you are not in the server, follow **Join the Morelord Gaming Discord**, accept the invite, and complete Discord's required server onboarding.

Return to the Morelord Gaming account page and select **Synchronize roles**. Review its status, then check your channel access in Discord. A successful synchronization message does not by itself prove that every channel permission is configured correctly. If a channel reports that you cannot send messages, include that channel and the synchronization status when reporting the access problem.

### Membership changes and Discord channels

Use **Manage billing → Update subscription** on your website account to select a different plan. Review the price and billing terms before confirming. After the website shows your updated membership, select **Synchronize roles** and return to Discord.

The September 23 member walkthrough verified Premium channels **premium-support** and **premium-previews**. Champion retained those channels and added **champion-tavern**, **champion-support**, and **champion-polls**. The corrected Premium support composer and all three Champion composers were enabled. A live poll was not available, so voting behavior was not verified. Channel access depends on the synchronized membership and the server's current permissions.

### Foundry connection details

Open **Game Settings → Configure Settings → Module Settings → Morelord Core → Connect or Manage Account**.

When connected, the **Morelord Account** window shows:

- **Installation:** The Foundry world associated with the connection.
- **Membership:** The access level currently recognized for the world.
- **Last validated:** When Foundry last confirmed access with Morelord Gaming.
- **Offline access through:** The expiration time returned by the latest successful access check.

The window also provides three actions:

- **Refresh Access:** Checks Morelord Gaming for current membership and feature access.
- **Open Account:** Opens your Morelord Gaming account page in a browser.
- **Disconnect:** Removes the Morelord Gaming account connection and locally cached access information from this world.

## Refresh Access

Morelord Core checks access automatically when a connected GM loads the world. Use **Refresh Access** when:

- You changed your Morelord Gaming membership.
- You connected or updated a supported Morelord Tools product.
- A premium feature does not reflect a recent account change.
- You want to confirm the most recent validation time.

If Morelord Gaming cannot be reached, Foundry may continue using recently cached access. A warning explains when cached premium access remains available.

## Offline Access and Expiration

After a successful access check, Morelord Core stores an access result for use during temporary service or network interruptions. Cached access remains usable through the server-provided expiration time plus a seven-day offline grace period.

After cached access is no longer usable, premium features may be unavailable until Morelord Core successfully validates access again. Existing actors, items, campaign information, and other world data are not deleted when access expires.

## Disconnect a World

1. Open the **Morelord Account** window.
2. Select **Disconnect**.
3. Confirm **Disconnect Morelord Account**.

Disconnecting clears the account token, installation reference, connection label, and cached access information stored by Morelord Core in the current world. It does not delete existing world content. You can reconnect later by completing the approval process again.

## Core Settings and Reporting Preferences

**Token Distance Indicator** and **Reaction Used** are documented above under What Morelord Core Does. Change either checkbox here with **Save Core Settings**, or in **Game Settings → Configure Settings → Morelord Core**. **Token Distance Indicator** applies only to the current user, including players. **Reaction Used** is a world setting changed by a GM.

Open **Connect or Manage Account**, then scroll to **Core Settings**. These controls are available without connecting an account. Use **Save Core Settings** to apply changes.

| Control | Meaning |
| --- | --- |
| Morelord Gaming Website | Address for activation and access checks. Default: `https://morelordgaming.com`. Keep it unless intentionally using another supported endpoint. |
| Share feature usage | Shares feature actions, active module versions, Foundry/system versions, and GM/player role under a random world reporting ID. Reports are pseudonymous and exclude campaign content. |
| Share error reports | Independently shares error types, Morelord code locations, failed operations, and versions. Recent feature actions accompany errors only when feature sharing is enabled. Custom error text and account credentials are excluded. |
| Enable Developer Mode | Off by default. Limits access for testing across Morelord Gaming modules and pauses both reporting streams. It does not grant paid access. |
| Test Subscription Level | Standard, Premium, or Champion, capped by the connected account and each module's actual access. Default: Standard. Applies while Developer Mode is enabled; Standard disables paid access. Unavailable higher choices are disabled. Reopen module windows after saving to refresh displays. |

The elected active GM receives a one-time **Morelord Reporting Preferences** notice. Both reporting choices are preselected unless a previous choice was saved. Uncheck either to opt out, then choose **Save Reporting Preferences**. Closing without saving leaves preferences unchanged and offers the notice at the next GM session. Existing version-only consent does not automatically authorize broader reporting. Change either choice later in Core Settings without affecting account linking or premium access.

Account activation separately supplies world and installation information needed to approve and label that connection. See [TELEMETRY.md](TELEMETRY.md) for reporting details.

## Ignored Users

Open **Morelord Core → Select Ignored Users**. Check recording or observer accounts to exclude them, then select **Save**. Uncheck and save to include them again. Ignored accounts cannot send or receive routed Morelord Gaming module messages; do not ignore participating GMs or players. This does not delete users or change their Foundry role.

Characters assigned to or owned only by ignored users are also excluded from shared character selections, including party-group members. Characters shared with a non-ignored player remain available, even if that player is offline. GM-managed party members without a player owner or assigned user remain available. Reopen a selection window after changing Ignored Users to refresh its options; existing stored participation records are preserved.

## Shared Locations

Shared Locations give Morelord Gaming modules a common description of a place. Downtime uses location information to expose available activities, while Craftworks can check crafting location requirements such as access to a forge. Marketplace and Journeys also use shared locations for their own workflows. Configure capabilities to describe the facilities those workflows need; creating a location record alone does not create the services or activities themselves. The individual module guides explain their uses in detail.

Open **Morelord Core → Manage Shared Locations**. Choose **Create First Location** when empty, or the plus button to add another. Select a saved location in the left list to edit it.

![New shared location named Phandalin, with settlement type Village and a Forge capability set to Common.](/images/foundry/core-locations.png)

Enter a **Name**, **Settlement Type**, and optional GM-facing **Notes**. Settlement choices are Road, Hamlet (1–100 people), Village (101–1,000), Town (1,001–6,000), City (6,001–25,000), Metropolis (25,001+), and Other. Population ranges are suggestions, not enforced limits.

Choose **Add Capability** for each service the location provides. Core registers Forge, Marketplace, Alchemist, Library, Temple, Contractor, Instructor, and Workshop; enabled integrations can register additional types. A capability describes facilities or services; it does not create a shop, NPC, recipe, or project.

Each row has a **Type**, **Tier**, optional **Specialty**, optional **Source**, and a remove button. Tiers are Common, Uncommon, Rare, Very Rare, and Legendary. A higher tier satisfies a lower-tier requirement of the same type. Settlement size does not determine tier. Specialty can match a specific requirement; use the value expected by the consuming workflow. Source records where the capability comes from. Remove a row with its trash button, then save.

Under **Associated Scenes**, use **Filter Scenes** to find names. Click a Scene to select it; click again to deselect it. Several Scenes can share a location. Clearing the filter reveals the full list. Saving an association already owned by another location moves that association to the newly saved location. The current Scene determines the shared location used by applicable workflows.

Choose **Save Location** to persist changes; the editor stays open. Reopen a saved entry to review it. Save edits before selecting another location. Journeys, Craftworks, Marketplace, and Downtime can consume these records.

**Delete** asks for confirmation. Choose **No** to keep the record. Choosing **Yes** removes the location; projects and integrations referring to it may become unavailable. Deleting a location does not delete its Foundry Scenes.

## Export and Import Settings

Open **Morelord Core → Export / Import Settings**. The list shows enabled modules with eligible settings and their counts. **Export Settings** downloads `morelord-settings.json`, including eligible world settings and preferences from the current browser.

![Settings transfer listing enabled Morelord modules, with Export Settings and Import Settings.](/images/foundry/core-settings-transfer.png)

To import, enable the relevant modules, choose a JSON file under **Settings File**, then select **Import Settings**. Matching settings are replaced; settings absent from the file remain unchanged. Missing or disabled modules and unknown settings are skipped. Review the imported/skipped counts and reload Foundry to refresh module views. Export your current configuration before replacing it.

This is configuration transfer, not a world backup. Credentials, access caches, reporting preferences/credentials, shops, shared Locations, active journeys, downtime projects, and window positions are excluded. Actor/user references retain their IDs and are not remapped between worlds. Files are validated before writing. A failed write triggers an attempt to restore previous values; restoration failures are reported.

## Documentation and Community

The account window's **Documentation** button opens Core's built-in reference, currently containing Morelord Account and Troubleshooting sections. This GM guide provides the fuller reference for configuration and shared Locations.

**Morelord Core → Join Discord** opens the Morelord Gaming Discord community for support, feature requests, and discussion. GMs and players can use it without an account connection.

The Foundry button opens the community invite; it does not itself link a Discord identity or assign membership roles. The verified Premium and Champion channel access is described above. An isolated Standard permission comparison and live poll voting remain unverified. Foundry Developer Mode does not establish Discord access.

## Troubleshooting

Select **Morelord Core → Download Troubleshooting File** to download a JSON report immediately. No account connection is required. It includes Foundry, game-system, module, browser, display, graphics, and supported module diagnostic details. It excludes credentials, network addresses, users, campaign content, and installation/world identifiers from the JSON. The filename includes the sanitized world ID; review it before sharing. Downloading does not upload the report or submit a support request.

For missing Craftworks components, download a troubleshooting file **before** using **Sync with Compendiums**, then another afterward. Updated Core and Craftworks include pack configuration/access, material and recipe counts, source availability, sync status, and recent sync/harvest outcome codes. Recent outcomes cover only this client since reload; no character names, campaign documents, or raw error messages are included.

### The approval page did not open

Select **Open approval page**. That link uses the same approval address. If the link does not open, allow pop-ups for Foundry or paste the address into a browser that can reach MorelordGaming.com. Select **Copy** and paste the code if the approval page did not fill it in.

### The temporary code expired

Close or return from the pending activation and start the connection again. Each attempt creates a new temporary code.

### Foundry stays on “Waiting for website approval”

It should already be filled in on the approval page; if not, select **Copy** and paste the code. Confirm that you selected **Approve Foundry Connection**. If the attempt expires, start again.

### A membership change is not showing

Open the **Morelord Account** window and select **Refresh Access**. Confirm the updated value beside **Membership** and check **Last validated** for a recent time.

### Morelord Gaming cannot be reached

Confirm that the Foundry host can access `https://morelordgaming.com`. Recently cached access may remain available during the offline grace period. Try **Refresh Access** again after connectivity returns.

### Premium access is still unavailable

Confirm that:

- Morelord Core is enabled in the current world.
- The **Morelord Account** window shows **Connected**.
- The expected membership appears in the window.
- **Last validated** reflects a recent successful check.
- The supported Morelord Tools module is installed and enabled.

If needed, disconnect and reconnect the world to create a fresh account connection.

## Quick Reference

| Goal | Where to go | Action |
| --- | --- | --- |
| Connect an account | Morelord Core module settings | **Connect or Manage Account → Connect Morelord Account** |
| Check membership | Morelord Core module settings | Open **Connect or Manage Account** |
| Update access | Morelord Account window | **Refresh Access** |
| Manage the web account | Morelord Account window | **Open Account** |
| Change reporting | Account window → Core Settings | Set the two reporting choices, then **Save Core Settings** |
| Mark reactions | Account window → Core Settings | Check or uncheck **Reaction Used**, then **Save Core Settings** |
| Exclude observers | Morelord Core module settings | **Select Ignored Users** |
| Manage locations | Morelord Core module settings | **Manage Shared Locations** |
| Transfer configuration | Morelord Core module settings | **Export / Import Settings** |
| Get a support report | Morelord Core module settings | **Download Troubleshooting File** |
| Open the community | Morelord Core module settings | **Join Discord** |
| Remove the connection | Morelord Account window | **Disconnect** |

