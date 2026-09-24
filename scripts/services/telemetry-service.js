const CORE = "morelord-core";
export const TELEMETRY_MODULES = [CORE, "morelord-journeys", "morelord-downtime", "morelord-craftworks", "morelord-encounters", "morelord-marketplace", "morelord-character-export"];
const CODE = /^[a-z][a-z0-9_.-]{0,79}$/;
const VERSION = /^[a-zA-Z0-9.+_-]{1,40}$/;
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

// Keep code locations, never URL hosts, query strings, function arguments, or raw custom messages.
export function errorDetails(error) {
  const type = ["Error", "TypeError", "RangeError", "ReferenceError", "SyntaxError", "URIError", "EvalError", "AggregateError"].includes(error?.name) ? error.name : "Error";
  const frames = String(error?.stack ?? "").split("\n").slice(1).flatMap(line => {
    const match = line.match(/(?:\/|\\)modules[\/\\](morelord-[a-z-]+)[\/\\]([a-zA-Z0-9_./-]+\.(?:m?js)):(\d+):(\d+)/);
    return match && TELEMETRY_MODULES.includes(match[1]) ? [`${match[1]}/${match[2]}:${match[3]}:${match[4]}`] : [];
  }).slice(0, 8);
  return { type, frames };
}

export class TelemetryService {
  queue = [];
  pending = null;
  sending = false;
  controller = null;
  generation = 0;
  availableDay = "";
  recent = [];
  seenErrors = new WeakSet();
  registering = false;
  rejectedToken = null;
  noticeAttempted = false;

  constructor({ game = () => globalThis.game, fetch = (...args) => globalThis.fetch(...args) } = {}) {
    this.game = game;
    this.fetch = fetch;
  }

  registerSettings() {
    const settings = this.game().settings;
    for (const [key, type, value] of [["telemetryNoticeVersion", Number, 0], ["telemetryConsentVersion", Number, 0], ["shareErrorReports", Boolean, true], ["telemetryCredentials", Object, {}]]) {
      settings.register(CORE, key, { scope: "world", config: false, restricted: true, type, default: value,
        onChange: () => { if (key !== "telemetryCredentials") this.reset(); } });
    }
  }

  async showNotice() {
    const game = this.game();
    if (!game.user?.isGM || this.noticeAttempted || game.settings.get(CORE, "telemetryNoticeVersion") >= 1) return;
    this.noticeAttempted = true;
    const usage = game.settings.get(CORE, "shareUsageStatistics");
    const errors = game.settings.get(CORE, "shareErrorReports");
    await foundry.applications.api.DialogV2.wait({
      id: "morelord-core-reporting-notice",
      classes: ["ml-window"],
      window: { title: "Morelord Reporting Preferences", resizable: true },
      position: { width: 520 },
      content: `<div><section class="ml-app ml-app-shell ml-dialog-shell ml-stack">
        <header class="ml-section-heading"><div><h2>Help us improve</h2><p>Choose what this world shares with Morelord Gaming.</p></div></header>
        <div class="ml-surface ml-stack">
          <label class="ml-check"><input type="checkbox" name="shareUsageStatistics" aria-describedby="ml-reporting-usage" ${usage ? "checked" : ""}><span>Share feature usage</span></label>
          <small id="ml-reporting-usage">Sends feature actions, module/Foundry/system versions, and GM/player role using a random world reporting ID. Reports are pseudonymous, not anonymous. No campaign content or account credentials are sent.</small>
          <label class="ml-check"><input type="checkbox" name="shareErrorReports" aria-describedby="ml-reporting-errors" ${errors ? "checked" : ""}><span>Share error reports</span></label>
          <small id="ml-reporting-errors">Optional: sends error types, Morelord code locations and failed operations. Recent feature actions are included only with usage sharing. Custom error messages are excluded.</small>
        </div>
      </section></div>`,
      buttons: [{ action: "save", label: "Save Reporting Preferences", default: true, callback: async (_event, button) => {
        const form = button.form;
        await game.settings.set(CORE, "shareUsageStatistics", form.elements.shareUsageStatistics.checked);
        await game.settings.set(CORE, "shareErrorReports", form.elements.shareErrorReports.checked);
        await game.settings.set(CORE, "telemetryConsentVersion", 1);
        await game.settings.set(CORE, "telemetryNoticeVersion", 1);
      } }],
      rejectClose: false
    });
  }

