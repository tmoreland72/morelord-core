# Morelord Core: GM Product Guide

Morelord Core connects a Foundry VTT world to your Morelord Gaming account. Supported Morelord Tools modules use that connection to check which premium features are available in the world.

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

- Foundry Virtual Tabletop version 13.
- Permission to configure the world as a GM.
- A Morelord Gaming account.
- Internet access for the initial connection and periodic access checks.

## Install and Enable Morelord Core

1. From Foundry's **Setup** screen, open **Add-on Modules**.
2. Install **Morelord Core**. If you are installing by manifest URL, use:

   `https://raw.githubusercontent.com/tmoreland72/morelord-core/main/module.json`

3. Launch the world you want to connect.
4. Open **Game Settings → Manage Modules**.
5. Enable **Morelord Core**, then save the module configuration.

The account connection applies to the current world. Repeat the connection process in each world that should use your Morelord access.

## Connect a Morelord Account

1. Open **Game Settings → Configure Settings → Module Settings → Morelord Core**.
2. Select **Connect or Manage Account**.
3. In the **Morelord Account** window, select **Connect Morelord Account**.
4. Foundry opens the Morelord Gaming approval page in your browser and displays a temporary code.
5. Confirm that the code in Foundry matches the prefilled code on the website.
6. On the website, select **Approve Foundry Connection**.
7. Return to Foundry. Foundry checks for approval automatically and reports when the account is connected.

The temporary code expires after 15 minutes. If it expires or activation fails, start the connection process again to create a new code.

If the browser page does not open, select **Reopen Approval Page** in the Foundry window. Check your browser's pop-up settings if the page still does not appear.

## Review Account and Access Status

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

## Anonymous Usage Statistics

The GM-only **Share Anonymous Usage Statistics** setting is enabled by default. When enabled, Morelord Core includes only these two version values during access checks:

- The installed Morelord Core version.
- The installed Foundry version.

This usage report does not add campaign, player, actor, item, chat, or world-name data. Turning the setting off does not affect account linking, access checks, or premium access.

To change the setting:

1. Open **Game Settings → Configure Settings → Module Settings → Morelord Core**.
2. Enable or disable **Share Anonymous Usage Statistics**.
3. Save your changes.

During the separate account-connection process, Foundry supplies installation and world information needed to label and approve that connection. The anonymous usage-statistics setting applies only to the optional version report sent during access checks.

## Troubleshooting

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
| Stop version reporting | Morelord Core module settings | Disable **Share Anonymous Usage Statistics** |
| Remove the connection | Morelord Account window | **Disconnect** |

