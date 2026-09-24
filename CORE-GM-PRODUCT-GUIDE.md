# Morelord Core: GM Product Guide

Morelord Core provides shared account access, Locations, user participation controls, settings transfer, and support tools for Morelord modules. Supported Morelord Tools modules use its account connection to check which premium features are available in the world.

Reviewed against local Core 0.3.13 on September 23, 2026. This implementation review is not a new compatibility test or public-release announcement.

Recording check: the public Core 0.3.13 package installed from Foundry's catalog does not include the one-time reporting notice described below from the development worktree. In that package, open **Connect or Manage Account → Core Settings** to choose reporting preferences directly. The video documentation must follow the installed package's actual controls.

This guide is for Game Masters. Players do not need to configure Morelord Core.

## What Morelord Core Does

Morelord Core provides one shared account connection for supported Morelord Tools modules. From Foundry, a GM can:

- Connect the current world to a Morelord Gaming account.
- Review the membership level recognized for the world.
- Refresh premium access after an account or membership change.
- Open the Morelord Gaming account page.
- Disconnect the world from the account.

Morelord Core does not remove existing world data if premium access expires.

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

3. Install the other Morelord modules you intend to use from the same Setup page, checking each package's compatibility and dependencies. Installation makes packages available to Foundry; activation is separate for each world.
4. Launch the compatible world you want to connect and log in as a GM.
5. Open the **Settings sidebar → Module Management** (Foundry 14).
6. Enable the desired modules and accept Foundry's required-dependency activation when offered. Verify **Morelord Core** and **socketlib** are enabled for modules that require them. For example, Downtime requires Core, and Core requires socketlib. Recommended integrations are optional and are not the same as required dependencies.
7. Save the module configuration and complete any requested reload. Handle the reporting-preferences notice if it appears, then open **Game Settings → Configure Settings → Module Settings → Morelord Core**.

The video documentation series installs the suite together in this opening walkthrough so later module guides can refer back to it. A complete suite installation is not required to use Core. Character Export does not declare Core as a required dependency in its reviewed local manifest.

The account connection applies to the current world. Repeat the connection process in each world that should use your Morelord access.

## Connect a Morelord Account

1. Open **Game Settings → Configure Settings → Module Settings → Morelord Core**.
2. Select **Connect or Manage Account**.
3. In the **Morelord Account** window, select **Connect Morelord Account**.
4. Foundry opens the Morelord Gaming approval page in your browser and displays a temporary code.
5. Confirm that the code in Foundry matches the prefilled code on the website.
   If you signed in using a different browser, open your Morelord account page there and enter the code from Foundry in **Activation code**.
6. On the website, select **Approve Foundry Connection**.
7. Return to Foundry. Foundry checks for approval automatically and reports when the account is connected.

The temporary code expires after 15 minutes. If it expires or activation fails, start the connection process again to create a new code.

If the browser page does not open, select **Reopen Approval Page** in the Foundry window. Check your browser's pop-up settings if the page still does not appear.

## Review Account and Access Status

### Connect Discord from the website

On your Morelord account page, select **Connect Discord** and authorize the Discord account you intend to use. Linking an identity does not automatically join the community server. If the page reports that you are not in the server, follow **Join the Morelord Gaming Discord**, accept the invite, and complete Discord's required server onboarding.

Return to the Morelord account page and select **Synchronize roles**. Review its status, then check your channel access in Discord. A successful synchronization message does not by itself prove that every channel permission is configured correctly. If a channel reports that you cannot send messages, include that channel and the synchronization status when reporting the access problem.

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
- **Disconnect:** Removes the Morelord account connection and locally cached access information from this world.

## Refresh Access

Morelord Core checks access automatically when a connected GM loads the world. Use **Refresh Access** when:

- You changed your Morelord membership.
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

Open **Connect or Manage Account**, then scroll to **Core Settings**. These controls are available without connecting an account. Use **Save Core Settings** to apply changes.

