import { assert } from "./in-game.js";
import { connectionLayoutCheck } from "./connection-layout.js";

export const telemetryChecks = [
  {
    id: "core.telemetry-consent-boundary",
    async run() {
      assert(MorelordCore.telemetry, "Core must expose the shared telemetry service.");
      const consent = game.settings.get("morelord-core", "telemetryConsentVersion");
      if (consent !== 1) {
        assert(!MorelordCore.telemetry.enabled("usage"), "Legacy sharing must not permit feature reporting.");
        assert(!MorelordCore.telemetry.enabled("error"), "Legacy sharing must not permit error reporting.");
      }
      if (game.settings.get("morelord-core", "developerMode")) {
        assert(!MorelordCore.telemetry.enabled("usage") && !MorelordCore.telemetry.enabled("error"), "Developer Mode must suppress reports.");
      }
    }
  },
  { ...connectionLayoutCheck, skip: game.user.isGM ? null : "GM-only settings window" }
];
