import { assert } from "./in-game.js";
import { rollControls } from "../services/chat-roll-requests.js";

export const singleActionControlsCheck = {
  id: "core.single-action-controls",
  async run() {
    assert(game.world.id === "dev1", "This check requires Dev1.");
    const card = document.createElement("section");
    card.className = "ml-chat-card";
    document.body.append(card);
    try {
      for (const width of [260, 340]) {
        card.style.width = `${width}px`;
        card.innerHTML = rollControls(() => "", { modes: false, actionLabel: "Long Rest" });
        const row = card.firstElementChild;
        const button = row.firstElementChild;
        assert(Math.abs(button.getBoundingClientRect().width - row.getBoundingClientRect().width) < 2,
          `Long Rest must span the ${width}px card row.`);
        card.innerHTML = rollControls(() => "");
        const buttons = [...card.querySelectorAll("button")];
        assert(buttons.length === 3 && buttons[0].getBoundingClientRect().right <= buttons[1].getBoundingClientRect().left,
          "Three-button roll controls must remain side by side.");
      }
    } finally { card.remove(); }
  }
};
