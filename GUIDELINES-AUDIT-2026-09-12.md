# Morelord guidelines audit — September 12, 2026

## Remediation update

The findings below are the original audit snapshot. Following the owner's clarification, Character Export and Downtime are explicitly exempt from standard production release steps until production-ready; their shared UI obligations remain in force. That exemption is historical: Character Export and Downtime now follow standard release requirements. Downtime release tooling and documentation were added on 2026-09-15; publication still requires Foundry approval and live compatibility verification.

Completed in the follow-up:

- Added mandatory documentation review, updates, and completion reporting to Core's AGENTS.md and synchronized all seven repositories.
- Corrected the Core release-token instructions and the four production feature modules' manual versions and Core requirements. Updated outdated Craftworks tool-check text, Marketplace cart workflows and shop capabilities, and Journeys travel-context and zero-DC guidance.
- Fixed Downtime's shared chat-card class and accessible Clear Search label. Included both development modules in the default design check, removed the stylesheet-directory skip, and corrected chat-template classification.
- Consolidated Craftworks, Journeys, Marketplace, and Shop Manager scrolling through Core, with nested-region, deferred-render, phase-reset, and tab-memory behavior covered by regression checks.
- Added Core portrait decoration for Marketplace's ID-valued actor selectors without changing stored actor IDs. Replaced Marketplace's local HTML escaping implementation with Foundry's native utility.
- Synchronized the four production feature release scripts with Core and required documentation packaging and landing-page version validation for Craftworks, Journeys, and Marketplace. Encounters already had those documentation guards.

Validation: 284 Node tests passed across all seven repositories; the default design-system check passed for all six feature modules. Production documentation metadata and required packaging paths were verified against the local manifests. Eleven changed JavaScript files passed syntax checks and seven changed Handlebars templates compiled. No release was published and no manifest version was bumped. These changes to Core and its consumers need a coordinated release, with dependency minimums set to the actual new Core release version at that time.

Remaining acceptance work: live Foundry visual, focus, scroll, and multiplayer checks, including manual screenshots. Marketplace's specialized shop/editor layouts remain module-owned; broader visual refinements in its earlier audit are not claimed complete by these code and documentation corrections.

## Original audit snapshot

The seven local repositories are **partially aligned**, but full enforcement cannot be confirmed. All existing Node tests pass. Confirmed gaps remain in documentation, release setup, shared UI reuse, and the scope of the design-system checker.

This audit covers current local working trees, including pre-existing uncommitted changes. It evaluates observable implementation against AGENTS.md; it cannot establish whether every past coding task read the guidelines or performed live verification. No implementation fixes, releases, commits, or world-data changes were made during this audit.

## Verification results

| Repository | Manifest version | Node tests | Current assessment |
| --- | --- | --- | --- |
| Core | 0.3.5 | 31 passed | Shared services exist; release documentation and checker coverage need correction. |
| Character Export | 0.3.2 | 1 passed | Export test passes; current release setup is incomplete and README release instructions are stale. |
| Craftworks | 0.4.7 | 55 passed | Uses Core services and passes the design check; generic scroll handling remains local and manuals are stale. |
| Downtime | 0.1.0 | 37 passed | Uses Core services and documents its activities; design-rule gaps and release setup remain. |
| Encounters | 0.1.10 | 48 passed | Uses Core and passes the design check; documented Core requirement differs from the working manifest. |
| Journeys | 0.3.2 | 97 passed | Uses Core and passes the design check; manuals and scroll handling need review. |
| Marketplace | 0.9.4 | 8 passed | Uses Core and passes the design check; manuals and previously recorded consolidation work remain. |

Total: **277 tests passed, zero failed**, using `node --test` in each repository. Manifest entry-point JavaScript syntax checks passed in all seven repositories. All six existing release scripts passed PowerShell syntax parsing; Downtime has no release script.

All seven AGENTS.md files have identical SHA-256 hashes. They are currently untracked in Git, so their presence has been verified locally, not in fresh clones or remote repositories.

## Confirmed findings

### 1. Character Export's current release script cannot run with its local configuration

