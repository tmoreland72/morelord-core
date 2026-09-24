import { ChatRollRequests } from './services/chat-roll-requests.js';
import { organizeCompendiums, labelCompendiums } from './services/compendium-organization.js';
import { collectModuleDiagnostics } from "./services/module-diagnostics.js";
import { SettingsTransferApp } from "./ui/settings-transfer-app.js";
import { TelemetryService } from "./services/telemetry-service.js";
import { ContextualSocketService } from "./services/contextual-socket-service.js";
import { IGNORED_USERS_SETTING, isIgnored, listUsers, activePlayerForActor } from "./services/user-service.js";
import { IgnoredUsersApp } from "./ui/ignored-users-app.js";
import { WindowGeometryService } from "./services/window-geometry-service.js";
import { Dnd5eSourceFilterService } from "./services/dnd5e-source-filter-service.js";
import { resolveBookLabel, resolvePackLabel } from "./services/source-book-service.js";
import { CapabilityRegistry } from "./location/capability-registry.js";
import { LocationService } from "./location/location-service.js";
import { CAPABILITY_TIERS, SETTLEMENT_TYPES, evaluateRequirements, meetsTier } from "./location/location-domain.js";
import { LocationManagerApp } from "./location/location-manager-app.js";
import { renderPreservingScroll } from "./ui/scroll-preservation.js";
import { applyPageLayout } from "./ui/page-layout.js";
import { activateCardSelection } from "./ui/card-selection.js";
import { activateCollapsibleSections, createCollapsibleSection } from "./ui/collapsible-section.js";
import { actorIdentity, decorateActorSelect } from "./ui/actor-identity.js";
import { DocumentationService } from "./documentation/documentation-service.js";
import { DocumentationApp } from "./documentation/documentation-app.js";
import { listCharacterActors, listCharacterChoices, participantRecords, primaryPartyGroup, selectedCharacterUuids } from "./ui/actor-participation.js";
import { actorSkillModifier, extractNaturalD20, rollSkill } from "./services/skill-roll-service.js";
import { SUBSCRIPTION_TIERS, normalizeSubscriptionTier, capSubscriptionTier, applySubscriptionTesting } from "./services/subscription-testing.js";

const MODULE_ID = "morelord-core";
const telemetry = new TelemetryService();
Hooks.on("renderApplicationV2", applyPageLayout);
Hooks.on("renderApplication", applyPageLayout);
Hooks.on("renderApplicationV2", activateCardSelection);
Hooks.on("renderApplication", activateCardSelection);
Hooks.on("renderApplicationV2", activateCollapsibleSections);
Hooks.on("renderApplication", activateCollapsibleSections);
const contextualSocket = new ContextualSocketService();
const chatRequests = new ChatRollRequests(contextualSocket);
contextualSocket.start();
const windowGeometry = new WindowGeometryService({ moduleId: MODULE_ID, settingKey: "windowGeometry" });
const capabilityRegistry = new CapabilityRegistry();
const locationService = new LocationService({ moduleId: MODULE_ID, settingKey: "locations" });
const documentationService = new DocumentationService();
DocumentationApp.configure(documentationService);
LocationManagerApp.configure({ locationService, capabilityRegistry });
const PRODUCT_SLUG = "morelord-core";
const DEFAULT_SERVER = "https://morelordgaming.com";
const CACHE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

const SETTINGS = Object.freeze({
  SERVER_URL: "serverUrl",
  TOKEN: "installationToken",
  INSTALLATION_ID: "installationId",
  CONNECTION_LABEL: "connectionLabel",
  ENTITLEMENT_CACHE: "entitlementCache",
  SHARE_USAGE: "shareUsageStatistics",
  DEVELOPER_MODE: "developerMode",
  DEVELOPER_TIER: "developerTier"
});

function notify(level, message) {
  ui.notifications?.[level]?.(message);
}

function normalizeServerUrl(value) {
  return String(value || DEFAULT_SERVER).trim().replace(/\/$/, "");
}

async function request(path, options = {}) {
  const server = normalizeServerUrl(game.settings.get(MODULE_ID, SETTINGS.SERVER_URL));
  const response = await fetch(`${server}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {})
    }
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Morelord server request failed (${response.status}).`);
  }

  return payload;
}

function getCache() {
  return foundry.utils.deepClone(game.settings.get(MODULE_ID, SETTINGS.ENTITLEMENT_CACHE) || {});
}

