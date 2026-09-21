/** Optional synchronous, privacy-safe snapshots supplied by Morelord modules. */
export function collectModuleDiagnostics(modules) {
  const reports = {};
  for (const module of modules) {
    if (!module.active || !module.id.startsWith("morelord-") || module.id === "morelord-core") continue;
    if (typeof module.api?.getDiagnostics !== "function") continue;
    try {
      reports[module.id] = module.api.getDiagnostics();
    } catch {
      // Exception messages can contain document names, URLs, or credentials.
      reports[module.id] = { unavailable: true, reason: "diagnostics-collection-failed" };
    }
  }
  return reports;
}
