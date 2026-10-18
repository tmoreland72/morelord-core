import { actorIdentity } from "./actor-identity.js";
import { activateImageFallbacks } from "./image-fallbacks.js";

/** Shared monster identity, CR/source, and action card. Callers supply action behavior. */
export function createMonsterCard(monster, { quantity = null, showDetails = true, actions = [] } = {}) {
  const card = document.createElement("article");
  card.className = "ml-card ml-monster-card";
  const copy = document.createElement("span");
  copy.className = "ml-stack";
  copy.dataset.gap = "1";
  const name = document.createElement("strong");
  name.innerHTML = `${quantity == null ? "" : `${Number(quantity)}× `}${actorIdentity(monster)}`;
  copy.append(name);
  if (showDetails) {
    const detail = document.createElement("small");
    detail.textContent = `CR ${monster.cr ?? "?"} · ${monster.sourceLabel ?? monster.packLabel ?? monster.sourceId ?? "Unknown source"}`;
    copy.append(detail);
  }
  for (const text of [monster.requirements, monster.category].filter(Boolean)) {
    const detail = document.createElement("span");
    detail.textContent = text;
    copy.append(detail);
  }
  const controls = document.createElement("span");
  controls.className = "ml-actions ml-monster-card__actions";
  controls.append(...actions);
  card.append(copy, controls);
  const portrait = card.querySelector("img");
  if (portrait) portrait.dataset.mlImageFallback = "icons/svg/mystery-man.svg";
  activateImageFallbacks(card);
  return card;
}