async function setCache(cache) {
  if (!game.user?.isGM) return;
  await game.settings.set(MODULE_ID, SETTINGS.ENTITLEMENT_CACHE, cache);
}

function isCacheUsable(entry) {
  if (!entry?.expiresAt) return false;
  return new Date(entry.expiresAt).getTime() + CACHE_GRACE_MS > Date.now();
}

async function refreshEntitlements(productSlug = PRODUCT_SLUG, { quiet = false } = {}) {
  // Entitlements are shared world state. Player clients consume the GM's
  // cached snapshot and must never attempt to refresh or persist it.
  if (!game.user?.isGM) return getEntitlements(productSlug);
  const token = game.settings.get(MODULE_ID, SETTINGS.TOKEN);
  if (!token) return null;

  try {
    const shareUsage = game.settings.get(MODULE_ID, SETTINGS.SHARE_USAGE);
    const telemetryHeaders = shareUsage ? {
      "x-morelord-core-version": game.modules.get(MODULE_ID)?.version || "",
      "x-foundry-version": game.version || ""
    } : {};
    const result = await request(`/api/foundry/entitlements?product=${encodeURIComponent(productSlug)}`, {
      method: "GET",
      headers: { authorization: `Bearer ${token}`, ...telemetryHeaders }
    });

    const cache = getCache();
    cache[productSlug] = result;
    await setCache(cache);
    const effective = getEntitlements(productSlug);
    Hooks.callAll("morelordCoreEntitlementsUpdated", productSlug, effective);
    return effective;
  } catch (error) {
    const cached = getCache()[productSlug];
    if (isCacheUsable(cached)) {
      if (!quiet) notify("warn", "Morelord Gaming could not be reached. Cached premium access remains available during the offline grace period.");
      return getEntitlements(productSlug);
    }
    if (!quiet) notify("error", error.message);
    return null;
  }
}

function getActualEntitlements(productSlug = PRODUCT_SLUG) {
  const entry = getCache()[productSlug];
  return isCacheUsable(entry) ? entry : null;
}

function getEntitlements(productSlug = PRODUCT_SLUG) {
  return applySubscriptionTesting(getActualEntitlements(productSlug), {
    enabled: game.settings.get(MODULE_ID, SETTINGS.DEVELOPER_MODE),
    tier: game.settings.get(MODULE_ID, SETTINGS.DEVELOPER_TIER),
    actualTier: getActualEntitlements()?.tier
  });
}

function notifySubscriptionTestingChanged() {
  for (const product of new Set([PRODUCT_SLUG, ...Object.keys(getCache())])) {
    Hooks.callAll("morelordCoreEntitlementsUpdated", product, getEntitlements(product));
  }
}

function hasFeature(featureKey, productSlug = PRODUCT_SLUG) {
  return Boolean(getEntitlements(productSlug)?.features?.includes(featureKey));
}

function getTier(productSlug = PRODUCT_SLUG) {
  return getEntitlements(productSlug)?.tier ?? "standard";
}

function packageDiagnostics(pkg) {
  if (!pkg) return null;
  const compatibility = pkg.compatibility ?? {};
  return {
    id: pkg.id,
    title: pkg.title,
    version: pkg.version,
    active: pkg.active ?? undefined,
    compatibility: {
      minimum: compatibility.minimum ?? null,
      verified: compatibility.verified ?? null,
      maximum: compatibility.maximum ?? null
    }
  };
}

function getRendererDiagnostics() {
  try {
    const renderer = canvas?.app?.renderer;
    const gl = renderer?.gl;
    if (!renderer || !gl) return null;
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      type: renderer.type === 1 ? "WebGL" : String(renderer.type ?? "unknown"),
      webglVersion: gl.getParameter(gl.VERSION),
      vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE)
    };
  } catch (error) {
    return { unavailable: true, reason: error.message };
  }
}

