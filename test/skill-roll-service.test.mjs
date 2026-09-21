import test from "node:test";
import assert from "node:assert/strict";
import { actorSkillModifier, extractNaturalD20, rollSkill } from "../scripts/services/skill-roll-service.js";

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
test("optional situational skill modifiers preserve native automatic rules", async () => {
  const calls = [];
  const actor = {rollSkill: async config => { calls.push(config); return [{total:10}]; }};
  await rollSkill(actor,"ste",{advantage:true});
  await rollSkill(actor,"ste",{disadvantage:true});
  await rollSkill(actor,"ste",{advantage:false,disadvantage:false});
  assert.deepEqual(calls,[{skill:"ste",advantage:true},{skill:"ste",disadvantage:true},{skill:"ste"}]);
});
