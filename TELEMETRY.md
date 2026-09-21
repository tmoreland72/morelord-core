# Usage, errors and download reporting

The reporting website and migrations were deployed on September 20, 2026. Core 0.3.10 introduces the opt-in reporting client.

## GM controls

Open Morelord Core's account/settings window, even without a connected account. Share feature usage and Share error reports are independent choices. Both appear unchecked until the GM explicitly chooses and saves. The existing shareUsageStatistics key is preserved; telemetryConsentVersion=1 gates the broader reporting. Prior version-only sharing does not grant consent for feature events or errors. Legacy version headers remain on entitlement requests until that setting is changed. No account token, subscription, or activation is needed by the new endpoint.

Reporting is disabled in Developer Mode and for Core's Ignored Users. Revoking consent clears pending reports and aborts the client's current request; already received reports remain subject to retention. Privacy choices, the random reporting ID and its reporting credential are excluded from configuration exports. Do not opt demo worlds in: real reports would count them as usage unless Developer Mode is enabled.

## Meaning of the numbers

- module.available: the elected active GM observes an enabled module once per UTC day/client session. The server counts distinct worlds, so reconnects do not inflate that figure.
- *.opened: the named window rendered, once per open/close cycle; rerenders are ignored.
- *.attempted, *.returned, *.failed: an instrumented async service call started, resolved, or rejected. Returned does not imply a domain workflow completed: no-ops and repeated requests can return successfully.
- journey.created, journey.arrived, phase.changed and export.completed are explicit milestones.
- Errors: operation, native error type, Morelord package-relative source file and line/column, module/Foundry/system versions and GM/player role. Custom messages, arguments, hosts, URLs, campaign names/content and document identifiers are never intentionally collected. Up to five recent event codes accompany an error only if usage sharing is also enabled.

The website issues one random UUID and a separate reporting token to an opted-in world, stored together in telemetryCredentials and bound to the website origin. These are separate from account installationId, so reports are pseudonymous, not anonymous. Copied worlds retain the credentials; clear telemetryCredentials to {} in a copied world to enroll separately. Administrators can revoke credentials in the dashboard; rejected credentials are not automatically replaced. Reports do not measure unique installations, accounts or people. Zero means no observed events among participants. Available and used counts can differ when players report without a GM online that day.

Core sends up to 25 events every minute to /api/foundry/telemetry at the configured website, using HTTPS (HTTP only for localhost development), no cookies or referrer, and a dedicated reporting bearer token. GM and player clients report their own actions with the same world ID. The first consenting GM enrolls through /api/foundry/telemetry/register; player-only sessions cannot report until credentials exist. Enrollment requires no connected account. The server stores only a token hash and checks that each batch belongs to that credential. This identifies enrolled reporters, not authentic or unmodified module code; public enrollment and ingestion are rate-limited. At most 100 queued plus 25 pending events are held in memory. Retries retain event UUIDs; server inserts are idempotent. Closing/reloading the page or long outages can lose unsent events. Reports never block gameplay. Global capture covers Morelord errors with identifiable source frames; caught errors require explicit reporting or an observed service. It is not a complete console recorder.

## First instrumented features

| Module | Events |
| --- | --- |
| Journeys | Dashboard, journey creation/arrival and phase changes |
| Downtime | Dashboard/training/sourcing/research windows; project create/collect/cancel, session create/start/finalize, time allocation |
| Craftworks | Dashboard, recipes, crafting, harvesting, gathering, loot, hoards, delerium, potions and materials windows; crafting start/check/complete, harvest start/claim, loot and hoard roll/award calls |
| Marketplace | Marketplace and shop manager windows; shop checkout, catalog buys and sells |
| Encounters | Builder, custom/generated selection and roster windows; caught generation errors |
| Character Export | Export attempts/completion/failure when Core is active; Core remains optional |

Morelord Compendium is private-game content and is excluded from usage, error and download reporting. No Campaign Manager events. Fixed event codes carry no actor, item, recipe, journey or world identifiers. Module integrations use optional Core API calls to preserve compatibility with existing Core versions.

## Shared API

Use MorelordCore.telemetry.track(moduleId, fixedEventCode) at a verified milestone and .error(moduleId, fixedOperationCode, error) for caught failures. .windows(moduleId, { exactApplicationId: fixedEventCode }) counts opens. .observe(moduleId, service, { asyncMethod: fixedOperationCode }) instruments mutable service methods; use only functions that reject on failure and do not wrap both a caller and its callee as if they were separate workflows. Never pass user-controlled event codes or payload data. The observer preserves method receiver, results and rejection objects.

Website /admin/telemetry shows daily UTC usage, feature detail and error groups with 90-day raw-event retention. GitHub ZIP snapshots are separate and manually refreshed there; deltas are between recorded snapshots, not guaranteed daily totals. Website implementation and deployment notes are in its docs/FOUNDRY-TELEMETRY.md.

## Verification

Run npm test and npm run check:design-system. In a local Foundry test world, run scripts/testing/telemetry.js through Core's shared in-game runner. It checks default consent boundaries and real rendered privacy controls without opting the world in or sending production reports. The optional localTelemetryDeliveryCheck from scripts/testing/telemetry-delivery.js temporarily changes reporting and ignored-user settings, routes all its delivery to a localhost collector, and restores the settings in finally. Run it only in a development world with other users offline.

The repeatable browser runner is tools/verify-telemetry-foundry.mjs. Set MORELORD_PLAYWRIGHT to the installed Playwright index.mjs, FOUNDRY_TEST_URL to the development server, and optionally MORELORD_TEST_COLLECTOR to the localhost endpoint. Default test users are Chuck and Thalin; override with FOUNDRY_TEST_GM, FOUNDRY_TEST_PLAYER and FOUNDRY_TEST_PASSWORD. It blocks production telemetry, retains reports/screenshots, and checks affected module initialization. It does not verify every gameplay workflow.

September 18, 2026: Foundry 14.368 / D&D5e 6.0.3 live checks passed: GM 7, player 4 with 2 intentional GM-only skips. The GM run includes a real Downtime window open/rerender (one event), local HTTP delivery, sanitized error frames and error-only consent without breadcrumbs. Privacy controls were rendered and inspected at 460px and 360px. The local website accepted unconnected reports and CORS preflight, rejected unexpected fields, protected the admin route, and stored duplicate retries once. Full gameplay completion coverage and additional theme verification remain outstanding; this is not a compatibility certification. No public deployment or module release was performed.


Credential follow-up: automated client/server credential tests and the running local website API passed (missing credential 401, valid and retry 200, mismatched world 403). The final credential-enabled Foundry delivery rerun remains outstanding: the development data directory is in use by the existing Dev1 server, so the earlier demo1 instance was not restarted. Earlier in-game results above predate the reporting-credential handshake.



## September 20 release verification

On Foundry 14.368 / D&D5e 6.0.3, GM and player consent checks passed. The credential-enabled Foundry client registered and sent usage and sanitized error reports to the deployed website through a localhost test relay; error-only consent excluded usage and breadcrumbs. Temporary reporting settings were restored in the disposable release-test world. Reports are retained under test/in-game-reports. This verifies reporting transport and consent, not every instrumented gameplay operation.
