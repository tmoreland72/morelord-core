import { listCharacterActors } from "./actor-participation.js";

const foundryApi = globalThis.foundry?.applications?.api;
class FallbackApplication {
  async _prepareContext() { return {}; }
  async _onRender() {}
  render() { return Promise.resolve(this); }
}
const ApplicationV2 = foundryApi?.ApplicationV2 ?? FallbackApplication;
const HandlebarsApplicationMixin = foundryApi?.HandlebarsApplicationMixin ?? (Base => class extends Base {});

const ENCOUNTERS_MODULE_ID = "morelord-encounters";
const ENCOUNTERS_PRODUCT_URL = "https://morelord.com/products/morelord-encounters";
const ENCOUNTERS_MODULE_PATH = "modules/morelord-encounters/scripts/apps/encounter-builder-dialog.mjs";
const AWARD_REQUIRED = "Delerium search results require an award function.";

let openApp = null;

function actorList(actors) {
  if (!actors) return [];
  return typeof actors[Symbol.iterator] === "function" ? [...actors] : [];
}

export function deleriumRecipientChoices(actors = globalThis.game?.actors) {
  const documents = actorList(actors);
  const characters = listCharacterActors({ actors });
  const groups = documents.filter(actor => actor?.type === "group");
  return [...groups, ...characters]
    .map(actor => ({
      uuid: actor.uuid,
      name: actor.type === "group" ? `${actor.name} (Group Inventory)` : actor.name,
      group: actor.type === "group"
    }))
    .sort((left, right) => Number(right.group) - Number(left.group) || left.name.localeCompare(right.name));
}

function firstParticipantUuid(session, recipients) {
  return Object.values(session?.participants ?? {})
    .map(entry => entry?.actorUuid)
    .find(uuid => recipients.some(recipient => recipient.uuid === uuid)) ?? null;
}

export async function openMorelordEncounters(game = globalThis.game, load = url => import(url)) {
  const module = game?.modules?.get?.(ENCOUNTERS_MODULE_ID);
  if (!module) {
    globalThis.ui?.notifications?.warn?.("Install Morelord Encounters from Foundry's Add-on Modules screen first.");
    return;
  }
  if (!module.active) {
    globalThis.ui?.notifications?.warn?.("Enable Morelord Encounters in Manage Modules first.");
    return;
  }
  const api = module.api;
  const open = api?.openEncounterBuilder ?? api?.open;
  if (typeof open === "function") {
    await open.call(api);
    return;
  }
  const moduleUrl = globalThis.foundry?.utils?.getRoute?.(ENCOUNTERS_MODULE_PATH) ?? `/${ENCOUNTERS_MODULE_PATH}`;
  const loaded = await load(moduleUrl);
  if (typeof loaded?.configureEncounter !== "function") {
    throw new Error("Morelord Encounters does not expose its encounter builder.");
  }
  await loaded.configureEncounter();
}

