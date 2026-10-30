import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { choiceVisible, choicesFromGroups, pickerCategories, toggleSpecialty } from "../scripts/ui/option-picker.js";
import { readFileSync as readCss } from "node:fs";

test("the specialty picker keeps Select Training filters and adds a selected list", () => {
  const template = readFileSync(new URL("../templates/option-picker.hbs", import.meta.url), "utf8");
  assert.match(template, /class="ml-app ml-training-selection"/);
  assert.match(template, /data-training-search/);
  assert.match(template, /All Categories/);
  assert.match(template, /data-action="filterCategory"/);
  assert.match(template, /data-action="chooseOption"/);
  assert.match(template, /is-selected/);
  assert.match(template, /is-covered/);
  assert.match(template, /fa-circle-check/);
  const css = readCss(new URL("../styles/morelord-components.css", import.meta.url), "utf8");
  assert.match(css, /\.ml-training-selection__selected > \.ml-training-selection__list\s*\{[^}]*align-content:\s*start;[^}]*justify-content:\s*start;[^}]*align-items:\s*start;/s);
  assert.match(template, /data-training-choice/);
  assert.doesNotMatch(template, /data-training-choice[^>]*hidden/);
  assert.match(template, /class="ml-training-selection__selected"/);
  assert.match(template, /data-action="clearSelected"/);
  assert.match(template, /data-action="removeSelected"/);
  assert.match(template, /data-action="confirm"/);
  assert.match(template, /data-action="cancel"/);
  assert.doesNotMatch(template, /fa-cart-shopping|gp each|Quantity/);
});

test("selected values stay in the option list while search and category still filter it", () => {
  const choices = choicesFromGroups([
    { label: "Skills", options: [{ value: "ste", label: "Stealth" }, { value: "prc", label: "Perception" }] },
    { label: "Weapons", options: [{ value: "dagger", label: "Dagger" }] },
    { label: "Weapon Masteries", options: [{ value: "dagger", label: "Dagger" }] }
  ]);
  assert.equal(choices.filter(choice => choice.value === "dagger").length, 2);
  assert.deepEqual(pickerCategories(choices).map(entry => entry.category), ["Skills", "Weapon Masteries", "Weapons"]);
  assert.equal(choiceVisible(choices[0], { category: "all", query: "" }), true);
  assert.equal(choiceVisible(choices[1], { category: "Skills", query: "per" }), true);
  assert.equal(choiceVisible(choices[1], { category: "Weapons", query: "" }), false);
  assert.equal(choiceVisible(choices[2], { category: "all", query: "dag" }), true);
});

test("Any Language covers the languages in that group and overall Any clears the selection", () => {
  const choices = [
    { value: "*", label: "Any", category: "Any", overallAny: true, covers: [] },
    { value: "any-language", label: "Any Language", category: "Languages", covers: ["common", "elvish"] },
    { value: "common", label: "Common", category: "Languages", covers: [] },
    { value: "elvish", label: "Elvish", category: "Languages", covers: [] },
    { value: "ste", label: "Stealth", category: "Skills", covers: [] }
  ];
  assert.deepEqual(toggleSpecialty(choices, ["common", "elvish", "ste"], "any-language"), ["ste", "any-language"]);
  assert.deepEqual(toggleSpecialty(choices, ["any-language"], "elvish"), ["elvish"]);
  assert.deepEqual(toggleSpecialty(choices, ["ste", "any-language"], "*"), []);
});
