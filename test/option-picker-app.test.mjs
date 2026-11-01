import test from "node:test";
import assert from "node:assert/strict";
import { BUILTIN_CAPABILITY_TYPES, CapabilityRegistry } from "../scripts/location/capability-registry.js";
import { buildSpecialtyOptions } from "../scripts/location/training-specialties.js";
import { choicesFromGroups, toggleSpecialty } from "../scripts/ui/option-picker.js";

class ApplicationV2 {
  constructor() {}
}
function HandlebarsApplicationMixin(Base) {
  return class extends Base {};
}
globalThis.foundry = { applications: { api: { ApplicationV2, HandlebarsApplicationMixin } } };

const { OptionPickerApp } = await import("../scripts/ui/option-picker-app.js");

function registry() {
  const types = new CapabilityRegistry();
  for (const definition of BUILTIN_CAPABILITY_TYPES) types.register(definition);
  return types;
}

test("OptionPickerApp keeps covers so Any Language drops a stored sign", () => {
  const model = buildSpecialtyOptions(registry().get("instructor"), { current: ["sign", "elvish"] });
  const choices = choicesFromGroups(model.groups);
  const app = new OptionPickerApp({ choices, selected: ["sign", "elvish"] });
  const anyLanguage = app.choices.find(choice => choice.value === "any-language");
  assert.equal(anyLanguage.overallAny, false);
  assert.equal(anyLanguage.covers.includes("sign"), true);
  assert.equal(anyLanguage.covers.includes("elvish"), true);
  assert.equal(app.choices.find(choice => choice.value === "*").overallAny, true);
  assert.deepEqual(toggleSpecialty(app.choices, [...app.selected], "any-language"), ["any-language"]);
});

test("OptionPickerApp keeps Forge parent covers", () => {
  const model = buildSpecialtyOptions(registry().get("forge"), { current: ["hvy"] });
  const app = new OptionPickerApp({ choices: choicesFromGroups(model.groups), selected: ["hvy"] });
  const armor = app.choices.find(choice => choice.value === "armor");
  assert.equal(armor.label, "Any Armor");
  assert.equal(armor.covers.includes("hvy"), true);
  assert.deepEqual(toggleSpecialty(app.choices, ["hvy"], "armor"), ["armor"]);
});
