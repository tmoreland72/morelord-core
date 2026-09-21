/** Plain text only; consumers must escape it when inserting into HTML. */
export function logLabel(value) {
  return String(value ?? "").replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ").replace(/^\w/, letter => letter.toUpperCase());
}

/** Readable fallback for structured log details, including nested values. */
export function logValue(value) {
  if (value == null) return "Not recorded";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.map(logValue).join("; ") : "None";
  if (typeof value === "object") return Object.entries(value)
    .map(([key, entry]) => `${logLabel(key)}: ${logValue(entry)}`).join("; ") || "None";
  return String(value);
}