[release.ps1](../morelord-character-export/release.ps1) requires `release.config.json` at line 515, but that file is absent. There are also no `RELEASE-NOTES-*.md` files in this repository. The current release script is an existing uncommitted change.

[README.md](../morelord-character-export/README.md) still documents `-BuildOnly`, which the current script does not accept. Its installation URL uses the `morelordgaming` owner, while the manifest uses `tmoreland72`; this is a local documentation inconsistency, not a verified claim that the remote URL is unreachable.

Action: complete this repository's standard release configuration and release notes, then align the README with the actual script and manifest.

### 2. Public manuals disagree with current compatibility requirements

| Repository | Documentation claim | Current manifest |
| --- | --- | --- |
| Craftworks | [GM manual](../morelord-craftworks/docs/gm-manual.md), line 53: Core 0.1.0+. Manuals identify Craftworks 0.4.6. | Core 0.3.5+; Craftworks 0.4.7. |
| Encounters | [GM manual](../morelord-encounters/docs/gm-manual.md), line 18, and [docs landing page](../morelord-encounters/docs/README.md), line 23: Core 0.3.3+. | Core 0.3.4+. The manifest currently has uncommitted changes. |
| Journeys | [GM manual](../morelord-journeys/docs/gm-manual.md), line 18: Core 0.1.0+. Manuals identify 0.2.0; the [landing page](../morelord-journeys/docs/README.md), line 23, says 0.1.0. | Core 0.3.4+; Journeys 0.3.2. |
| Marketplace | [GM manual](../morelord-marketplace/docs/gm-manual.md), line 52: Core 0.1.0+. Manuals identify Marketplace 0.6.0. | Core 0.3.5+; Marketplace 0.9.4. |

These are concrete documentation mismatches. Fixing version labels alone is insufficient: compare workflows and screenshots against the intervening changes as well. This audit did not validate every manual paragraph or screenshot.

Core's [README.md](README.md), line 79, instructs users to set `MORELORD_RELEASE_TOKEN`, while [release.ps1](release.ps1), line 539, reads `RELEASE_PUBLISH_TOKEN`. Following the README alone does not supply the token expected by the script.

### 3. Downtime does not fully follow the shared UI contract

- [training-selection.hbs](../morelord-downtime/templates/training-selection.hbs), line 7: the icon-only Clear Search button has a title but lacks the `aria-label` explicitly required by the brand guide and checker.
- [source-item-result.hbs](../morelord-downtime/templates/chat/source-item-result.hbs), line 1: the generated chat card uses only `ml-source-item-chat`, omitting the shared `ml-chat-card` class required by the brand guide. The template is rendered into chat by `scripts/activities/source-item/source-item-resolution-service.mjs`.

The checker reports the second item as a missing `ml-app` root. That diagnosis is inappropriate for a chat template: apply the chat-card contract and correct the checker's classification rather than blindly turning a chat card into an application shell.

### 4. The default design check does not cover the whole suite

[tools/check-design-system.mjs](tools/check-design-system.mjs) lists only Marketplace, Journeys, Craftworks, and Encounters in `DEFAULT_MODULES`. The default command passed for those four modules.

The expanded command was:

```powershell
node tools/check-design-system.mjs ../morelord-character-export ../morelord-craftworks ../morelord-downtime ../morelord-encounters ../morelord-journeys ../morelord-marketplace
```

It failed on the two Downtime templates above. The script also skips repositories without a `styles` directory, so including Character Export in the argument list does not give it meaningful UI coverage. Several rules explicitly recognize only the original four feature prefixes. Core's own UI is outside this feature-boundary checker by design and needs its own appropriate checks.

Action: include Downtime by default, distinguish chat templates from full applications, and document the checker's actual coverage. A passing boundary check does not prove visual consistency, responsive behavior, or correct interactions.

### 5. Generic scroll preservation remains implemented outside Core

Core exposes [renderPreservingScroll](scripts/ui/scroll-preservation.js) through `MorelordCore.ui` and uses it internally. Marketplace's main application and Downtime already consume it.

Craftworks' [scroll-preserving-application-mixin.mjs](../morelord-craftworks/scripts/ui/scroll-preserving-application-mixin.mjs) retains its own capture, restore, element-signature, and scrollable-element discovery implementation used throughout the module. Journeys' [journey-app.mjs](../morelord-journeys/scripts/apps/journey-app.mjs), beginning at line 81, also performs local scroll preservation.

