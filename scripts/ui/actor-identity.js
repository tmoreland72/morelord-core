const FALLBACK_AVATAR = "icons/svg/mystery-man.svg";
const escape = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

/** Shared inline identity for actors and saved actor snapshots. */
export function actorIdentity(identity = {}) {
  const uuid = identity.actorUuid ?? identity.uuid;
  let actor;
  try { actor = uuid ? globalThis.fromUuidSync?.(uuid) : null; } catch { /* Deleted or unavailable actors use their snapshot. */ }
  const name = identity.name ?? identity.actorName ?? actor?.name ?? "Unknown character";
  const img = identity.img || actor?.img || actor?.prototypeToken?.texture?.src || FALLBACK_AVATAR;
  return `<span class="ml-actor-identity"><img class="ml-avatar" src="${escape(img)}" alt="" loading="lazy"><span>${escape(name)}</span></span>`;
}

/** Native options are text-only; keep the selected actor's portrait alongside the select. */
export function decorateActorSelect(select, resolveUuid = value => value) {
  if (select.parentElement?.tagName === "LABEL") select.parentElement.classList.add("ml-actor-select-field");
  let preview = select.nextElementSibling;
  if (!preview?.hasAttribute("data-ml-actor-select-preview")) {
    preview = document.createElement("span");
    preview.dataset.mlActorSelectPreview = "";
    preview.setAttribute("aria-hidden", "true");
    select.after(preview);
    select.addEventListener("change", () => decorateActorSelect(select, resolveUuid));
  }
  preview.hidden = !select.value;
  preview.innerHTML = select.value ? actorIdentity({ actorUuid: resolveUuid(select.value), name: select.selectedOptions[0]?.textContent }) : "";
  preview.querySelector(".ml-actor-identity > span")?.remove();
}
