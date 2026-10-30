# Morelord Core: GM Product Guide

## Documentation

**Documentation** opens the corresponding module's documentation on the Morelord Gaming website in a new browser tab. Use the website's module tree and nested section links to navigate the complete guides. Modules without a dedicated website page open the documentation index.

Every player and GM page, including module Game Settings, must document each field and action using its displayed label, accepted values, defaults, dependencies, and effects. Examples belong in the guide.

Morelord Core provides shared account access, Locations, user participation controls, settings transfer, and support tools for Morelord Gaming modules. Supported Morelord Tools modules use its account connection to check which premium features are available in the world.

Reviewed against local Core 0.3.13 on September 23, 2026. This implementation review is not a new compatibility test or public-release announcement.

Recording check: the public Core 0.3.13 package installed from Foundry's catalog does not include the one-time reporting notice described below from the development worktree. In that package, open **Connect or Manage Account → Core Settings** to choose reporting preferences directly. The video documentation must follow the installed package's actual controls.

This guide is for Game Masters. **Token Distance Indicator** and **Reaction Used** are world settings changed by a GM. Players do not need to configure account access.

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

For example, search the Actors directory for a batch's common name, choose **Select multiple → Select visible**, then **Move selected (N)** and choose `Cities / Neverwinter`. Choose **Move selected (N)** again and **Root (no folder)** to return them. To remove them instead, review **Delete selected (N)**, then confirm. Selection survives directory rerenders but resets when the client reloads. Only world documents are included in those directories: chat messages, combat entries, journal pages, and individual playlist sounds are outside this directory action. Compendium packs are selected from the Compendium Packs tab.

### Select, move, lock, and delete compendium packs

GMs can use **Select multiple** on the Compendium Packs sidebar tab, including its pop-out. Core must be enabled; account linking and premium access are not required. Selection starts empty and is kept for that directory window, separate from the other sidebar directories. The controls match the other directories, with these pack-specific actions.

- The checkbox is the leftmost control on each pack and is drawn over the upper left of the pack card. The banner, title, lock icon, source footer, and card size stay where Foundry placed them. Checking a box does not open the pack. Shift-click checks or unchecks every currently visible pack from the last clicked checkbox through the one just clicked. Packs hidden by search, a type filter, or a collapsed folder are not added by that range.
- **Select visible**, **Clear selection**, and **Done selecting** work the same way as in the other directories. Folders are not selectable.
- **Move selected (N)** is disabled when its label is **Move selected (0)**. The dialog is titled **Move N selected compendiums**, or **Move 1 selected compendium** for one pack. It lists the pack titles and a **Destination folder** selector. **Root (no folder)** is first. The other choices are compendium folders, sorted as paths such as `Parent / Child`. **Cancel** changes nothing. **Move selected** assigns that folder through Foundry's compendium folder API. Core then shows `Moved 2 compendiums to Parent / Child.`, `Moved 1 compendium to Root (no folder).`, or `No selected compendiums remain to move.`
- **Lock selected (N)** counts selected packs that are not locked. It is disabled at **Lock selected (0)**. Choosing it locks those packs immediately. Core shows `Locked 2 compendiums.` or `Locked 1 compendium.`
- **Unlock selected (N)** counts selected packs that are locked. It is disabled at **Unlock selected (0)**. A world compendium, and a module compendium whose module has no manifest and no download, unlocks immediately. If any selected locked pack is a system compendium or a module compendium that a package update can replace, Core first opens a dialog titled **Unlock N compendiums** (or **Unlock 1 compendium**). The dialog lists every locked pack in the selection. **Cancel** is the default and changes nothing. **Unlock selected** unlocks every selected locked pack in that batch. Core shows `Unlocked 2 compendiums.` or `Unlocked 1 compendium.`
- **Delete selected (N)** counts selected world compendiums only. System and module compendiums do not increase N, and the button is disabled at **Delete selected (0)**. The confirmation is titled **Delete N selected compendiums**, or **Delete 1 selected compendium**, and lists the world pack titles. When the selection also contains a system or module compendium, the confirmation says those compendiums are kept. **Cancel** is the default. **Delete selected** permanently deletes the listed world compendiums through Foundry's compendium API. Folders are kept. There is no undo.

### Token Distance Indicator

