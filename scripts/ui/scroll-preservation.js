export async function renderPreservingScroll(application, renderOperation, { selector = ".window-content" } = {}) {
  const positions = Array.from(application.element?.querySelectorAll?.(selector) ?? [], element => ({
    key: element.dataset.mlScrollKey ?? null,
    top: element.scrollTop,
    left: element.scrollLeft
  }));
  const result = await renderOperation();
  const replacements = Array.from(application.element?.querySelectorAll?.(selector) ?? []);
  positions.forEach((position, index) => {
    const replacement = position.key
      ? replacements.find(element => element.dataset.mlScrollKey === position.key)
      : replacements[index];
    replacement?.scrollTo({ top: position.top, left: position.left, behavior: "auto" });
  });
  return result;
}
