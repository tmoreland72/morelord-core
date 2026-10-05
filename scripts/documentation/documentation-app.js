// Preserve existing module callers while routing documentation to the website.
export class DocumentationApp {
  static service = null;
  static configure(service) { this.service = service; }
  constructor({ productId } = {}) { this.productId = productId; }
  render() { return this.constructor.service.open(this.productId); }
}
