const MODULE_ID = "morelord-core";
const PRODUCT_SLUG = "morelord-core";
const DEFAULT_SERVER = "https://morelordgaming.com";
const CACHE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

const SETTINGS = Object.freeze({
  SERVER_URL: "serverUrl",
  TOKEN: "installationToken",
  INSTALLATION_ID: "installationId",
  CONNECTION_LABEL: "connectionLabel",
  ENTITLEMENT_CACHE: "entitlementCache",
  SHARE_USAGE: "shareUsageStatistics"
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
  await game.settings.set(MODULE_ID, SETTINGS.ENTITLEMENT_CACHE, cache);
}

function isCacheUsable(entry) {
  if (!entry?.expiresAt) return false;
  return new Date(entry.expiresAt).getTime() + CACHE_GRACE_MS > Date.now();
}

async function refreshEntitlements(productSlug = PRODUCT_SLUG, { quiet = false } = {}) {
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
    Hooks.callAll("morelordCoreEntitlementsUpdated", productSlug, foundry.utils.deepClone(result));
    return result;
  } catch (error) {
    const cached = getCache()[productSlug];
    if (isCacheUsable(cached)) {
      if (!quiet) notify("warn", "Morelord Gaming could not be reached. Cached premium access remains available during the offline grace period.");
      return cached;
    }
    if (!quiet) notify("error", error.message);
    return null;
  }
}

function getEntitlements(productSlug = PRODUCT_SLUG) {
  const entry = getCache()[productSlug];
  return isCacheUsable(entry) ? entry : null;
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
      schemaVersion: 1,
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
      anonymousUsageStatistics: game.settings.get(MODULE_ID, SETTINGS.SHARE_USAGE)
    },
    modules: {
      activeCount: modules.length,
      active: modules
    },
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
      exportDiagnostics: MorelordConnectionApp.exportDiagnostics
    }
  };

  static PARTS = {
    content: { template: "modules/morelord-core/templates/connection.hbs" }
  };

  activation = null;

  async _prepareContext() {
    const token = game.settings.get(MODULE_ID, SETTINGS.TOKEN);
    const core = getEntitlements(PRODUCT_SLUG);
    return {
      connected: Boolean(token),
      connectionLabel: game.settings.get(MODULE_ID, SETTINGS.CONNECTION_LABEL),
      tier: core?.tier ?? "standard",
      features: core?.features ?? [],
      validatedAt: core?.validatedAt ? new Date(core.validatedAt).toLocaleString() : null,
      expiresAt: core?.expiresAt ? new Date(core.expiresAt).toLocaleString() : null,
      activation: this.activation,
      serverUrl: game.settings.get(MODULE_ID, SETTINGS.SERVER_URL),
      shareUsageStatistics: game.settings.get(MODULE_ID, SETTINGS.SHARE_USAGE),
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
      notify("info", "Morelord Core settings saved.");
      this.render({ force: true });
    } finally {
      target.disabled = false;
    }
  }

  static exportDiagnostics(event, target) {
    event.preventDefault();
    target.disabled = true;
    try {
      exportDiagnostics();
      notify("info", "Morelord diagnostics downloaded. Attach the JSON file to your support report.");
    } catch (error) {
      notify("error", `Could not export diagnostics: ${error.message}`);
    } finally {
      target.disabled = false;
    }
  }
}

Hooks.once("init", () => {
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
    name: "Share Anonymous Usage Statistics",
    hint: "Share only the Morelord Core and Foundry version during access checks. No campaign, player, actor, item, or chat data is collected.",
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
    restricted: true
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
});

Hooks.once("ready", async () => {
  const api = {
    designSystemVersion: "1.0.0",
    open: () => new MorelordConnectionApp().render({ force: true }),
    refresh: refreshEntitlements,
    getEntitlements,
    hasFeature,
    getTier,
    isConnected: () => Boolean(game.settings.get(MODULE_ID, SETTINGS.TOKEN)),
    disconnect,
    getDiagnostics,
    exportDiagnostics
  };
  game.modules.get(MODULE_ID).api = api;
  globalThis.MorelordCore = api;

  if (game.user.isGM && api.isConnected()) {
    await refreshEntitlements(PRODUCT_SLUG, { quiet: true });
  }
});