**Token Distance Indicator** accepts checked (enabled) or unchecked (disabled), defaults to checked, and applies to every client in the world. Only a GM can change it. Choose **Save Core Settings** to apply it in **Connect or Manage Account → Core Settings**, or change the same checkbox directly in **Game Settings → Configure Settings → Morelord Core**. Players do not see that checkbox. No account connection or premium access is required. A world that has never saved the checkbox takes the previous per-client choice from the first GM who loads it, including off. When that GM had not saved a per-client choice, the world stays checked. Disable it when using another distance indicator such as TheRipper's Hover Distance to avoid duplicate displays.

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

**Token Distance Indicator** and **Reaction Used** are documented above under What Morelord Core Does. Change either checkbox here with **Save Core Settings**, or in **Game Settings → Configure Settings → Morelord Core**. Both apply to the whole world, and only a GM can change them.

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

A shared location is a place you describe once in Morelord Core. Downtime, Craftworks, Marketplace, and Journeys read that same record. Name the town, choose the settlement, and list the facilities it has. Tie the town's scenes to that record, and choose the same record when a Downtime session happens there. Every module then sees the same forge, market, and instructor.

Creating the location records what the place can support. It does not create a shop, an NPC, a recipe, or a project. Each module applies its own rules, described below.

**In this section**

