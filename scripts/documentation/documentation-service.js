export class DocumentationService {
  #products = new Map();

  register(definition) {
    const id = String(definition?.id ?? "").trim();
    if (!id) throw new Error("Documentation requires a product id.");
    const product = structuredClone(definition);
    product.id = id;
    product.sections = Array.from(product.sections ?? []);
    if (!product.sections.length) throw new Error(`Documentation '${id}' requires at least one section.`);
    this.#products.set(id, product);
    return structuredClone(product);
  }

  get(id) {
    const product = this.#products.get(String(id));
    return product ? structuredClone(product) : null;
  }

  list() { return Array.from(this.#products.values(), product => structuredClone(product)); }
}
