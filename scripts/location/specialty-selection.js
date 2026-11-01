import { normalizeSpecialtyList } from "./location-domain.js";

/**
 * Marks the selected specialty keys and builds the closed-control summary.
 * An empty selection summarizes as Any. Unknown stored keys stay available.
 */
export function finishSpecialtyGroups(groups = [], current = null) {
  const selectedKeys = normalizeSpecialtyList(current);
  const known = new Set();
  for (const group of groups) {
    for (const option of group.options ?? []) {
      const value = String(option?.value ?? "").trim();
      if (value) known.add(value);
    }
  }
  const extras = selectedKeys.filter(key => !known.has(key));
  const rendered = extras.length
    ? [{ label: "", options: extras.map(value => ({ value, label: value, selected: false })) }, ...groups]
    : groups.map(group => ({ ...group, options: [...(group.options ?? [])] }));
  const seen = new Set();
  const labels = [];
  for (const group of rendered) {
    group.options = group.options.filter(option => String(option?.value ?? "").trim());
    for (const option of group.options) {
      option.selected = selectedKeys.includes(option.value);
      if (option.selected && !seen.has(option.value)) {
        seen.add(option.value);
        labels.push(option.label);
      }
    }
  }
  return {
    groups: rendered.filter(group => group.options.length),
    summary: labels.length ? labels.join(", ") : "Any"
  };
}
