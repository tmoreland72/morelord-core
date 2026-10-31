export class DocumentationService {
  #products = new Map();

  register(definition) {
    const id = String(definition?.id ?? "").trim();
    if (!id) throw new Error("Documentation requires a product id.");
    const product = structuredClone(definition);
    product.id = id;
    product.sections = Array.from(product.sections ?? []);
    if (!product.sections.length && !product.source) throw new Error(`Documentation '${id}' requires a guide source or at least one section.`);
    this.#products.set(id, product);
    return structuredClone(product);
  }

  get(id) {
    const product = this.#products.get(String(id));
    return product ? structuredClone(product) : null;
  }

  list() { return Array.from(this.#products.values(), product => structuredClone(product)); }

  open(id, section) {
    const products = ['morelord-character-export', 'morelord-core', 'morelord-craftworks', 'morelord-downtime', 'morelord-encounters', 'morelord-journeys', 'morelord-marketplace'];
    const path = products.includes(id) ? `/docs/${id}` : '/docs';
    const slug = String(section ?? "").trim().toLowerCase();
    const hash = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? `#${slug}` : "";
    return window.open(`https://morelordgaming.com${path}${hash}`, '_blank', 'noopener,noreferrer');
  }
}
