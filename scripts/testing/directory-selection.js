import { assert } from './in-game.js';

const waitFor = async (predicate, message) => {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error(message ?? 'Directory selection did not reach the expected state.');
};

async function answerConfirmation(action) {
  await waitFor(() => {
    const dialog = document.querySelector('dialog[open] .ml-core-directory-delete-list')?.closest('dialog');
    return dialog && foundry.applications.instances.get(dialog.id)?.rendered;
  }, 'Confirmation did not finish rendering');
  const dialog = document.querySelector('dialog[open] .ml-core-directory-delete-list').closest('dialog');
  dialog.querySelector(`[data-action="${action}"]`).click();
}

export const directorySelectionCheck = {
  id: 'core.directory-selection',
  async run() {
    assert(game.user.isGM, 'Run as GM in Dev1.');
    const fixtures = [];
    const previousTab = ui.sidebar.tabGroups.primary;
    const previouslyExpanded = ui.sidebar.expanded;
    try {
      for (const tab of ['scenes', 'actors', 'items', 'journal', 'tables', 'cards', 'macros', 'playlists']) {
        const app = ui[tab];
        await app.render({ force: true });
        assert(app.element.querySelector('.ml-core-directory-selection'), `${tab} has shared selection controls.`);
        const press = text => [...app.element.querySelectorAll('.ml-core-directory-selection button')].find(button => button.textContent.startsWith(text))?.click();
        press('Select multiple');
        const seen = [];
        const compete = event => { seen.push(event.type); event.preventDefault(); };
        app.element.addEventListener('click', compete, true);
        app.element.addEventListener('pointerdown', compete, true);
        let probed = false;
        try {
          for (const row of app.element.querySelectorAll('.directory-item[data-entry-id], .directory-item[data-document-id]')) {
            if (!row.getClientRects().length) continue;
            const check = row.querySelector('.ml-core-directory-check');
            const id = row.dataset.entryId ?? row.dataset.documentId;
            assert(check, `${tab} shows a checkbox for ${id}.`);
            const input = check.querySelector('input');
            const box = input.getBoundingClientRect();
            assert(box.width >= 12 && box.height >= 12, `${tab} checkbox for ${id} is visible.`);
            const header = row.querySelector(':scope > .playlist-header, :scope > header.playlist-header');
            const follows = (earlier, later) => Boolean(later) && Boolean(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING);
            if (header) assert(header.firstElementChild === check, `${tab} checkbox is the leftmost playlist header control.`);
            else assert(row.firstElementChild === check, `${tab} checkbox is the leftmost row control.`);
            if (row.classList.contains('scene')) assert(check.classList.contains('ml-core-directory-check--scene'), `${tab} checkbox overlays the scene row.`);
            const thumbnail = row.querySelector('img.thumbnail, .thumbnail');
            const name = (header ?? row).querySelector('.playlist-name, .entry-name, .document-name');
            if (thumbnail) assert(follows(check, thumbnail), `${tab} checkbox sits to the left of the thumbnail.`);
            if (name) assert(follows(check, name), `${tab} checkbox sits to the left of the name.`);
            const appearance = getComputedStyle(input).appearance;
            assert(appearance === 'none', `${tab} checkbox uses Foundry's flat checkbox.`);
            const frame = getComputedStyle(check);
            assert(parseFloat(frame.borderTopWidth) === 0 && parseFloat(frame.borderLeftWidth) === 0, `${tab} checkbox has no framed box.`);
            if (!probed) {
              const before = input.checked;
              input.click();
              const selector = row.dataset.entryId ? `[data-entry-id="${id}"]` : `[data-document-id="${id}"]`;
              const after = app.element.querySelector(`${selector} .ml-core-directory-check input`);
              assert(after && after.checked !== before, `${tab} checkbox still toggles.`);
              assert(seen.length === 0, `${tab} checkbox clicks ignore directory capture listeners.`);
              probed = true;
            }
          }
        } finally {
          app.element.removeEventListener('click', compete, true);
          app.element.removeEventListener('pointerdown', compete, true);
          press('Done selecting');
        }
      }
      for (const [tab, cls, data] of [['macros', Macro, { type: 'script', command: '' }], ['tables', RollTable, {}]]) {
        const app = ui[tab];
        const docs = await cls.createDocuments([0, 1, 2].map(i => ({ ...data, name: `Core multiselect fixture ${i}` })));
        fixtures.push(...docs);
        await ui.sidebar.changeTab(tab, 'primary');
        ui.sidebar.expand();
        await app.render({ force: true });
        const click = text => {
          const target = [...app.element.querySelectorAll('.ml-core-directory-selection button')].find(b => b.textContent.startsWith(text));
          assert(target && !target.disabled, `${text} is available.`); target.click();
        };
        click('Select multiple');
        const search = app.element.querySelector('search input');
        const savedSearch = search.value;
        try {
          search.value = docs[0].name;
          search.dispatchEvent(new Event('input', { bubbles: true }));
          await waitFor(() => {
            const row = app.element.querySelector(`[data-entry-id="${docs[1].id}"]`);
            return row && !row.getClientRects().length;
          }, 'Native search did not hide nonmatching entries');
          click('Select visible');
          const selected = [...app.element.querySelectorAll('.ml-core-directory-check input:checked')];
          assert(selected.length === 1 && selected[0].closest('.directory-item').dataset.entryId === docs[0].id, 'Select visible respects native search.');
          click('Clear selection');
          assert(!app.element.querySelector('.ml-core-directory-check input:checked'), 'Clear selection unchecks entries.');
        } finally {
          search.value = savedSearch;
          search.dispatchEvent(new Event('input', { bubbles: true }));
        }
        for (const doc of docs.slice(0, 2)) {
          const input = app.element.querySelector(`[data-entry-id="${doc.id}"] .ml-core-directory-check input`);
          assert(input, 'Fixture has a checkbox.'); input.click();
        }
        await app.render({ force: true });
        assert(app.element.querySelectorAll('.ml-core-directory-check input:checked').length === 2, 'Selection survives rendering.');
        click('Delete selected');
        await answerConfirmation('no');
        await waitFor(() => !document.querySelector('.ml-core-directory-delete-list'), 'Cancellation did not close confirmation');
        assert(docs.every(doc => app.collection.has(doc.id)), 'Cancel preserves documents.');
        await waitFor(() => !app.element.querySelector('.ml-core-directory-selection button').disabled, 'Directory stayed busy');
        click('Delete selected');
        await answerConfirmation('yes');
        await waitFor(() => docs.slice(0, 2).every(doc => !app.collection.has(doc.id)), 'Confirmed documents were not deleted');
        assert(app.collection.has(docs[2].id), 'Unselected document is preserved.');
        await waitFor(() => !app.element.querySelector('.ml-core-directory-selection button').disabled, 'Directory stayed busy');
        click('Done selecting');
        assert(!app.element.querySelector('.ml-core-directory-check'), 'Done removes selection controls.');
      }
    } finally {
      const dialog = document.querySelector('dialog .ml-core-directory-delete-list')?.closest('dialog');
      if (dialog) await foundry.applications.instances.get(dialog.id)?.close();
      for (const doc of fixtures) if (doc.collection.has(doc.id)) await doc.delete();
      await ui.sidebar.changeTab(previousTab, 'primary');
      ui.sidebar.toggleExpanded(previouslyExpanded);
    }
  }
};

