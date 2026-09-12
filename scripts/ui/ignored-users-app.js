import { IGNORED_USERS_SETTING, isIgnored } from "../services/user-service.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class IgnoredUsersApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "morelord-core-ignored-users",
    classes: ["ml-window"],
    tag: "form",
    window: { title: "Morelord Ignored Users", resizable: true },
    position: { width: 460 },
    form: { closeOnSubmit: true, handler: IgnoredUsersApp.save }
  };

  static PARTS = {
    content: { template: "modules/morelord-core/templates/ignored-users.hbs" }
  };

  async _prepareContext() {
    return { users: Array.from(game.users).map(user => ({ id: user.id, name: user.name, ignored: isIgnored(user) })) };
  }

  static async save(event, form) {
    if (!game.user.isGM) return;
    const ids = new FormData(form).getAll("ignoredUserIds").filter(id => game.users.has(id));
    await game.settings.set("morelord-core", IGNORED_USERS_SETTING, ids);
  }
}
