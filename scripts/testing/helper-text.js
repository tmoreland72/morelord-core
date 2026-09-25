import { assert } from './in-game.js';

// Shared with offline CSS verification; no world documents or settings are changed.
export const helperTextCheck = {
  id: 'core.helper-text',
  run() {
    const fixture = document.createElement('div');
    fixture.className = 'ml-window';
    fixture.innerHTML = `<div class="window-content"><section class="ml-app"><form class="standard-form ml-surface"><p data-plain>Plain section text</p><div class="form-group"><p class="notes">Notes helper</p><p class="hint">Hint helper</p><div class="ml-section-heading"><div><h2>Section</h2><p class="notes">Section subtitle</p></div></div></div></form></section><section class="ml-chat-card"><p class="notes">Chat notes</p><p class="hint">Chat hint</p></section></div>`;
    document.body.append(fixture);
    try {
      for (const scope of fixture.querySelectorAll('.ml-app, .ml-chat-card')) {
        const notes = getComputedStyle(scope.querySelector('.notes'));
        const hint = getComputedStyle(scope.querySelector('.hint'));
        const subtitle = scope.querySelector('.ml-section-heading p');
        if (subtitle) assert(getComputedStyle(subtitle).color === getComputedStyle(scope).color, 'Section subtitles must use the main text color.');
        const plain = scope.querySelector('[data-plain]');
        if (plain) assert(getComputedStyle(plain).color === notes.color, 'Plain section text must match notes.');
        assert(hint.color === notes.color, 'Hints must match the shared notes color.');
        assert(hint.fontWeight === notes.fontWeight && hint.fontWeight === '400', 'Helper text must use normal weight.');
      }
    } finally { fixture.remove(); }
  }
};

/** Check the distinction between section subtitles and plain body descriptions. */
export function assertSectionText(html, selector) {
  const fixture = document.createElement('div');
  fixture.className = 'ml-window';
  fixture.innerHTML = `<div class="window-content">${html}</div>`;
  document.body.append(fixture);
  try {
    const reference = document.createElement('span');
    reference.style.color = 'var(--ml-color-muted)';
    fixture.querySelector('.ml-app').append(reference);
    const helpers = fixture.querySelectorAll(selector);
    assert(helpers.length > 0, 'The module fixture must render helper text.');
    for (const helper of helpers) {
      const style = getComputedStyle(helper);
      reference.style.color = helper.closest('.ml-section-heading') ? 'var(--ml-color-text)' : 'var(--ml-color-muted)';
      const expectedColor = getComputedStyle(reference).color;
      assert(style.color === expectedColor && style.fontWeight === '400' && style.opacity === '1',
        `Section subtitle/body color or normal weight is incorrect: ${helper.textContent.trim().slice(0, 90)}`);
    }
  } finally { fixture.remove(); }
}
