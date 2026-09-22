const MODULE_ID = 'morelord-core';
let queue = Promise.resolve();

// Foundry stores folder placement separately from pack identity. Never recreate a pack to rename it.
export function labelCompendiums(entries) {
  for (const {collection, label} of entries) {
    const pack = game.packs.get(collection);
    if (pack && label) pack.metadata.label = label;
  }
  ui.compendium?.render(false);
}

export function organizeCompendiums(entries, path, {migration = 1, legacyRoot = null, force = false} = {}) {
  labelCompendiums(entries);
  if (!game.user.isGM || (!force && game.users.activeGM?.id !== game.user.id)) return Promise.resolve();
  queue = queue.catch(() => {}).then(async () => {
    const saved = foundry.utils.deepClone(game.settings.get(MODULE_ID, 'compendiumOrganization'));
    const packs = entries.map(entry => game.packs.get(entry.collection)).filter(Boolean);
    const pending = packs.filter(pack => force || saved[pack.collection] !== migration);
    if (!pending.length) return;
    let parent = null;
    for (const name of path) {
      let folder = game.folders.find(f => f.type === 'Compendium' && f.name === name && (f.folder?.id ?? null) === (parent?.id ?? null));
      if (!folder && !parent && path.length === 1 && legacyRoot) {
        const legacy = game.folders.find(f => f.type === 'Compendium' && !f.folder && f.name === legacyRoot);
        const owned = new Set(packs.map(pack => pack.collection));
        if (legacy && !game.folders.some(f => f.folder?.id === legacy.id)
          && ![...game.packs].some(pack => pack.folder?.id === legacy.id && !owned.has(pack.collection))) {
          folder = await legacy.update({name});
        }
      }
      folder ??= await Folder.create({name, type:'Compendium', folder:parent?.id ?? null, sorting:'a'});
      parent = folder;
    }
    for (const pack of pending) {
      if (pack.folder?.id !== parent.id) await pack.configure({folder:parent.id});
      saved[pack.collection] = migration;
    }
    await game.settings.set(MODULE_ID, 'compendiumOrganization', saved);
    return parent;
  });
  return queue;
}