  enabled(kind) {
    try {
      const game = this.game();
      return game.settings.get(CORE, "telemetryConsentVersion") === 1
        && !game.settings.get(CORE, "developerMode")
        && !globalThis.MorelordCore?.users?.isIgnored?.(game.user)
        && Boolean(game.settings.get(CORE, kind === "error" ? "shareErrorReports" : "shareUsageStatistics"));
    } catch { return false; }
  }

  reset() {
    this.generation++;
    this.controller?.abort();
    this.queue = [];
    this.pending = null;
    this.recent = [];
    this.availableDay = "";
    this.seenErrors = new WeakSet();
    this.rejectedToken = null;
  }

  track(module, event) {
    try {
      if (!this.enabled("usage") || !TELEMETRY_MODULES.includes(module) || !CODE.test(event)) return;
      this.enqueue({ kind: "usage", module, event });
      this.recent.push(`${module}:${event}`);
      this.recent = this.recent.slice(-5);
    } catch { /* Reporting must never break gameplay. */ }
  }

  error(module, operation, error) {
    try {
      if (!this.enabled("error") || !TELEMETRY_MODULES.includes(module) || !CODE.test(operation)) return;
      if (error && typeof error === "object") {
        if (this.seenErrors.has(error)) return;
        this.seenErrors.add(error);
      }
      this.enqueue({ kind: "error", module, event: operation, ...errorDetails(error), recent: this.enabled("usage") ? [...this.recent] : [] });
    } catch { /* Reporting must never break error handling. */ }
  }

  enqueue(event) {
    const game = this.game();
    const version = value => VERSION.test(String(value)) ? String(value) : "unknown";
    if (!game.modules.get(event.module)?.active || this.queue.length >= 100) return;
    this.queue.push({ ...event, id: uuid(), at: new Date().toISOString(),
      moduleVersion: version(game.modules.get(event.module)?.version), foundryVersion: version(game.version),
      system: version(game.system?.id), systemVersion: version(game.system?.version), role: game.user?.isGM ? "gm" : "player" });
  }

  // Only use for async service methods which throw on failure; no arguments or results leave the client.
  observe(module, service, methods) {
    for (const [method, event] of Object.entries(methods)) {
      const original = service[method];
      if (typeof original !== "function") continue;
      const telemetry = this;
      service[method] = async function (...args) {
        telemetry.track(module, `${event}.attempted`);
        try {
          const result = await original.apply(this, args);
          telemetry.track(module, `${event}.returned`);
          return result;
        } catch (error) {
          telemetry.track(module, `${event}.failed`);
          telemetry.error(module, event, error);
          throw error;
        }
      };
    }
  }

  windows(module, ids) {
    const opened = new WeakSet();
    const render = app => {
      const event = ids[app.id];
      if (!event || opened.has(app) || !this.enabled("usage")) return;
      opened.add(app);
      this.track(module, event);
    };
    Hooks.on("renderApplicationV2", render);
    Hooks.on("renderApplication", render);
    Hooks.on("closeApplicationV2", app => opened.delete(app));
    Hooks.on("closeApplication", app => opened.delete(app));
  }

  async tick() {
    try {
      const game = this.game();
      const primary = Array.from(globalThis.MorelordCore?.users?.list?.(game.users) ?? game.users ?? []).filter(user => user.active && user.isGM).sort((a, b) => a.id.localeCompare(b.id))[0];
      if (primary?.id === game.user?.id) await this.showNotice();
      if (primary?.id === game.user?.id && (this.enabled("usage") || this.enabled("error"))) {
        await this.register();
        const day = new Date().toISOString().slice(0, 10);
        if (this.enabled("usage") && this.availableDay !== day) {
          this.availableDay = day;
          for (const module of TELEMETRY_MODULES) if (game.modules.get(module)?.active) this.track(module, "module.available");
        }
      }
      await this.flush();
    } catch { /* Offline or settings unavailable: try again next interval. */ }
  }