/** Build a support report without account credentials, world identity, or game content. */
function getDiagnostics() {
  const modules = Array.from(game.modules?.values?.() ?? [])
    .filter((module) => module.active)
    .map(packageDiagnostics)
    .sort((a, b) => a.id.localeCompare(b.id));
  const core = game.modules.get(MODULE_ID);

  return {
    report: {
      schemaVersion: 2,
      generatedAt: new Date().toISOString(),
      privacy: "Excludes account tokens, installation IDs, server/world names and IDs, network addresses, users, and game document content."
    },
    foundry: {
      version: game.version ?? null,
      build: game.release?.build ?? null,
      generation: game.release?.generation ?? null,
      channel: game.release?.channel ?? null
    },
    system: packageDiagnostics(game.system),
    morelordCore: {
      version: core?.version ?? null,
      connected: Boolean(game.settings.get(MODULE_ID, SETTINGS.TOKEN)),
      entitlementCachePresent: Object.keys(getCache()).length > 0,
      anonymousUsageStatistics: game.settings.get(MODULE_ID, SETTINGS.SHARE_USAGE),
      featureUsageReporting: telemetry.enabled("usage"),
      errorReporting: telemetry.enabled("error")
    },
    modules: {
      activeCount: modules.length,
      active: modules
    },
    moduleDiagnostics: collectModuleDiagnostics(game.modules.values()),
    client: {
      userAgent: navigator.userAgent,
      platform: navigator.userAgentData?.platform ?? navigator.platform ?? null,
      language: navigator.language ?? null,
      languages: navigator.languages ?? [],
      hardwareConcurrency: navigator.hardwareConcurrency ?? null,
      deviceMemoryGiB: navigator.deviceMemory ?? null,
      screen: {
        width: screen?.width ?? null,
        height: screen?.height ?? null,
        pixelRatio: window.devicePixelRatio ?? null
      },
      renderer: getRendererDiagnostics()
    }
  };
}

function exportDiagnostics() {
  const diagnostics = getDiagnostics();
  const date = diagnostics.report.generatedAt.slice(0, 10);
  const worldIndex = String(game.world?.id || "unknown-world")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown-world";
  foundry.utils.saveDataToFile(
    JSON.stringify(diagnostics, null, 2),
    "application/json",
    `morelord-diagnostics-${worldIndex}-${date}.json`
  );
  return diagnostics;
}

async function disconnect() {
  await game.settings.set(MODULE_ID, SETTINGS.TOKEN, "");
  await game.settings.set(MODULE_ID, SETTINGS.INSTALLATION_ID, "");
  await game.settings.set(MODULE_ID, SETTINGS.CONNECTION_LABEL, "");
  await setCache({});
  Hooks.callAll("morelordCoreDisconnected");
}

async function beginActivation(app) {
  const result = await request("/api/foundry/activation/start", {
    method: "POST",
    body: JSON.stringify({
      productSlug: PRODUCT_SLUG,
      installationLabel: `${game.world?.title || "Foundry World"} (${game.data?.address || "local"})`,
      worldId: game.world?.id,
      worldName: game.world?.title,
      foundryVersion: game.version,
      moduleVersion: game.modules.get(MODULE_ID)?.version
    })
  });

  app.activation = result;
  app.render({ force: true });
  window.open(result.verificationUrl, "_blank", "noopener,noreferrer");
  pollActivation(app, result).catch((error) => notify("error", error.message));
}