These are opportunities to fulfill the Core-first guideline. They are not proven drop-in replacements: Craftworks handles arbitrary nested scroll regions and deferred restoration, while Journeys also resets position between phases. Preserve those requirements, extending Core only where a demonstrated shared need exists, then remove redundant local mechanisms after live verification.

Marketplace's existing [shared-component audit](../morelord-marketplace/SHARED-COMPONENT-AUDIT.md) also records remaining nested-scroll, actor-identity, and custom-presentation work. Some findings in that older report have since changed, such as the Core minimum version; do not treat the entire historical report as current without checking it.

### 6. Release and documentation safeguards are uneven

- Downtime has no `release.ps1`, `release.config.json`, or release-note files. This is an incomplete release setup, not evidence that an incorrect public release occurred.
- Encounters explicitly requires its `docs` directory and validates its documentation landing-page version through [release.config.json](../morelord-encounters/release.config.json).
- Craftworks treats `docs` as optional and has no equivalent documentation-version configuration in [release.config.json](../morelord-craftworks/release.config.json).
- Journeys and Marketplace have manuals, but their release configurations do not include `docs` in required or optional packaging paths and do not configure the equivalent documentation-version check. This concerns release packaging and validation; it does not imply their in-app documentation is absent, since modules can register documentation directly in JavaScript.
- Core's release script and the Character Export/Craftworks scripts match after line-ending normalization. Encounters, Journeys, and Marketplace retain another variant with duplicated website-payload construction. The inspected differences do not establish a release failure, but the shared script standard has drifted.

Action: agree on the intended documentation distribution for each module, make the corresponding release checks explicit, and synchronize applicable shared release improvements. No release dry runs were performed; this audit checked configuration and syntax without publishing or changing manifests.

### 7. The stronger documentation rule is still only a proposal

The synchronized [AGENTS.md](AGENTS.md) says to keep public documentation aligned, but it does not contain the later proposed requirement to review documentation as part of every code change and report what was updated or why no update was needed.

Action: add that explicit requirement to Core and synchronize it when approved as an instruction change. The audit did not silently modify the standard it was evaluating.

## Positive evidence and limits

- Core owns shared UI services, source-book labels, locations, participation, user selection, skill rolls, and socket channels. Feature-module call sites show meaningful reuse, not merely matching file names.
- Craftworks, Encounters, Journeys, and Marketplace passed the existing design-boundary checks. Downtime uses Core locations, participation, documentation registration, and scroll preservation despite its two template gaps.
- Character Export has no declared Core dependency and provides a sheet action rather than its own styled application. Adding a Core dependency solely to satisfy an abstract reuse rule is not warranted by this audit.
- Downtime distinguishes recommended suite integrations from its required Core dependency and checks for optional APIs. Its in-app documentation includes Training, Commissions, and Source Item; the absence of separate Markdown user manuals is not proof of absent user documentation.
- Reviewed entitlement/access code delegates to Core and showed no campaign-data deletion on expiry. Core disconnect clears connection settings and entitlement cache. Passing tests include legacy participation mappings, subscription downgrade behavior, and persistent session/project behavior. This is limited positive evidence, not an exhaustive migration or data-loss certification.

Still requiring live Foundry verification: declared Foundry/system compatibility, light/dark themes, resized windows, 200% zoom, keyboard and focus behavior, scroll restoration, GM/player socket interactions, optional integrations disabled, data migration from older worlds, premium expiry with saved campaign data, and transaction rollback under real document failures. No live world was modified or exercised during this audit.

## Suggested remediation order

1. Repair Character Export's release setup and the incorrect release instructions.
2. Update manuals and dependency requirements against current manifests and behavior.
3. Fix Downtime's shared chat-card and accessible-label gaps, and expand the checker accurately.
4. Consolidate generic scrolling through Core while preserving demonstrated behavior.
5. Complete Downtime's release setup and align documentation checks and shared release scripts.
6. Add the stronger documentation rule, synchronize and track the AGENTS.md files, then perform live Foundry acceptance checks.
