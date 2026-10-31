/** Flat choices for the Select Specialty window. Duplicate values stay so each category can list the same id. */
export function choicesFromGroups(groups = []) {
  const choices = [];
  for (const group of groups ?? []) {
    const category = String(group?.label ?? "").trim() || "Specialty";
    for (const option of group?.options ?? []) {
      const value = String(option?.value ?? "").trim();
      if (!value) continue;
      choices.push({
        value,
        label: String(option?.label ?? value).trim() || value,
        category,
        covers: Array.isArray(option?.covers) ? option.covers.map(String) : [],
        overallAny: option?.overallAny === true || value === "*"
      });
    }
  }
  return choices;
}

export function pickerCategories(choices = []) {
  return [...new Set(choices.map(choice => choice.category))].sort().map(category => ({
    category,
    count: choices.filter(choice => choice.category === category).length
  }));
}

export function choiceSearchText(choice) {
  return `${choice?.label ?? ""} ${choice?.category ?? ""}`.toLocaleLowerCase();
}

export const OVERALL_ANY = "*";

/** Ids made redundant by a selected parent or group Any. */
export function coveredValues(choices = [], selected = []) {
  const covered = new Set();
  for (const choice of choices) {
    if (!selected.includes(choice.value)) continue;
    for (const id of choice.covers ?? []) covered.add(String(id));
  }
  return [...covered];
}

/**
 * Toggle one picker value.
 * Overall Any clears the list. A group Any drops the items it covers.
 * Picking a covered item drops that group Any and keeps the item.
 */
export function toggleSpecialty(choices = [], selected = [], value) {
  if (value === OVERALL_ANY || value === "") return [];
  const choice = choices.find(item => item.value === value);
  if (!choice) return [...selected];
  if (selected.includes(value)) return selected.filter(key => key !== value);
  const covers = new Set(choice.covers ?? []);
  const next = selected.filter(key => {
    if (key === OVERALL_ANY || key === "") return false;
    if (covers.has(key)) return false;
    const other = choices.find(item => item.value === key);
    return !other?.covers?.includes(value);
  });
  next.push(value);
  const redundant = new Set(coveredValues(choices, next));
  return next.filter(key => !redundant.has(key));
}

/** Search and category match Select Training. A selected value stays in the list. */
export function choiceVisible(choice, { query = "", category = "all" } = {}) {
  if (category !== "all" && choice?.category !== category) return false;
  const needle = String(query ?? "").trim().toLocaleLowerCase();
  if (needle && !choiceSearchText(choice).includes(needle)) return false;
  return true;
}