async function pollActivation(app, activation) {
  const expiresAt = new Date(activation.expiresAt).getTime();
  while (Date.now() < expiresAt && app.activation?.activationId === activation.activationId) {
    await new Promise((resolve) => setTimeout(resolve, Math.max(3, activation.pollIntervalSeconds || 5) * 1000));
    const result = await request("/api/foundry/activation/poll", {
      method: "POST",
      body: JSON.stringify({ activationId: activation.activationId, deviceSecret: activation.deviceSecret })
    });

    if (result.status === "pending") continue;
    if (result.status === "approved") {
      await game.settings.set(MODULE_ID, SETTINGS.TOKEN, result.token);
      await game.settings.set(MODULE_ID, SETTINGS.INSTALLATION_ID, result.installationId);
      await game.settings.set(MODULE_ID, SETTINGS.CONNECTION_LABEL, game.world?.title || "Foundry World");
      app.activation = null;
      await refreshEntitlements(PRODUCT_SLUG, { quiet: true });
      app.render({ force: true });
      notify("info", "Morelord account connected successfully. You may close the browser account page.");
      Hooks.callAll("morelordCoreConnected", result.installationId);
      return;
    }
    app.activation = null;
    app.render({ force: true });
    throw new Error(`Activation ${result.status}. Start again to create a new code.`);
  }
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class MorelordConnectionApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "morelord-core-connection",
    classes: ["ml-window", "ml-core-window"],
    tag: "form",
    window: { title: "Morelord Account", icon: "fa-solid fa-crown", resizable: true },
    position: { width: 620, height: "auto" },
    form: { closeOnSubmit: false },
    actions: {
      connect: MorelordConnectionApp.connect,
      refresh: MorelordConnectionApp.refresh,
      disconnect: MorelordConnectionApp.disconnect,
      openAccount: MorelordConnectionApp.openAccount,
      saveSettings: MorelordConnectionApp.saveSettings,
      openDocumentation: MorelordConnectionApp.openDocumentation
    }
  };

  static PARTS = {
    content: { template: "modules/morelord-core/templates/connection.hbs" }
  };

  activation = null;

  async _prepareContext() {
    const token = game.settings.get(MODULE_ID, SETTINGS.TOKEN);
    const core = getActualEntitlements(PRODUCT_SLUG);
    const actualTier = normalizeSubscriptionTier(core?.tier);
    const developerTier = capSubscriptionTier(game.settings.get(MODULE_ID, SETTINGS.DEVELOPER_TIER), actualTier);
    return {
      connected: Boolean(token),
      connectionLabel: game.settings.get(MODULE_ID, SETTINGS.CONNECTION_LABEL),
      tier: core?.tier ?? "standard",
      features: core?.features ?? [],
      developerMode: game.settings.get(MODULE_ID, SETTINGS.DEVELOPER_MODE),
      effectiveTier: getTier(),
      developerTiers: SUBSCRIPTION_TIERS.map(value => ({
        value, label: value[0].toUpperCase() + value.slice(1),
        selected: value === developerTier,
        disabled: capSubscriptionTier(value, actualTier) !== value
      })),
      validatedAt: core?.validatedAt ? new Date(core.validatedAt).toLocaleString() : null,
      expiresAt: core?.expiresAt ? new Date(core.expiresAt).toLocaleString() : null,
      activation: this.activation,
      serverUrl: game.settings.get(MODULE_ID, SETTINGS.SERVER_URL),
      shareUsageStatistics: game.settings.get(MODULE_ID, SETTINGS.SHARE_USAGE),
      shareErrorReports: game.settings.get(MODULE_ID, "shareErrorReports"),
      accountUrl: this.activation?.verificationUrl || `${normalizeServerUrl(game.settings.get(MODULE_ID, SETTINGS.SERVER_URL))}/account`
    };
  }

  static async connect(event, target) {
    event.preventDefault();
    target.disabled = true;
    try { await beginActivation(this); }
    catch (error) { notify("error", error.message); }
    finally { target.disabled = false; }
  }

  static async refresh(event, target) {
    event.preventDefault();
    target.disabled = true;
    try {
      await refreshEntitlements(PRODUCT_SLUG);
      this.render({ force: true });
    } finally { target.disabled = false; }
  }

  static async disconnect(event) {
    event.preventDefault();
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Disconnect Morelord Account" },
      content: "<p>Disconnect this Foundry installation from your Morelord account?</p>",
      modal: true
    });
    if (!confirmed) return;
    await disconnect();
    this.activation = null;
    this.render({ force: true });
  }

  static openAccount(event) {
    event.preventDefault();
    const url = this.activation?.verificationUrl || `${normalizeServerUrl(game.settings.get(MODULE_ID, SETTINGS.SERVER_URL))}/account`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  static async saveSettings(event, target) {
    event.preventDefault();
    if (!game.user?.isGM) return;
    const form = target.closest("form") ?? this.element;
    const data = new FormData(form);
    const serverUrl = normalizeServerUrl(data.get(SETTINGS.SERVER_URL));
    if (!/^https?:\/\//i.test(serverUrl)) {
      notify("error", "Morelord Gaming Website must be an HTTP or HTTPS URL.");
      return;
    }
    target.disabled = true;
    try {
      await game.settings.set(MODULE_ID, SETTINGS.SERVER_URL, serverUrl);
      await game.settings.set(MODULE_ID, SETTINGS.SHARE_USAGE, data.has(SETTINGS.SHARE_USAGE));
      await game.settings.set(MODULE_ID, "shareErrorReports", data.has("shareErrorReports"));
      await game.settings.set(MODULE_ID, "telemetryConsentVersion", 1);
      await game.settings.set(MODULE_ID, "telemetryNoticeVersion", 1);
      await game.settings.set(MODULE_ID, SETTINGS.DEVELOPER_TIER,
        capSubscriptionTier(data.get(SETTINGS.DEVELOPER_TIER), getActualEntitlements()?.tier));
      await game.settings.set(MODULE_ID, SETTINGS.DEVELOPER_MODE, data.has(SETTINGS.DEVELOPER_MODE));
      notify("info", "Morelord Core settings saved. Reopen module windows to update access displays.");
      this.render({ force: true });
    } finally {
      target.disabled = false;
    }
  }

  static exportDiagnostics(event, target) {
    event?.preventDefault();
    if (target) target.disabled = true;
    try {
      exportDiagnostics();
      notify("info", "Morelord diagnostics downloaded. Attach the JSON file to your support report.");
    } catch (error) {
      notify("error", `Could not export diagnostics: ${error.message}`);
    } finally {
      if (target) target.disabled = false;
    }
  }

  static openDocumentation() {
    documentationService.register({
      id: "morelord-core", title: "Morelord Core", icon: "fa-solid fa-link",
      subtitle: "Shared premium access for Morelord Tools modules.",
      sections: [
        { id: "account", title: "Morelord Account", icon: "fa-solid fa-user", introduction: "Use this page to connect your Morelord account and review the membership and access information shared by Morelord Tools modules." },
        { id: "diagnostics", title: "Troubleshooting", icon: "fa-solid fa-stethoscope", introduction: "Use Download Troubleshooting File in Core’s settings list to create a report for Morelord support. It includes Foundry, game system, module, browser, and graphics details. It excludes account credentials, installation and world identifiers, network addresses, users, and campaign content." }
      ]
    });
    return new DocumentationApp({ productId: "morelord-core" }).render({ force: true });
  }
}

