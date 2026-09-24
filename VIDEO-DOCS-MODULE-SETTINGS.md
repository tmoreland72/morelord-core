# Separate module settings recordings

User brief, September 23, 2026: preserve New Install's fresh module settings and record each module's settings separately for its later video. These assets must not be appended to Core. Use background/headless capture; no desktop focus, desktop pointer, added actors, Scenes, content installations, or other prerequisites. Explain controls and conditional requirements; preserve their current defaults. Narration is drafted here but requires approval before generated speech.

Production directory: `E:/.codex/visualizations/2026/09/23/01a0cfb5-3381-7661-bed5-12c3e226828f/core-install-production/`. The shared directory is storage only; each module has a separate take/export.

Environment: New Install (`new-install`), Foundry 14.368, dnd5e 6.0.5, Gamemaster. Core connection is Champion; this account state is not a factory default. No regression tests are run in this recording world. Native select popups are not captured reliably by headless recording; record selected values and explain all source-verified options without pretending the popup is visible.

## Inventory

Installed settings menus: Craftworks 0.4.13, Encounters 0.1.14, Journeys 0.3.6, Marketplace 0.9.8. Installed Downtime 0.1.1 and Character Export 0.3.4 expose no standalone Game Settings menu or visible registered configuration setting. Their workflow controls belong in their later practical videos; do not invent a settings panel. Campaign Manager is inactive.

## Craftworks draft narration

Open Game Settings, Morelord Craftworks, then Configure Craftworks. Content Packs determines which materials, recipes, and acquisition profiles are available. The account card shows the current access; Manage Account opens Core, and Refresh updates that access. A subscription does not install third-party books or modules.

Standard and SRD 5.2 start enabled here. SRD 5.1, Player's Handbook, Dungeon Master's Guide, and Monsters of Drakkenheim start disabled. Read each pack's description, access status, edition, and counts before enabling it. The Drakkenheim notice explains its required module and monster source. Automatic synchronization responds to content and version changes; Sync with Compendiums requests a new scan immediately.

In Materials, shared-party delivery starts off. Enable it only when you have a suitable Group actor; Party Recipient Actor selects that recipient, with automatic selection for a single populated Group. We will not create an actor for this settings explanation.

Harvesting starts with a zero DC modifier, three minimum and six maximum choices, and zero rare-result bias. The natural-twenty option is enabled and grants two distinct claims. Gathering starts with zero DC modifier, quantity multiplier one, and zero rare-result bias. Terrain DCs start at ten for Desert, Forest, Grasslands, Marsh, and Mountains; fourteen for Planar or Exotic; and twelve for Tundra and Underground. The global modifier applies after terrain values.

The Harvest DC modifier adjusts the skill-check difficulty; minimum and maximum choices bound the offered component choices. Rare-result bias adjusts how strongly rare outcomes are favored. Gathering's DC modifier adjusts the check difficulty, its quantity multiplier scales the material yield, and its rare-result bias adjusts rare outcomes. Zero modifiers leave the base values unchanged; a multiplier of one leaves the original quantity unchanged.

Encounter Loot enables Materials, Coin, and Special Treasure. All three chance modifiers start at zero; material quantity and coin multipliers start at one. These controls adjust the selected loot types; active content packs supply the available material data.

Each enable checkbox includes or excludes its corresponding loot type. Material Chance Modifier, Coin Chance Modifier, and Special Chance Modifier independently adjust the chance of that type. Material Quantity Multiplier scales material amounts; Coin Multiplier scales currency. They do not change which content packs supply the results.

Recipes follow enabled, entitled content packs. Reveal Recipes from Preferred Tool Proficiency starts enabled, allowing a proficient crafting character to see an otherwise hidden matching recipe.

Crafting lists each artisan tool separately. Every tool starts with No facility required. A requirement can instead be Forge, Marketplace, Alchemist, Library, Temple, Contractor, Instructor, or Workshop. A required facility must match or exceed the item's rarity. Use Core Locations to describe those facilities; changing this setting does not create one. Save Changes applies edits. We are closing without changing the defaults.

Evidence: installed window text and all 51 visible field values/options saved in `craftworks-settings-observed.json`; local settings template and registration reviewed. Recipe counts are installation-dependent and must not be narrated as universal defaults.

## Remaining capture status

Completed separate silent MP4 exports in `E:/.codex/visualizations/2026/09/23/01a0cfb5-3381-7661-bed5-12c3e226828f/module-settings/`: craftworks-settings.mp4 (take 10), encounters-settings.mp4 (take 11), journeys-settings.mp4 (take 12), marketplace-settings.mp4 (take 13). All four final MP4 files passed full decoding. Inspected sampled timeline/contact frames and section screenshots through the bottom of each settings window; headers, values, and pointer are visible. Raw navigation and preparation holds are preserved for later editing. These are not final paced or narrated releases. Capture is stopped and defaults are preserved. A per-field coverage ledger accompanies the files; product behavior was not changed, so no release notes or code changes are needed.

## Encounters draft narration

Open Game Settings, Morelord Encounters, then Configure Encounters. This page reviews content access; it does not contain editable encounter-generation fields. Manage Account opens the shared Core connection controls. Refresh checks the account again. The account tier and last-check timestamp describe this installation, not a default subscription.

Monster Sources shows Encounters Standard for SRD compendiums and Encounters Premium for all installed monster source books, including core and third-party content. Available means the account has access; it does not install the source book. Configure party, difficulty, and source selections in the encounter workflow when the relevant content is present. Close returns to Game Settings.

