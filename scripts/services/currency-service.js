const DENOMINATIONS = Object.freeze(["pp", "gp", "ep", "sp", "cp"]);
const PRICE_DENOMINATIONS = Object.freeze(["gp", "sp", "cp"]);

/** Coins per 1 gp. dnd5e stores the same numbers on CONFIG.DND5E.currencies[].conversion. */
const STANDARD_CONVERSION = Object.freeze({
  pp: 0.1,
  gp: 1,
  ep: 2,
  sp: 10,
  cp: 100
});

function conversion(denomination) {
  const configured = Number(globalThis.CONFIG?.DND5E?.currencies?.[denomination]?.conversion);
  if (Number.isFinite(configured) && configured > 0) return configured;
  return STANDARD_CONVERSION[denomination] ?? 0;
}

function coinCount(value) {
  const count = Math.floor(Number(value ?? 0));
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function asPurse(source) {
  const currency = source?.system?.currency;
  if (currency && typeof currency === "object") return currency;
  if (source && typeof source === "object" && !source.system) return source;
  return {};
}

function finiteAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) throw new Error("The currency amount is not a number.");
  return amount;
}

function requireActor(actor) {
  if (!actor || typeof actor.update !== "function") throw new Error("A currency Actor is required.");
  return actor;
}

/** Copper value of one coin, from CONFIG.DND5E.currencies when that rate is present. */
export function copperRate(denomination) {
  const perGold = conversion(denomination);
  const copperPerGold = conversion("cp");
  if (!perGold || !copperPerGold) return 0;
  return Math.round(copperPerGold / perGold);
}

/** Sum a purse to copper. Missing, fractional, and negative counts contribute nothing. */
export function currencyToCp(currency = {}) {
  const purse = currency && typeof currency === "object" ? currency : {};
  return DENOMINATIONS.reduce((total, denomination) => {
    return total + coinCount(purse[denomination]) * copperRate(denomination);
  }, 0);
}

export const totalCp = currencyToCp;

/** Split a copper total into pp, gp, ep, sp, and cp, largest first. */
export function cpToCurrency(cp) {
  let remaining = Math.max(0, Math.floor(Number(cp) || 0));
  const currency = {};
  for (const denomination of DENOMINATIONS) {
    const rate = copperRate(denomination);
    if (!rate) {
      currency[denomination] = 0;
      continue;
    }
    currency[denomination] = Math.floor(remaining / rate);
    remaining -= currency[denomination] * rate;
  }
  return currency;
}

export const currencyFromCp = cpToCurrency;

/**
 * Price text such as "12 gp, 5 sp". Value is shown in gp, sp, and cp.
 * A negative or empty amount is "0 cp".
 */
export function formatCp(cp) {
  let remaining = Math.max(0, Math.floor(Number(cp) || 0));
  const parts = [];
  for (const denomination of PRICE_DENOMINATIONS) {
    const rate = copperRate(denomination);
    if (!rate) continue;
    const count = Math.floor(remaining / rate);
    remaining -= count * rate;
    if (count) parts.push(`${count} ${denomination}`);
  }
  return parts.length ? parts.join(", ") : "0 cp";
}

export function getCurrency(actor) {
  return actor?.system?.currency ?? {};
}

export function getCurrencyCopper(actor) {
  return currencyToCp(getCurrency(actor));
}

/** Wealth in gold pieces. Accepts an actor or a purse. Five silver is 0.5. */
export function gpAmount(source) {
  const perGold = copperRate("gp");
  if (!perGold) return 0;
  return currencyToCp(asPurse(source)) / perGold;
}

export function getCurrencyDisplay(actor) {
  return formatCp(getCurrencyCopper(actor));
}

export function canAfford(actor, priceCp) {
  const price = Number(priceCp);
  if (!Number.isFinite(price)) return false;
  return getCurrencyCopper(actor) >= price;
}

export async function setCurrency(actor, cp) {
  requireActor(actor);
  const currency = cpToCurrency(cp);
  await actor.update({
    "system.currency.pp": currency.pp,
    "system.currency.gp": currency.gp,
    "system.currency.ep": currency.ep,
    "system.currency.sp": currency.sp,
    "system.currency.cp": currency.cp
  });
  return currency;
}

export async function addCurrency(actor, cpToAdd) {
  return setCurrency(actor, getCurrencyCopper(actor) + finiteAmount(cpToAdd));
}

export async function deductCurrency(actor, cpToDeduct) {
  const current = getCurrencyCopper(actor);
  const amount = finiteAmount(cpToDeduct);
  if (current < amount) throw new Error("Insufficient funds.");
  return setCurrency(actor, current - amount);
}

export async function adjustCurrencyCopper(actor, deltaCopper) {
  requireActor(actor);
  const next = getCurrencyCopper(actor) + Math.round(finiteAmount(deltaCopper ?? 0));
  if (next < 0) throw new Error(`${actor.name} does not have enough currency.`);
  return setCurrency(actor, next);
}

/** Positive delta pays. Negative delta spends. Returns the next purse and does not update an actor. */
export function applyGpDelta(currency, deltaGp) {
  const delta = Number(deltaGp);
  if (!Number.isFinite(delta)) throw new Error("The gold amount is not a number.");
  const next = currencyToCp(asPurse(currency)) + Math.round(delta * copperRate("gp"));
  if (next < 0) {
    const have = gpAmount(currency);
    const need = Math.abs(delta);
    throw new Error(`Not enough money. This costs ${need} gp and the character has ${have} gp.`);
  }
  return cpToCurrency(next);
}
