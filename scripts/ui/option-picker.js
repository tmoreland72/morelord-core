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
        category
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

/** Available rows hide a value that is already selected. Search and category match Select Training. */
export function choiceVisible(choice, { query = "", category = "all", selected = [] } = {}) {
  if ((selected ?? []).includes(choice?.value)) return false;
  if (category !== "all" && choice?.category !== category) return false;
  const needle = String(query ?? "").trim().toLocaleLowerCase();
  if (needle && !choiceSearchText(choice).includes(needle)) return false;
  return true;
}
