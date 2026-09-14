const RARITY_ORDER = ["common", "uncommon", "rare", "veryrare", "legendary", "artifact"];

/** Read v6 arrays/Sets or legacy rarity strings/choice objects from Item system data. */
export function itemRarities(system) {
  if (!system) return [];
  const raw = system.rarities ?? system.rarity;
  const values = raw instanceof Set || Array.isArray(raw) ? [...raw] : [raw];
  const normalized = values.map(value => {
    if (value && typeof value === "object") value = value.value ?? value.id ?? value.key;
    return String(value ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  }).filter(value => value && value !== "none" && value !== "mundane");
  const rank = value => RARITY_ORDER.indexOf(value) < 0 ? RARITY_ORDER.length : RARITY_ORDER.indexOf(value);
  return [...new Set(normalized)].sort((a, b) => rank(a) - rank(b));
}

/** Single-rarity workflows use the lowest rarity, matching D&D v6's Item getter. */
export function itemRarity(system) {
  return itemRarities(system)[0];
}
