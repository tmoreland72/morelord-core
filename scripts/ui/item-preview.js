/** Open a readable item sheet without changing the source's permissions or world data. */
export async function openItemPreview(item) {
  if (!item || item.documentName !== "Item") throw new Error("This item is no longer available.");
  if (item.testUserPermission(game.user, "OBSERVER")) return item.sheet.render({ force: true, editable: false });
  const data = item.toObject();
  delete data._id;
  delete data.folder;
  // Observer access keeps secrets hidden and grants no editing rights. This document is never saved.
  data.ownership = { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE, [game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER };
  const preview = new CONFIG.Item.documentClass(data);
  return preview.sheet.render({ force: true, editable: false });
}
