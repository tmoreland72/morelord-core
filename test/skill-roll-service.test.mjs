import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { actorSkillModifier, extractNaturalD20, formatModifier, rollSkill, skillChoiceLabel } from "../scripts/services/skill-roll-service.js";

test("shared skill rolls use the native D&D5e configured roll", async () => {
  let received;
  const nativeRoll = { total: 17, dice: [{ faces: 20, results: [{ result: 12, active: true }] }] };
  const actor = { name: "Aric", rollSkill: async (...args) => { received = args; return [nativeRoll]; } };
  const result = await rollSkill(actor, "inv", { dc: 15, flavor: "Investigation", configure: true });
  assert.deepEqual(received, [
    { skill: "inv", target: 15 },
    { configure: true, title: "Investigation" },
    { create: true, data: { flavor: "Investigation" } }
  ]);
  assert.equal(result.total, 17);
  assert.equal(result.naturalD20, 12);
  assert.equal(result.success, true);
});

test("shared roll helpers expose character modifiers and the active d20", () => {
  assert.equal(actorSkillModifier({ system: { skills: { per: { total: -1 } } } }, "per"), -1);
  assert.equal(extractNaturalD20({ dice: [{ faces: 20, results: [{ result: 4, discarded: true }, { result: 16, active: true }] }] }), 16);
});

test("formatModifier returns a signed modifier", () => {
  assert.equal(formatModifier(5), "+5");
  assert.equal(formatModifier(-1), "-1");
  assert.equal(formatModifier(0), "+0");
  assert.equal(formatModifier(Number.NaN), "+0");
});

test("skillChoiceLabel uses the localized dnd5e skill and the actor total", () => {
  const previousConfig = globalThis.CONFIG;
  const previousGame = globalThis.game;
  globalThis.CONFIG = { DND5E: { skills: { rel: { label: "DND5E.SkillRel" } } } };
  globalThis.game = { i18n: { localize: key => key === "DND5E.SkillRel" ? "Religion" : key } };
  try {
    assert.equal(skillChoiceLabel({ system: { skills: { rel: { total: 5 } } } }, "rel"), "Religion (+5)");
    assert.equal(skillChoiceLabel({ system: { skills: { rel: { total: -1 } } } }, "rel"), "Religion (-1)");
    assert.equal(skillChoiceLabel({ system: { skills: { rel: { mod: 0 } } } }, "rel"), "Religion (+0)");
    assert.equal(skillChoiceLabel({ system: { skills: {} } }, "arc"), "arc (+0)");
  } finally {
    if (previousConfig === undefined) delete globalThis.CONFIG;
    else globalThis.CONFIG = previousConfig;
    if (previousGame === undefined) delete globalThis.game;
    else globalThis.game = previousGame;
  }
});

test("skillChoiceLabel keeps the configured label when localization is unavailable", () => {
  const previousConfig = globalThis.CONFIG;
  const previousGame = globalThis.game;
  globalThis.CONFIG = { DND5E: { skills: { rel: { label: "Religion" } } } };
  delete globalThis.game;
  try {
    assert.equal(skillChoiceLabel({ system: { skills: { rel: { total: 2 } } } }, "rel"), "Religion (+2)");
  } finally {
    if (previousConfig === undefined) delete globalThis.CONFIG;
    else globalThis.CONFIG = previousConfig;
    if (previousGame === undefined) delete globalThis.game;
    else globalThis.game = previousGame;
  }
});

test("public rolls api publishes the shared modifier helpers", () => {
  const main = readFileSync(new URL("../scripts/main.js", import.meta.url), "utf8");
  assert.match(main, /formatModifier, rollSkill, skillChoiceLabel/);
  assert.match(main, /rolls: Object\.freeze\(\{ skill: rollSkill, skillModifier: actorSkillModifier, naturalD20: extractNaturalD20, formatModifier, skillChoiceLabel \}\)/);
});

test("optional situational skill modifiers preserve native automatic rules", async () => {
  const calls = [];
  const actor = {rollSkill: async config => { calls.push(config); return [{total:10}]; }};
  await rollSkill(actor,"ste",{advantage:true});
  await rollSkill(actor,"ste",{disadvantage:true});
  await rollSkill(actor,"ste",{advantage:false,disadvantage:false});
  assert.deepEqual(calls,[{skill:"ste",advantage:true},{skill:"ste",disadvantage:true},{skill:"ste"}]);
});