Evidence: `encounters-settings-observed.json`; no input fields in this installed settings window. Take 11 records navigation, both access rows, Refresh, and Close.

## Journeys draft narration

Open Game Settings, Morelord Journeys, then Configure Journeys. The account section uses Core's shared connection. Manage Account opens it; Refresh Access checks current membership. Sections can be collapsed or expanded to help navigate the settings.

Encounter Dice explains the Danger mapping: zero uses a d20, one a d12, two a d10, three a d8, four a d6, and five a d4. During the day, each traveler rolls once. Ones trigger encounters, and maximum results cancel encounters except on d4 and d6. At night, a campfire makes ones and twos trigger encounters. Night encounter frequency defaults to Every watch, four checks across the eight-hour night; Every hour gives eight checks. Maximums cancel the latest triggered periods first while remaining encounters retain their time and watch.

Discovery DCs are Perception presets. Very likely starts at five, Likely at ten, Possible at fifteen, Unlikely at twenty, and Very unlikely at twenty-five. Existing journeys retain their recorded DC until changed. Navigation presets use Survival: Simple five, Routine ten, Normal fifteen, Challenging twenty, Very challenging twenty-five, and Extreme thirty.

Foraging presets also use Survival. Lush forest or meadow starts at five; productive woodland or grassland ten; typical mixed wilderness fifteen; traveled or heavily settled land twenty; desert, tundra, or sparse badlands twenty-five; and barren or extreme environment thirty. Daily hunger save starts at ten. These fields adjust the DC presets, rather than supplying food or creating a journey.

Skip dice roll animation starts off. When enabled, GM journey rolls omit their visual dice display and chat roll card while still recording outcomes and audit details. Forced march save starts at twelve and applies when a traveler presses on for an extra third of a day.

Sleep and Shelter starts with a base sleep check of ten, a first sleep-deprivation save of ten, and an increase of five for escalating deprivation saves. Do not add Exhaustion level for lack of sleep starts off. Turning it on skips the deprivation save and Exhaustion; the character still receives no Long Rest benefits. Save Changes applies edited settings. We leave these defaults unchanged.

Evidence: `journeys-settings-observed.json` contains all 25 input fields, values, and frequency options. The initial account card briefly showed Standard; using its actual Refresh Access button updated it to Tools Champion. Do not narrate that initial display as a subscription change. The installed hunger label contains a malformed dash; narration uses plain wording rather than repeating the rendering defect.

## Marketplace draft narration

Open Game Settings, Morelord Marketplace, then Configure Marketplace. Catalog sources follow D&D5e Configure Sources. The account card shows the current subscription and GM Approval Workflow access. Manage Account opens Core; Refresh checks access again.

Default Buy Rate is the global purchase-price multiplier. It starts at one, or full list price; one point five means one hundred fifty percent. The minimum is one. Default Sell Rate is the fraction of list price received when selling. It also starts at one in this installation, and accepts zero through one; zero point five means fifty percent.

Enable Global Marketplace Selling and Enable Global Marketplace Buying both start on. Turning either off prevents that transaction type in the unrestricted global Marketplace. Disabling global buying still permits catalog browsing. Individual shops retain their own buying, selling, and pricing rules.

Require GM Approval for Sales and Require GM Approval for Purchases both start off. Enable either to keep that kind of player transaction pending for GM approval or denial. The account's GM Approval Workflow access applies to that feature. Post Transaction Cards starts on and controls chat cards for pending and completed transactions. Save applies edits. We close without changing any defaults or constructing a shop or customer actor.

Evidence: `marketplace-settings-observed.json` contains all seven editable values and the numeric limits; installed labels and local settings registration reviewed.

## Coverage checklist

| Module | Every settings control covered in draft | Recording evidence |
| --- | --- | --- |
| Craftworks | Six content switches; account/manage/refresh; sync; shared-party toggle and recipient; five harvesting controls; gathering modifier, multiplier, bias and eight terrain DCs; three loot toggles and five loot modifiers; preferred-tool recipe visibility; all eighteen tool-facility rows and every facility choice; Save; Documentation entry | 51 field entries in observed JSON; take 10 |
| Encounters | Manage Account, Refresh, Standard and Premium source-access rows, Close; no editable form fields | observed JSON; take 11 |
| Journeys | Account controls; collapsible sections; both frequency choices; five discovery, six navigation and six foraging DCs; hunger; skip animation; forced march; three sleep DC values; suppress deprivation exhaustion; Save | 25 fields in observed JSON; take 12 |
| Marketplace | Account controls; source configuration guidance; buy/sell rates; buying/selling switches; both approval switches; transaction cards; Save | seven fields in observed JSON; take 13 |
| Downtime | No standalone Game Settings menu or visible registered setting in installed build; explain workflow controls in its practical video | live settings registry inspected |
| Character Export | No standalone Game Settings menu or visible registered setting in installed build; explain export controls in its practical video | live settings registry inspected |

Craftworks Documentation opens its built-in product reference. Refer viewers there for workflow details; the settings segment explains the controls above without requiring an actor, an encounter, a shop, or a project. Field explanations may share a sentence when their meaning is identical, such as individual tool-facility requirements, but no visible setting is excluded from the narration scope.

All assets are silent working footage. Generated narration needs script approval; assembly and full timeline QA remain separate steps. No settings were saved or toggled during these four module captures. Account Refresh is the only live update demonstrated; no campaign data or content packs were added.
