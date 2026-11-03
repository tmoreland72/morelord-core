import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  addCurrency,
  adjustCurrencyCopper,
  applyGpDelta,
  canAfford,
  copperRate,
  cpToCurrency,
  currencyFromCp,
  currencyToCp,
  deductCurrency,
  formatCp,
  getCurrency,
  getCurrencyCopper,
  getCurrencyDisplay,
  gpAmount,
  setCurrency,
  totalCp
} from "../scripts/services/currency-service.js";

function withCurrencies(currencies, run) {
  const previous = globalThis.CONFIG;
  globalThis.CONFIG = { DND5E: { currencies } };
  try {
    return run();
  } finally {
    if (previous === undefined) delete globalThis.CONFIG;
    else globalThis.CONFIG = previous;
  }
}

function actorWith(currency) {
  const actor = {
    name: "Aric",
    system: { currency: { ...currency } },
    updates: [],
    async update(change) {
      actor.updates.push(change);
      for (const [key, value] of Object.entries(change)) {
        actor.system.currency[key.split(".").pop()] = value;
      }
    }
  };
  return actor;
}

test("standard rates convert pp, gp, ep, sp, and cp when CONFIG is absent", () => {
  const previous = globalThis.CONFIG;
  delete globalThis.CONFIG;
  try {
    assert.equal(copperRate("pp"), 1000);
    assert.equal(copperRate("gp"), 100);
    assert.equal(copperRate("ep"), 50);
    assert.equal(copperRate("sp"), 10);
    assert.equal(copperRate("cp"), 1);
    assert.equal(currencyToCp({ pp: 1, gp: 2, ep: 1, sp: 3, cp: 4 }), 1000 + 200 + 50 + 30 + 4);
    assert.equal(totalCp({ gp: 1 }), currencyToCp({ gp: 1 }));
  } finally {
    if (previous === undefined) delete globalThis.CONFIG;
    else globalThis.CONFIG = previous;
  }
});

test("coin rates follow CONFIG.DND5E.currencies", () => {
  withCurrencies({
    pp: { conversion: 0.1 },
    gp: { conversion: 1 },
    ep: { conversion: 1 },
    sp: { conversion: 10 },
    cp: { conversion: 100 }
  }, () => {
    assert.equal(copperRate("ep"), 100);
    assert.equal(currencyToCp({ ep: 2, gp: 1 }), 300);
    assert.deepEqual(cpToCurrency(250), { pp: 0, gp: 2, ep: 0, sp: 5, cp: 0 });
  });
});

test("a missing denomination falls back to the standard rate", () => {
  withCurrencies({
    gp: { conversion: 1 },
    cp: { conversion: 100 }
  }, () => {
    assert.equal(copperRate("sp"), 10);
    assert.equal(currencyToCp({ sp: 3 }), 30);
  });
});

test("purse totals ignore missing, fractional, and negative coins", () => {
  assert.equal(currencyToCp(), 0);
  assert.equal(currencyToCp(null), 0);
  assert.equal(currencyToCp({ gp: 1.9, sp: -4, cp: "3" }), 100 + 3);
});

test("copper splits into standard coins and the same helper has both names", () => {
  assert.deepEqual(cpToCurrency(1250), { pp: 1, gp: 2, ep: 1, sp: 0, cp: 0 });
  assert.deepEqual(currencyFromCp(1250), cpToCurrency(1250));
  assert.deepEqual(cpToCurrency(-5), { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
});

test("formatCp renders a price in gp, sp, and cp", () => {
  assert.equal(formatCp(1250), "12 gp, 5 sp");
  assert.equal(formatCp(10000), "100 gp");
  assert.equal(formatCp(50), "5 sp");
  assert.equal(formatCp(15), "1 sp, 5 cp");
  assert.equal(formatCp(0), "0 cp");
  assert.equal(formatCp(Number.NaN), "0 cp");
});

test("gpAmount totals an actor or a purse in gold", () => {
  assert.equal(gpAmount({ gp: 12, sp: 5 }), 12.5);
  assert.equal(gpAmount({ name: "Aric", system: { currency: { gp: 2, sp: 5 } }, gp: 99 }), 2.5);
  assert.equal(gpAmount({ system: {} }), 0);
});

test("display and affordance read the actor purse", () => {
  const actor = { system: { currency: { gp: 12, sp: 5 } } };
  assert.deepEqual(getCurrency(actor), actor.system.currency);
  assert.equal(getCurrencyCopper(actor), 1250);
  assert.equal(getCurrencyDisplay(actor), "12 gp, 5 sp");
  assert.equal(canAfford(actor, 1250), true);
  assert.equal(canAfford(actor, 1251), false);
  assert.equal(canAfford(actor, Number.NaN), false);
  assert.deepEqual(getCurrency(null), {});
});

test("set, add, and deduct write a normalized purse", async () => {
  const actor = actorWith({ gp: 1, sp: 15 });
  assert.deepEqual(await setCurrency(actor, 150), { pp: 0, gp: 1, ep: 1, sp: 0, cp: 0 });
  assert.equal(actor.system.currency.ep, 1);
  const added = await addCurrency(actor, 50);
  assert.equal(added.gp, 2);
  assert.equal(actor.updates.at(-1)["system.currency.gp"], 2);
  await assert.rejects(() => deductCurrency(actor, 500), /Insufficient funds\./);
  assert.equal(actor.updates.length, 2);
  await deductCurrency(actor, 100);
  assert.equal(gpAmount(actor), 1);
});

test("adjustCurrencyCopper spends and refuses a short purse", async () => {
  const actor = actorWith({ gp: 1 });
  await adjustCurrencyCopper(actor, -40);
  assert.equal(getCurrencyCopper(actor), 60);
  assert.equal(actor.system.currency.ep, 1);
  assert.equal(actor.system.currency.sp, 1);
  await assert.rejects(() => adjustCurrencyCopper(actor, -1000), /Aric does not have enough currency\./);
  await assert.rejects(() => addCurrency({ name: "Aric" }, 1), /A currency Actor is required\./);
  await assert.rejects(() => deductCurrency(actor, Number.NaN), /The currency amount is not a number\./);
});

test("applyGpDelta pays and spends a purse without updating an actor", () => {
  assert.equal(applyGpDelta({ gp: 1, sp: 5 }, 0.5).gp >= 1, true);
  assert.deepEqual(applyGpDelta({ gp: 1, sp: 5 }, 0.5), { pp: 0, gp: 2, ep: 0, sp: 0, cp: 0 });
  assert.throws(() => applyGpDelta({ gp: 20 }, -250), /Not enough money\. This costs 250 gp and the character has 20 gp\./);
  assert.throws(() => applyGpDelta({ gp: 1 }, Number.NaN), /The gold amount is not a number\./);
});

test("the public API publishes currency on init and ready", () => {
  const main = readFileSync(new URL("../scripts/main.js", import.meta.url), "utf8");
  assert.match(main, /api\.currency = publishedCurrency\(\)/);
  assert.match(main, /currency: publishedCurrency\(\)/);
  const start = main.indexOf("function publishedCurrency");
  const published = main.slice(start, main.indexOf("registerDirectorySelection();", start));
  for (const name of ["getCurrency", "currencyToCp", "totalCp", "cpToCurrency", "currencyFromCp", "copperRate", "gpAmount", "formatCp", "getCurrencyDisplay", "getCurrencyCopper", "canAfford", "setCurrency", "addCurrency", "deductCurrency", "adjustCurrencyCopper", "applyGpDelta"]) {
    assert.match(published, new RegExp(`\\b${name}\\b`));
  }
});