// Foundry settings menus instantiate an Application and call render. This action only downloads.
class MorelordDiagnosticsDownloadApp extends ApplicationV2 {
  render() {
    if (game.user?.isGM) MorelordConnectionApp.exportDiagnostics();
    return this;
  }
}

class MorelordDiscordApp extends ApplicationV2 {
  render() {
    window.open("https://discord.gg/B5YKQf579E", "_blank", "noopener,noreferrer");
    return this;
  }
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "compendiumOrganization", {scope:"world", config:false, type:Object, default:{}});
  telemetry.registerSettings();
  for (const [key, type, defaultValue] of [
    [SETTINGS.DEVELOPER_MODE, Boolean, false],
    [SETTINGS.DEVELOPER_TIER, String, "standard"]
  ]) {
    game.settings.register(MODULE_ID, key, {
      scope: "world", config: false, type, default: defaultValue,
      restricted: true, onChange: notifySubscriptionTestingChanged
    });
  }
  game.settings.register(MODULE_ID, IGNORED_USERS_SETTING, {
    scope: "world", config: false, type: Array, default: [], restricted: true
  });
  locationService.registerSetting();
  for (const definition of [
    { id: "forge", name: "Forge" },
    { id: "marketplace", name: "Marketplace" },
    { id: "alchemist", name: "Alchemist" },
    { id: "library", name: "Library" },
    { id: "temple", name: "Temple" },
    { id: "contractor", name: "Contractor" },
    { id: "instructor", name: "Instructor", supportsSpecialty: true },
    { id: "workshop", name: "Workshop" }
  ]) capabilityRegistry.register(definition);
  windowGeometry.start();
  game.settings.register(MODULE_ID, SETTINGS.SERVER_URL, {
    name: "Morelord Gaming Website",
    hint: "The website used for account activation and entitlement checks.",
    scope: "world",
    config: false,
    type: String,
    default: DEFAULT_SERVER,
    restricted: true
  });
  game.settings.register(MODULE_ID, SETTINGS.SHARE_USAGE, {
    name: "Share Usage Statistics",
    hint: "Selected by default in the one-time GM notice. Save your choice to share feature events and versions using a random world reporting ID; turn off anytime in Core Settings.",
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
    restricted: true,
    onChange: () => telemetry.reset()
  });
  for (const [key, type, defaultValue] of [
    [SETTINGS.TOKEN, String, ""],
    [SETTINGS.INSTALLATION_ID, String, ""],
    [SETTINGS.CONNECTION_LABEL, String, ""],
    [SETTINGS.ENTITLEMENT_CACHE, Object, {}]
  ]) {
    game.settings.register(MODULE_ID, key, { scope: "world", config: false, type, default: defaultValue, restricted: true });
  }
  game.settings.registerMenu(MODULE_ID, "account", {
    name: "Morelord Account",
    label: "Connect or Manage Account",
    hint: "Connect this Foundry world to Morelord Gaming and review premium access.",
    icon: "fa-solid fa-crown",
    type: MorelordConnectionApp,
    restricted: true
  });
  game.settings.registerMenu(MODULE_ID, "ignoredUsers", {
    name: "Ignored Users", label: "Select Ignored Users",
    hint: "Exclude accounts such as OBS from Morelord user lists and form delivery.",
    icon: "fa-solid fa-user-slash", type: IgnoredUsersApp, restricted: true
  });
  game.settings.registerMenu(MODULE_ID, "locations", {
    name: "Morelord Locations",
    label: "Manage Shared Locations",
    hint: "Define settlement types, capabilities, and Scene associations shared by Morelord modules.",
    icon: "fa-solid fa-map-location-dot",
    type: LocationManagerApp,
    restricted: true
  });
  game.settings.registerMenu(MODULE_ID, "settingsTransfer", {
    name: "Morelord Configuration", label: "Export / Import Settings",
    hint: "Transfer configuration for all enabled Morelord modules using a JSON file.",
    icon: "fa-solid fa-file-export", type: SettingsTransferApp, restricted: true
  });
  game.settings.registerMenu(MODULE_ID, "troubleshooting", {
    name: "Troubleshooting",
    label: "Download Troubleshooting File",
    hint: "Download diagnostics for Morelord support. No Morelord Gaming account or connection is required.",
    icon: "fa-solid fa-stethoscope",
    type: MorelordDiagnosticsDownloadApp,
    restricted: true
  });
  game.settings.registerMenu(MODULE_ID, "discord", {
    name: "Discord Community",
    label: "Join Discord",
    hint: "Join the Morelord Gaming Discord server for support, feature requests, and general discussions.",
    icon: "fa-brands fa-discord",
    type: MorelordDiscordApp,
    restricted: false
  });
});