  endpoint(path = "/api/foundry/telemetry") {
    const url = new URL(path, this.game().settings.get(CORE, "serverUrl"));
    if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("Reporting requires HTTPS.");
    return url;
  }

  credentials() {
    const value = this.game().settings.get(CORE, "telemetryCredentials") ?? {};
    return value.origin === this.endpoint().origin ? value : null;
  }

  async register() {
    if (!this.game().user?.isGM || this.registering || this.credentials()?.token || (!this.enabled("usage") && !this.enabled("error"))) return;
    const url = this.endpoint("/api/foundry/telemetry/register");
    this.registering = true;
    const generation = this.generation;
    this.controller = new AbortController();
    const timeout = setTimeout(() => this.controller?.abort(), 10000);
    try {
      const response = await this.fetch(url.href, { method: "POST", credentials: "omit", referrerPolicy: "no-referrer", signal: this.controller.signal });
      if (!response.ok) return;
      const value = await response.json();
      if (generation !== this.generation || !/^[0-9a-f-]{36}$/.test(value.world) || !/^mlt_[a-f0-9]{64}$/.test(value.token)) return;
      await this.game().settings.set(CORE, "telemetryCredentials", { origin: url.origin, world: value.world, token: value.token });
    } finally { clearTimeout(timeout); this.controller = null; this.registering = false; }
  }

  async flush() {
    if (this.sending) return;
    const generation = this.generation;
    let timeout;
    try {
      const credential = this.credentials();
      if (!credential?.world || !credential.token || this.rejectedToken === credential.token || (!this.enabled("usage") && !this.enabled("error"))) return;
      if (!this.pending) this.pending = this.queue.splice(0, 25);
      this.pending = this.pending.filter(event => this.enabled(event.kind));
      if (!this.pending.length) { this.pending = null; return; }
      const url = this.endpoint();
      this.sending = true;
      this.controller = new AbortController();
      timeout = setTimeout(() => this.controller?.abort(), 10000);
      const response = await this.fetch(url.href, { method: "POST", credentials: "omit", referrerPolicy: "no-referrer",
        headers: { "content-type": "application/json", authorization: `Bearer ${credential.token}` }, signal: this.controller.signal,
        body: JSON.stringify({ schemaVersion: 1, world: credential.world, events: this.pending }) });
      if (generation === this.generation && [401, 403].includes(response.status)) {
        // Do not silently enroll again after revocation. Recheck on reload or an explicit settings change.
        this.rejectedToken = credential.token;
        this.pending = null;
        this.queue = [];
      }
      // Stable event IDs make retries idempotent. Bad payloads must not block later events.
      if (generation === this.generation && (response.ok || [400, 413].includes(response.status))) this.pending = null;
    } catch { /* Bounded in-memory retry; never block play or log sensitive payloads. */ }
    finally { clearTimeout(timeout); this.sending = false; this.controller = null; }
  }

  start() {
    Hooks.on("updateSetting", setting => {
      if (["shareUsageStatistics", "shareErrorReports", "telemetryConsentVersion", "developerMode", "ignoredUserIds", "serverUrl"].some(key => setting.key === `${CORE}.${key}`)) this.reset();
    });
    const capture = error => {
      const module = errorDetails(error).frames[0]?.split("/")[0];
      if (module) this.error(module, "unhandled", error);
    };
    globalThis.addEventListener("error", event => capture(event.error));
    globalThis.addEventListener("unhandledrejection", event => capture(event.reason));
    Hooks.on("error", (_location, error) => capture(error));
    void this.tick();
    this.timer = setInterval(() => void this.tick(), 60000);
  }
}
