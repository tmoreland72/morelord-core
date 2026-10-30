import { choiceSearchText, pickerCategories } from "./option-picker.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class OptionPickerApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "morelord-core-option-picker",
    classes: ["ml-window"],
    tag: "section",
    position: { width: 1100, height: 680 },
    window: { title: "Select Specialty", icon: "fa-solid fa-list-check", resizable: true },
    actions: {
      chooseOption: OptionPickerApp.chooseOption,
      removeSelected: OptionPickerApp.removeSelected,
      clearSelected: OptionPickerApp.clearSelected,
      filterCategory: OptionPickerApp.filterCategory,
      clearSearch: OptionPickerApp.clearSearch,
      confirm: OptionPickerApp.confirm,
      cancel: OptionPickerApp.cancel
    }
  };

  static PARTS = { content: { template: "modules/morelord-core/templates/option-picker.hbs" } };

  constructor({ choices = [], selected = [], onConfirm = null } = {}) {
    super();
    this.choices = choices.map(choice => ({
      value: String(choice.value),
      label: String(choice.label ?? choice.value),
      category: String(choice.category ?? "Specialty")
    }));
    this.selected = new Set((selected ?? []).map(value => String(value)));
    this.onConfirm = onConfirm;
    this.category = "all";
  }

  async _prepareContext(options) {
    const selected = [...this.selected];
    const labelFor = value => this.choices.find(choice => choice.value === value);
    return {
      ...await super._prepareContext(options),
      choices: this.choices.map(choice => ({
        ...choice,
        searchText: choiceSearchText(choice),
        selected: this.selected.has(choice.value)
      })),
      categories: pickerCategories(this.choices),
      resultCount: this.choices.length,
      selected: selected.map(value => {
        const choice = labelFor(value);
        return { value, label: choice?.label ?? value, category: choice?.category ?? "" };
      }),
      selectedCount: selected.length
    };
  }

  _onRender() {
    this.element.querySelector("[data-training-search]")?.addEventListener("input", () => this.applyFilters());
    this.applyFilters();
    this.syncSelectedEmpty();
  }

  applyFilters() {
    const query = this.element.querySelector("[data-training-search]")?.value.trim().toLocaleLowerCase() ?? "";
    let visible = 0;
    for (const option of this.element.querySelectorAll("[data-training-choice]")) {
      const matchesCategory = this.category === "all" || option.dataset.category === this.category;
      const matchesQuery = !query || option.dataset.search.includes(query);
      const taken = this.selected.has(option.dataset.value);
      option.hidden = taken || !(matchesCategory && matchesQuery);
      if (!option.hidden) visible += 1;
    }
    const count = this.element.querySelector("[data-training-result-count]");
    if (count) count.textContent = `${visible} training ${visible === 1 ? "option" : "options"}`;
    const empty = this.element.querySelector("[data-training-empty]");
    if (empty) empty.hidden = visible !== 0;
  }

  syncSelectedEmpty() {
    const empty = this.element.querySelector("[data-selected-empty]");
    if (empty) empty.hidden = this.selected.size !== 0;
    const count = this.element.querySelector("[data-selected-count]");
    if (count) count.textContent = `${this.selected.size} selected`;
  }

  static filterCategory(event, target) {
    event.preventDefault();
    this.category = target.dataset.category;
    for (const button of this.element.querySelectorAll("[data-action='filterCategory']")) {
      const active = button.dataset.category === this.category;
      button.classList.toggle("is-active", active);
      const icon = button.querySelector("i");
      icon?.classList.toggle("fa-solid", active);
      icon?.classList.toggle("fa-square-check", active);
      icon?.classList.toggle("fa-regular", !active);
      icon?.classList.toggle("fa-square", !active);
    }
    this.applyFilters();
  }

  static clearSearch(event) {
    event.preventDefault();
    const search = this.element.querySelector("[data-training-search]");
    if (search) search.value = "";
    this.applyFilters();
    search?.focus();
  }

  static chooseOption(event, target) {
    event.preventDefault();
    const value = target.dataset.value;
    if (!value || this.selected.has(value)) return;
    this.selected.add(value);
    const choice = this.choices.find(item => item.value === value);
    const list = this.element.querySelector("[data-selected-list]");
    const row = document.createElement("div");
    row.className = "ml-list-button ml-training-selection__option";
    row.dataset.selectedRow = "";
    row.dataset.value = value;
    const text = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = choice?.label ?? value;
    const category = document.createElement("small");
    category.textContent = choice?.category ?? "";
    text.append(name, category);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "ml-icon-button";
    remove.dataset.action = "removeSelected";
    remove.dataset.value = value;
    remove.setAttribute("aria-label", `Remove ${choice?.label ?? value}`);
    remove.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    row.append(text, remove);
    list?.append(row);
    this.applyFilters();
    this.syncSelectedEmpty();
  }

  static removeSelected(event, target) {
    event.preventDefault();
    const value = target.dataset.value;
    this.selected.delete(value);
    target.closest("[data-selected-row]")?.remove();
    this.applyFilters();
    this.syncSelectedEmpty();
  }

  static clearSelected(event) {
    event.preventDefault();
    this.selected.clear();
    this.element.querySelector("[data-selected-list]")?.replaceChildren();
    this.applyFilters();
    this.syncSelectedEmpty();
  }

  static confirm(event) {
    event.preventDefault();
    const keys = [...this.selected];
    const confirm = this.onConfirm;
    return this.close().then(() => confirm?.(keys));
  }

  static cancel(event) {
    event.preventDefault();
    return this.close();
  }
}

export function openOptionPicker(options = {}) {
  return new OptionPickerApp(options).render({ force: true, focus: true });
}