- [Why one location is enough](#why-one-location-is-enough)
- [Set up a location](#set-up-a-location)
- [Capabilities and Specialty](#capabilities-and-specialty)
- [Which place the modules use](#which-place-the-modules-use)
- [What each capability does](#what-each-capability-does)
- [Downtime](#downtime)
- [Craftworks](#craftworks)
- [Marketplace](#marketplace)
- [Journeys](#journeys)
- [Example: a town forge](#example-a-town-forge)

### Why one location is enough

Without a shared location, each module would need its own note that the town has a forge, a market, and someone who can teach. One location keeps those facts together.

A capability is one service at that place. **Tier** says how rare a result that service can support. **Specialty** says which subjects that one service covers. Leave Specialty on **Any** and the service covers every subject of its kind.

The same town then answers a different question in each module:

- Downtime asks whether an NPC there can teach a subject, and which place a session or a project uses.
- Craftworks asks whether the current place has the facility a recipe needs.
- Marketplace, when **Enable Locations** is on, asks whether the current place has a market and how rare an item that market trades.
- Journeys can store the town on a travel day. With no town stored, the day is On the Road.

### Set up a location

Open **Morelord Core → Manage Shared Locations**. The window title is **Morelord Locations**. The same window opens from **Manage Locations** on the Downtime dashboard, the Craftworks dashboard, and Marketplace.

When the list is empty, the left side reads "No shared locations yet." The main panel shows **Shared Morelord Locations**, the line "Create a location to define its settlement type, capabilities, and associated Scenes.", and **Create First Location**. The plus button (**Create Location**) in the **Locations** heading starts another location. The left list shows each saved **Name** and its settlement type. Select a name to edit that location.

While you are editing, the heading is **New Location** or **Edit Location**. The introduction reads "Locations are shared by Marketplace, Craftworks, Downtime, and Journeys."

**Save Location** before you select another location or choose **Create Location**. Those actions load a different record and drop edits that are still unsaved.

![New shared location named Phandalin, with settlement type Village and a Forge capability set to Common.](/images/foundry/core-locations.png)

**Name** is required. The placeholder is Neverwinter. Saving a blank name reports `Could not save location: A location requires a name.`

**Settlement Type** choices are Road, Hamlet (1–100 people), Village (101–1,000 people), Town (1,001–6,000 people), City (6,001–25,000 people), Metropolis (25,001+ people), and Other. A new location starts as Road. The hint under the menu reads "Population ranges are suggested guidelines." The ranges are suggestions. They leave crafting, teaching, and trade on the capability **Tier** you set.

**Notes** is optional text for the GM. The placeholder is "GM-facing location notes."

### Capabilities and Specialty

Choose **Add Capability** for each facility the place offers. A new row starts as **Forge**, **Common**, and Specialty **Any**. The section hint reads "Capability tier is independent from settlement size."

The **Type** menu lists Forge, Marketplace, Alchemist, Library, Temple, Contractor, Instructor, and Workshop, in that order. Each row has **Type**, **Tier**, **Specialty** when that type has one, **Notes**, and **Remove Capability**.

**Tier** is Common, Uncommon, Rare, Very Rare, or Legendary. A higher tier meets a lower tier of the same type. An Uncommon Forge meets a Common Forge. A Legendary Forge meets every lower Forge tier. Changing **Settlement Type** leaves the tier as you set it. A hamlet can have a Legendary forge, and a metropolis can have a Common market.

When a check names a specialty, the tier that counts is the highest tier among rows of that type whose Specialty is **Any** or includes that specialty. When a check names only the type, the tier that counts is the highest tier of that type on the location. You can add more than one row of the same type. A specialty is available when any row of that type is **Any** or includes it. An **Any** row covers every subject of that type, including when another row of the same type lists only a few.

**Specialty** is a checkbox menu on Instructor, Forge, and Workshop. Marketplace, Alchemist, Library, Temple, and Contractor hide it. If you change **Type** to one of those, any specialties already stored on the row stay stored.

The closed summary reads **Any** when nothing is checked. **Any** covers every specialty of that type. Open the menu, check each specialty that one row should cover, and close it. The summary lists the checked names in the same height as the **Type** and **Tier** menus. When the names are wider than that field, the line ends in an ellipsis and the full list is in the field's tooltip. One row holds several specialties. Clear every box to return the summary to **Any**. A specialty saved earlier as a single choice stays that one checked choice. A saved specialty that is not in the list remains in the menu under the saved name. Changing **Type** rebuilds the menu.

The choices are fixed D&D 2024 lists. They stay as listed here when Configure Sources changes, and they do not come from compendium items. The menu is the same list on every world.

A listed weapon and that weapon's mastery are one specialty. Longsword appears under Weapons and under Weapon Masteries. Saving with either Longsword box checked keeps Longsword once. After that save, both boxes are checked, and the summary lists Longsword once.

**Notes** on the row is optional text stored with that capability. The placeholder is Optional. It is separate from the location **Notes** above the capability list. **Remove Capability** drops that row. Save afterward to keep the change.

**Forge.** Groups are Weapons, Armor, and Weapon Masteries. Weapons include Simple Weapons, Martial Weapons, and each weapon. Armor includes Light Armor, Medium Armor, Heavy Armor, Shields, and each armor, including Shield. Weapon Masteries lists each weapon. **Any** covers every weapon, armor, and mastery in those groups. Smith's Tools identify a Forge. The Specialty menu itself lists weapons, armor, and weapon masteries.

**Workshop.** One list, with no group heading. **Any** covers every tool on the list: Brewer's Supplies, Calligrapher's Supplies, Carpenter's Tools, Cartographer's Tools, Cobbler's Tools, Cook's Utensils, Glassblower's Tools, Jeweler's Tools, Leatherworker's Tools, Mason's Tools, Painter's Supplies, Potter's Tools, Tinker's Tools, Weaver's Tools, and Woodcarver's Tools. Smith's Tools stay on Forge. Alchemist's Supplies stay on Alchemist, so Alchemist has no Specialty menu. Carpenter's Tools and Mason's Tools stay on Workshop; a Contractor row does not take them. Calligrapher's Supplies and Cartographer's Tools stay on Workshop; a Library row does not take them. If a Tavern capability is available, Brewer's Supplies and Cook's Utensils move to Tavern and leave Workshop.

**Instructor.** Groups are Languages, Skills, Tools, Weapons, Armor, and Weapon Masteries: the D&D 2024 languages, skills, tool proficiencies, weapon proficiencies, armor proficiencies, and weapon masteries. Tools includes artisan's tools, other kits, gaming sets, musical instruments, and vehicles. **Any** covers every subject in those groups. A checked list covers those subjects. The Instructor tier does not choose which subjects can be taught. A Common Instructor set to **Any** can teach every subject on the list.

**Marketplace, Alchemist, Library, Temple, and Contractor.** The row is **Type** and **Tier**. Specialty stays hidden. Alchemist's Supplies identify an Alchemist.

### Associated Scenes

**Associated Scenes** connects Foundry Scenes to this place. The text under the heading reads "When one of these Scenes is active, it resolves to this Morelord Location." The place the modules use is described under [Which place the modules use](#which-place-the-modules-use): the scene a user is viewing, unless an active Downtime session names a location or is On the Road.

**Filter Scenes** keeps names that contain what you type. The placeholder is "Type any part of a Scene name." Click a Scene to select it, and click it again to clear it. The line under the list reads "{count} selected · Click a Scene to toggle its selection." Clearing the filter shows every Scene again. Several Scenes can belong to one location, which is how a town map and its interior maps stay the same place. A Scene belongs to one location. Saving a Scene that another location already has moves that Scene to the location you are saving. Selected Scenes stay highlighted when you reopen the location, and they are listed first.

### Save and delete

**Save Location** keeps the editor open and in front. Other open Morelord windows may refresh and stay behind this window. The notice reads "{Name} saved." These records stay in the world. **Export / Import Settings** does not copy them. Marketplace's **Enable Locations** setting is included with that transfer; the locations themselves are not.

**Delete** appears after the location has been saved. The dialog title is **Delete Morelord Location**. The dialog reads "Delete {Name}? Projects and integrations that reference it may become unavailable." **No** keeps the location. **Yes** removes the location record. The notice reads "Location deleted." The Foundry Scenes remain. If other locations remain, the editor opens the one that comes first by name. If none remain, the window returns to **Create First Location**.

### Which place the modules use

Modules that need the party's current place use one shared answer.

- While a Downtime session is active and that session has a **Location**, that saved location is the current place for the whole world.
- While a Downtime session is active and its **Location** is **No Location**, the current place is **On the Road**. On the Road is not a saved location. It has no capabilities, so it has no forge, workshop, instructor, or market.
- When Downtime is not active, or it has no active session, the current place is the location tied to the scene that user is viewing. A user who is looking at a different scene is in that scene's location.

Downtime's crafting list also keeps the viewed scene in mind. A recipe the scene's location can support still appears during an On the Road session. Work already started stays on the list and shows as paused when neither place can support it.

### What each capability does

| Type | Specialty | What a GM uses it for |
| --- | --- | --- |
| **Forge** | Weapons, armor, and weapon masteries. **Any** covers all of them. | The place can do Smith's Tools work. Craftworks uses the Forge tier when a recipe's tool is assigned to Forge. The checked weapons and armor stay on the location. |
| **Workshop** | The general workshop tools listed above. **Any** covers every one of them. | The place can support those crafts. Craftworks allows a workshop recipe when a Workshop of sufficient tier includes that tool, or is **Any**. |
| **Alchemist** | Hidden. Alchemist's Supplies belong here. | The place can support alchemy. Craftworks uses the Alchemist tier when a recipe's tool is assigned to Alchemist. |
| **Instructor** | Languages, skills, tools, weapons, armor, and weapon masteries. **Any** covers every subject. | The place has someone who can teach. Downtime uses this list for an NPC instructor. |
| **Marketplace** | Hidden. | The place has a market. With **Enable Locations** on, this tier is the highest rarity the global market buys and sells here. A shop can also inherit a Marketplace row for generated stock. |
| **Library** | Hidden. | Records that the place has a library. Training, crafting facilities, and trading use the other types. Calligrapher's Supplies and Cartographer's Tools remain Workshop choices. |
| **Temple** | Hidden. | Records that the place has a temple. Training, crafting, and trading use the other types. |
| **Contractor** | Hidden. | Records that the place has a contractor. A Downtime commission still asks for its own **Location**. Carpenter's Tools and Mason's Tools remain Workshop choices. |

### Downtime

Open **Manage Locations** from the Downtime dashboard when the activities need a place. Then create a session and choose its **Location**, or leave **No Location** for time spent on the road. **Available Activities** is a separate choice on the session. Checking Training, Crafting, or Source Item there permits that activity. The location's capabilities do not fill that list in.

**Training.** Choose a student, a subject, and an instructor. The subject list is the same fixed D&D 2024 set the Instructor specialty uses: skills, languages, tools, weapons, armor, and weapon masteries. A character instructor must already know the subject and must spend the same hours as the student. That character can teach a subject the location's Instructor list leaves unchecked.

An NPC instructor needs a name. **Project Location** is optional.

- With a project location, the subject list shows only what that location's Instructor specialty allows. **Any**, or a specialty left empty, allows every subject. A single saved specialty allows that one subject. Several checked subjects allow those subjects. A location with no Instructor capability offers no NPC subjects. The NPC can advance the project in a session at that same location.
- With **No fixed Location**, the full subject list stays available while you create the project. When hours are allocated, Downtime checks the session's location. That location needs an Instructor capability that allows the subject. A session with **No Location** has no Instructor specialty to apply.

**Crafting.** Craftworks owns the recipe, the materials, the check, and the finished item. In Downtime, a marked recipe or a job already underway appears when the character can work it at the viewed scene's location or at the active session's place. An On the Road session keeps recipes the scene can still support. A job that neither place can support stays visible and shows as paused. While the session is active and **Available Activities** includes **Crafting**, hours spent crafting are added to that character's session time.

**Commissions.** A commission needs a contractor name, a **Location**, the item, and the labor. Finished work waits for collection at that location. The commission advances by campaign days. Adding a Contractor capability is a separate record of that service. Commission is not an **Available Activities** choice.

**Source Item.** A search needs a **Location**, a magic item from the character's Marketplace wishlist, and a **Sourcing Check** of Arcana or Investigation. The location is where the search happens. Marketplace's **Enable Locations** setting, described below, is what limits buying and selling.

### Craftworks

Craftworks reads the current place when it decides whether a recipe can be worked. **Manage Locations** on the Craftworks dashboard opens the same shared list.

In Craftworks **Settings**, under **Crafting**, each artisan's tool has a facility, or **No facility required**. The default is **No facility required**, so the recipe can be worked in any place, including On the Road. The minimum tier is the crafted item's rarity. An Uncommon item can use an Uncommon, Rare, Very Rare, or Legendary facility. A Common facility leaves a Rare item paused. A facility choice saved before the tool was named Smith's Tools still applies to Smith's Tools.

- Assign **Smith's Tools** to **Forge**, and the current place needs a Forge of sufficient tier. The weapons and armor checked on that Forge stay on the location. Crafting uses the tier. A Forge whose specialty is only Longsword can still craft a Smith's Tools recipe of a rarity that tier allows.
- Assign **Alchemist's Supplies** to **Alchemist**, and the place needs an Alchemist of sufficient tier.
- Assign a general workshop tool, such as Carpenter's Tools or Weaver's Tools, to **Workshop**, and the place needs a Workshop of sufficient tier whose Specialty includes that tool or is **Any**. Several tools may be checked on one Workshop row. A Workshop of a lower tier set to **Any** covers recipes of that lower tier. A Rare Workshop limited to Weaver's Tools covers weaver recipes of Rare or lower. Smith's Tools map to Forge and Alchemist's Supplies map to Alchemist. If either tool is assigned to **Workshop** instead, Craftworks asks for a Workshop of sufficient tier and skips the Workshop Specialty list for that tool.
- **No facility required** skips the location check for that tool.

A recipe that needs a facility stays paused in Craftworks while the current place lacks it, and it can continue when the place meets it. During an active Downtime session, Craftworks uses that session's location, or On the Road when the session has none. Downtime's own project list can still show a recipe the viewed scene allows, as described above.

### Marketplace

Marketplace uses a location in two ways. Both read the same saved record.

**Enable Locations** is a world setting, off by default, in Marketplace's settings. While it is off, buying and selling ignore the current place.

While it is on, buying and selling require the current place to have a Marketplace capability. The tier used is the highest Marketplace tier at that place. Common allows Common items. Uncommon allows Common and Uncommon. Rare allows through Rare, and so on through Legendary. An item with no rarity counts as Common. An artifact is above Legendary, so the global market leaves artifacts untraded at any of these tiers.

- **Buy** omits items above that tier. The item count, the rarity counts, and the pages follow the shorter list.
- **Sell** still lists owned items above the tier. Their sell buttons are disabled, and the button explanation names the limit.
- A scene shop still needs a Marketplace at the current place. Its own stock and purchase rules then decide which items it trades, including items rarer than the location's tier. A shop that refuses an item still refuses it. On the Road has no Marketplace, so nothing can be bought or sold there while the setting is on, including at a scene shop.
- The same check runs again when a cart, a shop purchase, or a GM approval is completed.

This is separate from a shop's own fields. In the shop editor, **Morelord Location** optionally ties that shop to a saved location. Choosing it does not place the shop's token. **Maximum Normal Rarity** limits generated catalog items and random restocks. **Inherit from Location** uses the first Marketplace capability on that location. An explicit rarity on the shop replaces it. Items you add by hand may be rarer than that limit. With neither a shop rarity nor a location Marketplace, the shop's own rarity selections apply.

### Journeys

Journeys can store one of these locations as the place for the current travel day. With none stored, the day is On the Road, which has no capabilities. Completing a travel day advances Downtime projects that progress by days. It leaves the active Downtime session's location where you set it, and the road stays without a forge or a market.

A travel day can also store extra capabilities for that day. They remain on the journey and leave the saved location unchanged. Marketplace, Craftworks, and Downtime sessions keep using the current place from the rules above. The Journeys window has no location picker, no temporary-capability field, and no **Manage Locations** button. Set the town and its facilities in **Manage Shared Locations**, and choose that town on the Downtime session when the party has stopped there.

### Example: a town forge

Create a location named **Highmarket**. Set **Settlement Type** to Town (1,001–6,000 people). Associate the town scene and the smithy interior. Then add these capabilities and choose **Save Location**. The notice reads "Highmarket saved."

- **Forge**, tier **Rare**. Open **Specialty** and check Longsword, Plate Armor, and Shield. The summary lists those three. After you save, Longsword is stored once, so the Weapons box and the Weapon Masteries box for Longsword are both checked. In Craftworks **Crafting**, set Smith's Tools to **Forge**. Smith's Tools recipes of Rare, Uncommon, or Common can be worked in Highmarket. A Very Rare item needs the Forge tier raised to Very Rare or Legendary. The checked weapons and armor record what this forge covers. The Smith's Tools recipes follow the Rare tier. Leave **Specialty** on **Any** when this forge should cover every weapon, armor, and weapon mastery.
- **Workshop**, tier **Common**. Check Cobbler's Tools and Leatherworker's Tools. A Common cobbler or leatherworker recipe can be worked here when those tools are assigned to **Workshop**. A carpenter recipe needs Carpenter's Tools checked, or **Specialty** left on **Any**, and a tier high enough for that item.
- **Alchemist**, tier **Uncommon**. There is no Specialty to set. Alchemist's Supplies recipes of Uncommon or lower can be worked here when that tool is assigned to **Alchemist**.
- **Instructor**, tier **Common**. Check Stealth and Thieves' Tools. An NPC instructor with **Project Location** set to Highmarket can teach those two subjects. Leave **Specialty** on **Any** when the same NPC should teach any subject. A player character who already knows Arcana can still train another character in Arcana here.
- **Marketplace**, tier **Uncommon**. Turn on Marketplace's **Enable Locations**. In Highmarket, Buy lists Common and Uncommon items. Rarer owned items remain on Sell with their sell buttons disabled. A shop in town can still sell a Rare item from its own stock. Removing the Marketplace row blocks buying and selling here while the setting stays on.

While the party is viewing the town scene and no Downtime session is active, crafting and shopping use Highmarket. Start a Downtime session, choose **Highmarket** as its **Location**, and they keep using Highmarket. Start that session with **No Location** and the current place becomes On the Road: facility recipes pause there, and **Enable Locations** blocks trade. Downtime can still list a recipe the town scene itself allows.

## Export and Import Settings

Open **Morelord Core → Export / Import Settings**. The list shows enabled modules with eligible settings and their counts. **Export Settings** downloads `morelord-settings.json`, including eligible world settings and preferences from the current browser.

![Settings transfer listing enabled Morelord modules, with Export Settings and Import Settings.](/images/foundry/core-settings-transfer.png)

To import, enable the relevant modules, choose a JSON file under **Settings File**, then select **Import Settings**. Matching settings are replaced; settings absent from the file remain unchanged. Missing or disabled modules and unknown settings are skipped. Review the imported/skipped counts and reload Foundry to refresh module views. Export your current configuration before replacing it.

This is configuration transfer, not a world backup. Credentials, access caches, reporting preferences/credentials, shops, shared Locations, active journeys, downtime projects, and window positions are excluded. Marketplace's **Enable Locations** setting is included with its other configuration settings. Actor/user references retain their IDs and are not remapped between worlds. Files are validated before writing. A failed write triggers an attempt to restore previous values; restoration failures are reported.

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

