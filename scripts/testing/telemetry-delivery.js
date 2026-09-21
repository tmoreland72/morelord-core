import { assert } from "./in-game.js";

// Explicit local-only integration check. Temporarily changes reporting settings and restores them.
export function localTelemetryDeliveryCheck(endpoint) {
  const destination = new URL(endpoint);
  if (!["localhost", "127.0.0.1"].includes(destination.hostname)) throw new Error("Use a local test collector.");
  return {
    id: "core.telemetry-local-delivery",
    async run() {
      assert(game.user.isGM, "A GM must run the delivery check.");
      const service = MorelordCore.telemetry;
      const keys = ["telemetryConsentVersion", "shareUsageStatistics", "shareErrorReports", "developerMode", "telemetryCredentials", "ignoredUserIds"];
      const saved = Object.fromEntries(keys.map(key => [key, game.settings.get("morelord-core", key)]));
      const originalFetch = service.fetch;
      const sent = [];
      let app;
      service.fetch = async (url, options) => {
        const response = await fetch(url.endsWith("/register") ? destination.href + "/register" : destination.href, options);
        assert(response.ok, `Local collector rejected the report (${response.status}).`);
        if (options.body) sent.push(JSON.parse(options.body));
        return response;
      };
      try {
        await game.settings.set("morelord-core", "telemetryConsentVersion", 0);
        await game.settings.set("morelord-core", "telemetryCredentials", {});
        await game.settings.set("morelord-core", "shareUsageStatistics", true);
        await game.settings.set("morelord-core", "shareErrorReports", true);
        await game.settings.set("morelord-core", "developerMode", false);
        await game.settings.set("morelord-core", "ignoredUserIds", saved.ignoredUserIds.filter(id => id !== game.user.id));
        await game.settings.set("morelord-core", "telemetryConsentVersion", 1);
        assert(service.enabled("usage") && service.enabled("error"), "Temporary explicit consent must enable reports for the test GM.");
        await service.register();
        assert(service.credentials()?.token, "An unconnected world must receive a separate reporting credential.");
        app = await MorelordDowntime.open();
        await app.render({ force:true });
        const failure = new TypeError("Private test message must not leave the client");
        service.error("morelord-core", "verification", failure);
        assert(service.queue.length > 0, "Enabled telemetry must queue the live events before delivery.");
        await service.flush();
        assert(sent.length > 0, "The local collector must accept a batch; check browser CORS and endpoint availability.");
        const events = sent.flatMap(batch => batch.events);
        assert(events.filter(event => event.module === "morelord-downtime" && event.event === "dashboard.opened").length === 1, "Opening and rerendering must record one dashboard open.");
        assert(events.some(event => event.kind === "error" && event.frames.some(frame => frame.includes("telemetry-delivery.js"))), "Error reports must retain real module code locations.");
        assert(!JSON.stringify(sent).includes("Private test message"), "Custom messages must be excluded.");
        await game.settings.set("morelord-core", "shareUsageStatistics", false);
        service.track("morelord-downtime", "dashboard.opened");
        service.error("morelord-core", "verification", new Error("Another private message"));
        await service.flush();
        assert(sent.at(-1).events.every(event => event.kind === "error" && event.recent.length === 0), "Error-only reporting must exclude usage and breadcrumbs.");
      } finally {
        await app?.close();
        // Restore consent last, keeping transport redirected until all original settings are restored.
        await game.settings.set("morelord-core", "telemetryConsentVersion", 0);
        for (const key of keys.filter(key => key !== "telemetryConsentVersion")) await game.settings.set("morelord-core", key, saved[key]);
        await game.settings.set("morelord-core", "telemetryConsentVersion", saved.telemetryConsentVersion);
        service.reset();
        service.fetch = originalFetch;
      }
    }
  };
}