| Control | Meaning |
| --- | --- |
| Morelord Gaming Website | Address for activation and access checks. Default: `https://morelordgaming.com`. Keep it unless intentionally using another supported endpoint. |
| Share feature usage | Shares feature actions, active module versions, Foundry/system versions, and GM/player role under a random world reporting ID. Reports are pseudonymous and exclude campaign content. |
| Share error reports | Independently shares error types, Morelord code locations, failed operations, and versions. Recent feature actions accompany errors only when feature sharing is enabled. Custom error text and account credentials are excluded. |
| Enable Developer Mode | Off by default. Limits access for testing across Morelord modules and pauses both reporting streams. It does not grant paid access. |
| Test Subscription Level | Standard, Premium, or Champion, capped by the connected account and each module's actual access. Default: Standard. Applies while Developer Mode is enabled; Standard disables paid access. Unavailable higher choices are disabled. Reopen module windows after saving to refresh displays. |

The elected active GM receives a one-time **Morelord Reporting Preferences** notice. Both reporting choices are preselected unless a previous choice was saved. Uncheck either to opt out, then choose **Save Reporting Preferences**. Closing without saving leaves preferences unchanged and offers the notice at the next GM session. Existing version-only consent does not automatically authorize broader reporting. Change either choice later in Core Settings without affecting account linking or premium access.

Account activation separately supplies world and installation information needed to approve and label that connection. See [TELEMETRY.md](TELEMETRY.md) for reporting details.

## Ignored Users

Open **Morelord Core → Select Ignored Users**. Check recording or observer accounts to exclude them, then select **Save**. Uncheck and save to include them again. Ignored accounts cannot send or receive routed Morelord module messages; do not ignore participating GMs or players. This does not delete users or change their Foundry role.

## Shared Locations

Open **Morelord Core → Manage Shared Locations**. Choose **Create First Location** when empty, or the plus button to add another. Select a saved location in the left list to edit it.

Enter a **Name**, **Settlement Type**, and optional GM-facing **Notes**. Settlement choices are Road, Hamlet (1–100 people), Village (101–1,000), Town (1,001–6,000), City (6,001–25,000), Metropolis (25,001+), and Other. Population ranges are suggestions, not enforced limits.

Choose **Add Capability** for each service the location provides. Core registers Forge, Marketplace, Alchemist, Library, Temple, Contractor, Instructor, and Workshop; enabled integrations can register additional types. A capability describes facilities or services; it does not create a shop, NPC, recipe, or project.

Each row has a **Type**, **Tier**, optional **Specialty**, optional **Source**, and a remove button. Tiers are Common, Uncommon, Rare, Very Rare, and Legendary. A higher tier satisfies a lower-tier requirement of the same type. Settlement size does not determine tier. Specialty can match a specific requirement; use the value expected by the consuming workflow. Source records where the capability comes from. Remove a row with its trash button, then save.

Under **Associated Scenes**, use **Filter Scenes** to find names. Click a Scene to select it; click again to deselect it. Several Scenes can share a location. Clearing the filter reveals the full list. Saving an association already owned by another location moves that association to the newly saved location. The current Scene determines the shared location used by applicable workflows.

Choose **Save Location** to persist changes; the editor stays open. Reopen a saved entry to review it. Save edits before selecting another location. Journeys, Craftworks, Marketplace, and Downtime can consume these records.

**Delete** asks for confirmation. Choose **No** to keep the record. Choosing **Yes** removes the location; projects and integrations referring to it may become unavailable. Deleting a location does not delete its Foundry Scenes.

## Export and Import Settings

Open **Morelord Core → Export / Import Settings**. The list shows enabled modules with eligible settings and their counts. **Export Settings** downloads `morelord-settings.json`, including eligible world settings and preferences from the current browser.

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

Select **Reopen Approval Page**. If nothing happens, allow pop-ups for Foundry or copy the workflow to a browser that can reach MorelordGaming.com.

### The temporary code expired

Close or return from the pending activation and start the connection again. Each attempt creates a new temporary code.

### Foundry stays on “Waiting for website approval”

Confirm that the code shown in Foundry matches the code on the website and that you selected **Approve Foundry Connection**. If the attempt expires, start again.

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
| Exclude observers | Morelord Core module settings | **Select Ignored Users** |
| Manage locations | Morelord Core module settings | **Manage Shared Locations** |
| Transfer configuration | Morelord Core module settings | **Export / Import Settings** |
| Get a support report | Morelord Core module settings | **Download Troubleshooting File** |
| Open the community | Morelord Core module settings | **Join Discord** |
| Remove the connection | Morelord Account window | **Disconnect** |