export class DeleriumSearchResultsApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "morelord-core-delerium-search-results",
    classes: ["ml-window"],
    tag: "section",
    position: { width: 640, height: "auto" },
    window: { title: "Delerium Search Results", icon: "fa-solid fa-gem", resizable: true },
    actions: {
      rollAward: DeleriumSearchResultsApp.rollAward,
      openEncounters: DeleriumSearchResultsApp.openEncounters
    }
  };

  static PARTS = {
    content: { template: "modules/morelord-core/templates/delerium-search-results.hbs" }
  };

  constructor({ session = null, award = null, defaultRecipientUuid = null } = {}) {
    super();
    this.selectedRecipientUuid = null;
    this.configure(session, { award, defaultRecipientUuid });
  }

  configure(session, { award, defaultRecipientUuid = null } = {}) {
    const sameSession = Boolean(this.session?.id && this.session.id === session?.id);
    this.session = session;
    this.award = award;
    this.defaultRecipientUuid = defaultRecipientUuid;
    if (!sameSession) this.selectedRecipientUuid = null;
  }

  chooseRecipient(recipients) {
    if (this.selectedRecipientUuid && recipients.some(entry => entry.uuid === this.selectedRecipientUuid)) {
      return this.selectedRecipientUuid;
    }
    if (this.defaultRecipientUuid && recipients.some(entry => entry.uuid === this.defaultRecipientUuid)) {
      return this.defaultRecipientUuid;
    }
    return firstParticipantUuid(this.session, recipients) ?? recipients[0]?.uuid ?? "";
  }

  async _prepareContext(options) {
    const context = await super._prepareContext?.(options) ?? {};
    const session = this.session ?? {};
    const recipients = deleriumRecipientChoices().map(recipient => ({ ...recipient }));
    this.selectedRecipientUuid = this.chooseRecipient(recipients);
    for (const recipient of recipients) recipient.selected = recipient.uuid === this.selectedRecipientUuid;
    const encountersModule = globalThis.game?.modules?.get?.(ENCOUNTERS_MODULE_ID);
    const encountersInstalled = Boolean(encountersModule);
    const encountersActive = Boolean(encountersModule?.active);
    const randomEncounter = session.randomEncounter === true;
    const hasReward = Boolean(session.rewards?.length);
    const hasResult = Boolean(session.result);
    return {
      ...context,
      session,
      hasReward,
      hasResult,
      rewards: session.rewards ?? [],
      awardedItems: session.result?.items ?? [],
      recipients,
      canAward: hasReward && !hasResult,
      encounterTitle: randomEncounter ? "Random Encounter Required" : "No Random Encounter",
      encounterText: randomEncounter
        ? "Two or more characters failed their checks. Resolve a random encounter for this search."
        : "Fewer than two characters failed. This search does not trigger a random encounter.",
      encountersInstalled,
      encountersActive,
      encountersProductUrl: ENCOUNTERS_PRODUCT_URL,
      encountersUnavailableText: encountersInstalled
        ? "Morelord Encounters is installed but not active. Enable it in Manage Modules to build this encounter."
        : "Install Morelord Encounters from Foundry's Add-on Modules screen to build this encounter automatically."
    };
  }

  async _onRender(context, options) {
    await super._onRender?.(context, options);
    this.element?.querySelector?.("[name='recipientUuid']")?.addEventListener("change", event => {
      this.selectedRecipientUuid = event.currentTarget.value;
    });
  }

  static async rollAward(event, target) {
    event?.preventDefault?.();
    const select = this.element?.querySelector?.("[name='recipientUuid']");
    if (select) this.selectedRecipientUuid = select.value;
    if (target) target.disabled = true;
    try {
      if (typeof this.award !== "function") throw new Error(AWARD_REQUIRED);
      const updated = await this.award(this.selectedRecipientUuid);
      if (updated?.type === "delerium-search") this.session = updated;
      await this.render({ force: true });
    } catch (error) {
      globalThis.ui?.notifications?.error?.(error?.message ?? String(error));
      if (target) target.disabled = false;
    }
  }

  static async openEncounters(event, target) {
    event?.preventDefault?.();
    if (target) target.disabled = true;
    try {
      await openMorelordEncounters();
    } catch (error) {
      globalThis.ui?.notifications?.error?.(`Could not open Morelord Encounters: ${error.message}`);
    } finally {
      if (target) target.disabled = false;
    }
  }

  async close(options) {
    const closed = typeof super.close === "function" ? await super.close(options) : this;
    if (openApp === this) openApp = null;
    return closed;
  }
}

export function openDeleriumSearchResults(session, { award, defaultRecipientUuid = null } = {}) {
  if (typeof award !== "function") throw new Error(AWARD_REQUIRED);
  if (!openApp) openApp = new DeleriumSearchResultsApp({ session, award, defaultRecipientUuid });
  else openApp.configure(session, { award, defaultRecipientUuid });
  return openApp.render({ force: true });
}
