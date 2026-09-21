import { assert } from "./in-game.js";

export const connectionLayoutCheck = {
  id: "core.connection-checkbox-layout",
  async run() {
    const app = await MorelordCore.open();
    try {
      app.setPosition({width:460});
      await new Promise(resolve=>requestAnimationFrame(resolve));
      const input = app.element.querySelector('[name="shareUsageStatistics"]');
      const label = input.closest('label');
      const help = app.element.querySelector(`#${input.getAttribute('aria-describedby')}`);
      assert(help?.textContent.includes('random world reporting ID'), 'The reporting identity must be explained beneath the checkbox.');
      assert(app.element.querySelector('[name="shareErrorReports"]'), 'Error reporting must have a separate control without requiring account connection.');
      assert(label.getBoundingClientRect().right <= label.parentElement.getBoundingClientRect().right + 1, 'Version-sharing label must fit the settings window.');
      const initial = input.checked;
      label.querySelector('span').click();
      assert(input.checked !== initial, 'Clicking the short privacy label must toggle the checkbox.');
      input.checked = initial;
      await globalThis.captureCheckboxLayout?.('connection',app.element);
    } finally { await app.close(); }
  }
};