Hooks.once("ready", async () => {
  const api = {
    compendiums: Object.freeze({organize: organizeCompendiums, labels: labelCompendiums}),
    telemetry,
    chatRequests,
    users: Object.freeze({ isIgnored, list: listUsers, activePlayerForActor }),
    designSystemVersion: "1.1.0",
    open: () => new MorelordConnectionApp().render({ force: true }),
    refresh: refreshEntitlements,
    getEntitlements,
    hasFeature,
    getTier,
    isConnected: () => Boolean(game.settings.get(MODULE_ID, SETTINGS.TOKEN)),
    disconnect,
    getDiagnostics,
    exportDiagnostics,
    windowGeometry: Object.freeze({
      remember: application => windowGeometry.remember(application),
      reset: windowId => windowGeometry.reset(windowId)
    }),
    ui: Object.freeze({
      actorIdentity,
      decorateActorSelect,
      applyPageLayout,
      activateCardSelection,
      activateCollapsibleSections,
      createCollapsibleSection,
      renderPreservingScroll,
      participation: Object.freeze({ listCharacterActors, listCharacterChoices, participantRecords, primaryPartyGroup, selectedCharacterUuids }),
      documentation: Object.freeze({
        register: definition => documentationService.register(definition),
        get: id => documentationService.get(id),
        list: () => documentationService.list(),
        open: id => new DocumentationApp({ productId: id }).render({ force: true })
      })
    }),
    sources: Object.freeze({ resolveBookLabel, resolvePackLabel, filter: new Dnd5eSourceFilterService() }),
    rolls: Object.freeze({ skill: rollSkill, skillModifier: actorSkillModifier, naturalD20: extractNaturalD20 }),
    socket: Object.freeze({
      get ready() { return contextualSocket.ready; },
      createChannel: namespace => contextualSocket.createChannel(namespace),
      runSerialized: (key, callback) => contextualSocket.runSerialized(key, callback)
    }),
    locations: Object.freeze({
      settlementTypes: SETTLEMENT_TYPES,
      capabilityTiers: CAPABILITY_TIERS,
      meetsTier,
      registerCapability: definition => capabilityRegistry.register(definition),
      getCapability: id => capabilityRegistry.get(id),
      listCapabilities: () => capabilityRegistry.all(),
      list: () => locationService.list(),
      get: id => locationService.get(id),
      forScene: sceneId => locationService.forScene(sceneId),
      current: () => locationService.current(),
      save: location => locationService.save(location),
      remove: id => locationService.remove(id),
      evaluate: (requirements, context) => locationService.evaluate(requirements, context),
      evaluateRequirements,
      open: options => new LocationManagerApp(options).render({ force: true })
    }),
    openLocations: options => new LocationManagerApp(options).render({ force: true })
  };
  game.modules.get(MODULE_ID).api = api;
  globalThis.MorelordCore = api;
  telemetry.start();
  chatRequests.start();

  if (game.user.isGM && api.isConnected()) {
    await refreshEntitlements(PRODUCT_SLUG, { quiet: true });
  }
});
