const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class DocumentationApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static service = null;
  static configure(service) { this.service = service; }
  static DEFAULT_OPTIONS = {
    id: "morelord-documentation",
    classes: ["ml-window", "ml-documentation-window"],
    position: { width: 980, height: 760 },
    window: { title: "Morelord Documentation", icon: "fa-solid fa-book-open", resizable: true },
    actions: { jumpToSection: DocumentationApp.jumpToSection }
  };
  static PARTS = { content: { template: "modules/morelord-core/templates/documentation.hbs" } };

  constructor({ productId, ...options } = {}) {
    super({ id: `morelord-documentation-${String(productId ?? "product")}`, ...options });
    this.productId = productId;
  }

  render(options = {}) {
    const preserve = game.modules.get("morelord-core")?.api?.ui?.renderPreservingScroll;
    return preserve ? preserve(this, () => super.render(options)) : super.render(options);
  }

  async _prepareContext(options) {
    const product = this.constructor.service.get(this.productId);
    if (!product) throw new Error(`Documentation '${this.productId}' is not registered.`);
    return { ...await super._prepareContext(options), product };
  }

  static jumpToSection(event, target) {
    event.preventDefault();
    this.element.querySelector(`[data-documentation-section="${CSS.escape(target.dataset.sectionId)}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
