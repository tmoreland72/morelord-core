// Hidden configuration is explicitly included; campaign records and account secrets are not.
const CONFIGURATION_KEYS = {
  "morelord-core": "serverUrl developerMode developerTier ignoredUserIds",
  "morelord-marketplace": "buyRate sellRate enableSelling enableBuying requireSellApproval requireBuyApproval postTransactionCards",
  "morelord-journeys": "dayEncounterDie journeyPlannerDefaults phaseWeather phasePace phaseEncounters phaseDiscovery phaseNavigation phasePressOn phaseForaging phaseCamp suppressSleepDeprivationExhaustion enableNightEncounters enableSleepAndShelter skipDiceAnimation dcConfiguration",
  "morelord-encounters": "lastEncounterSources defaultEncounterConfiguration defaultEncounterConfigurationV2 defaultsConfigured defaultDifficulty defaultPartyUuids defaultSourceIds defaultEncounterSource defaultDrakkenheimTableId",
  "morelord-craftworks": "harvestDcModifier harvestChoicesMin harvestChoicesMax harvestRareBias harvestNat20DoubleClaim harvestSelectedCharacterUuids deleriumSearchDefaults gatherDcModifier gatherDcOverrides gatherQuantityMultiplier gatherRareBias gatherSelectedCharacterUuids lootEnableMaterials lootEnableCoin lootEnableSpecial lootMaterialChanceModifier lootCoinChanceModifier lootSpecialChanceModifier lootMaterialQuantityMultiplier lootCoinMultiplier usePartyRecipient partyActorUuid hiddenRecipeIds craftingFacilityRules recipeFacilityOverrides showRecipesForPreferredToolProficiency"
};
const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);

function requireGM() {
  if (!game.user?.isGM) throw new Error("Only a GM may export or import Morelord settings.");
}

export function transferableSettings() {
  return Array.from(game.settings.settings.values()).filter(setting => {
    const { namespace, key } = setting;
    if (namespace === "morelord-core" && ["shareUsageStatistics", "shareErrorReports", "telemetryConsentVersion", "telemetryWorldId", "telemetryCredentials"].includes(key)) return false;
    if (!namespace.startsWith("morelord-") || !game.modules.get(namespace)?.active) return false;
    return CONFIGURATION_KEYS[namespace]?.split(" ").includes(key)
      || (namespace === "morelord-craftworks" && key.startsWith("recipePackEnabled_"))
      || setting.config === true;
  });
}

export function exportSettings() {
  requireGM();
  const modules = {};
  for (const { namespace, key } of transferableSettings()) {
    modules[namespace] ??= {};
    modules[namespace][key] = game.settings.get(namespace, key);
  }
  return JSON.parse(JSON.stringify({ format: "morelord-settings", version: 1, modules }));
}

function validateValue(setting, value) {
  const { namespace, key, type, choices, range } = setting;
  const valid = type === String ? typeof value === "string"
    : type === Boolean ? typeof value === "boolean"
    : type === Number ? typeof value === "number" && Number.isFinite(value)
    : type === Array ? Array.isArray(value)
    : type === Object ? value !== null && typeof value === "object"
    : false;
  if (!valid) throw new Error(`Invalid value for ${namespace}.${key}.`);
  if (type === Object && Array.isArray(value) !== Array.isArray(setting.default)) {
    throw new Error(`Invalid object or list for ${namespace}.${key}.`);
  }
  if (type === String && (["{}", "[]"].includes(setting.default) || key === "defaultEncounterConfigurationV2") && value) {
    const parsed = JSON.parse(value);
    if (parsed === null || typeof parsed !== "object") throw new Error(`Invalid JSON configuration for ${namespace}.${key}.`);
  }
  if (choices && typeof choices === "object" && !Object.hasOwn(choices, String(value))) {
    throw new Error(`Unsupported choice for ${namespace}.${key}.`);
  }
  if (range && (value < range.min || value > range.max)) throw new Error(`Out-of-range value for ${namespace}.${key}.`);
  if (namespace === "morelord-marketplace" && ((key === "buyRate" && value < 1) || (key === "sellRate" && value < 0))) {
    throw new Error("Marketplace buy rate must be at least 1 and sell rate must be nonnegative.");
  }
}

export async function importSettings(data) {
  requireGM();
  if (!isRecord(data) || data.format !== "morelord-settings" || data.version !== 1 || !isRecord(data.modules)) {
    throw new Error("Choose a supported Morelord settings export (version 1).");
  }
  const allowed = new Map(transferableSettings().map(setting => [`${setting.namespace}.${setting.key}`, setting]));
  const changes = [];
  let skipped = 0;
  for (const [namespace, values] of Object.entries(data.modules)) {
    if (!game.modules.get(namespace)?.active || !namespace.startsWith("morelord-")) { skipped++; continue; }
    if (!isRecord(values)) throw new Error(`Invalid settings for ${namespace}.`);
    for (const [key, value] of Object.entries(values)) {
      const setting = allowed.get(`${namespace}.${key}`);
      if (!setting) { skipped++; continue; }
      validateValue(setting, value);
      changes.push({ namespace, key, value, previous: game.settings.get(namespace, key) });
    }
  }
  const applied = [];
  try {
    for (const change of changes) {
      applied.push(change);
      await game.settings.set(change.namespace, change.key, change.value);
    }
  } catch (error) {
    const failures = [];
    for (const change of applied.reverse()) {
      try { await game.settings.set(change.namespace, change.key, change.previous); }
      catch { failures.push(`${change.namespace}.${change.key}`); }
    }
    throw new Error(`Import failed: ${error.message}. ${failures.length ? "Could not restore: " + failures.join(", ") : "Previous settings restored."}`);
  }
  return { imported: changes.length, skipped };
}
