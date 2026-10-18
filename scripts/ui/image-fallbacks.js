const initialized = new WeakSet();

/** Opt-in image fallback for unavailable portraits and reference artwork. */
export function activateImageFallbacks(root) {
  for (const image of root.querySelectorAll("img[data-ml-image-fallback]")) {
    if (initialized.has(image)) continue;
    initialized.add(image);
    const replace = () => {
      const fallback = image.dataset.mlImageFallback;
      if (fallback && image.getAttribute("src") !== fallback) image.setAttribute("src", fallback);
    };
    image.addEventListener("error", replace, { once: true });
    if (image.complete && image.naturalWidth === 0) replace();
  }
}
