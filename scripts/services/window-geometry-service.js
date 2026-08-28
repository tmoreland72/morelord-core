const DEFAULT_MARGIN = 16;

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export class WindowGeometryService {
  constructor({ moduleId, settingKey, windowClass = "ml-window" }) {
    this.moduleId = moduleId;
    this.settingKey = settingKey;
    this.windowClass = windowClass;
    this.tracked = new WeakSet();
    this.applications = new Set();
    this.restoring = new WeakSet();
    this.timers = new Map();
  }

  registerSetting() {
    game.settings.register(this.moduleId, this.settingKey, {
      scope: "client",
      config: false,
      type: Object,
      default: {}
    });
  }

  start() {
    Hooks.on("renderApplicationV2", (application, element) => this.track(application, element));
    Hooks.on("renderApplication", (application, element) => this.track(application, element));
    Hooks.on("closeApplicationV2", application => this.close(application));
    Hooks.on("closeApplication", application => this.close(application));
    window.addEventListener("pointerup", () => {
      for (const application of this.applications) this.scheduleRemember(application);
    });
  }

  track(application, renderedElement) {
    const element = renderedElement instanceof HTMLElement ? renderedElement : application?.element;
    const key = this.keyFor(application);
    const isMorelordWindow = element?.classList?.contains(this.windowClass) || key.startsWith("morelord-");
    if (!application || !element || !isMorelordWindow) return;
    if (!this.tracked.has(application)) {
      this.tracked.add(application);
      this.applications.add(application);
      this.restore(application);
      const remember = () => this.scheduleRemember(application);
      element.addEventListener("pointerup", remember);
      element.addEventListener("transitionend", remember);
      if (globalThis.ResizeObserver) new ResizeObserver(remember).observe(element);
    }
  }

  close(application) {
    void this.remember(application);
    this.applications.delete(application);
  }

  keyFor(application) {
    return String(application?.options?.id ?? application?.id ?? application?.constructor?.name ?? "").trim();
  }

  restore(application) {
    const key = this.keyFor(application);
    const saved = this.all()[key];
    if (!key || !saved || typeof application.setPosition !== "function") return;
    requestAnimationFrame(() => {
      const geometry = this.fitToViewport(saved);
      this.restoring.add(application);
      application.setPosition(geometry);
      requestAnimationFrame(() => this.restoring.delete(application));
    });
  }

  scheduleRemember(application) {
    if (this.restoring.has(application)) return;
    const key = this.keyFor(application);
    if (!key) return;
    clearTimeout(this.timers.get(key));
    this.timers.set(key, setTimeout(() => {
      this.timers.delete(key);
      void this.remember(application);
    }, 200));
  }

  async remember(application) {
    if (!application || this.restoring.has(application)) return;
    const key = this.keyFor(application);
    const element = application.element;
    if (!key || !element) return;
    const rect = element.getBoundingClientRect();
    const position = application.position ?? {};
    const geometry = {
      left: finite(position.left) ?? finite(rect.left),
      top: finite(position.top) ?? finite(rect.top),
      width: finite(position.width) ?? finite(rect.width),
      height: finite(position.height) ?? finite(rect.height)
    };
    if (Object.values(geometry).some(value => value === null) || geometry.width < 100 || geometry.height < 80) return;
    const state = this.all();
    state[key] = geometry;
    await game.settings.set(this.moduleId, this.settingKey, state);
  }

  fitToViewport(saved) {
    const maximumWidth = Math.max(100, window.innerWidth - DEFAULT_MARGIN * 2);
    const maximumHeight = Math.max(80, window.innerHeight - DEFAULT_MARGIN * 2);
    const width = clamp(finite(saved.width) ?? maximumWidth, 100, maximumWidth);
    const height = clamp(finite(saved.height) ?? maximumHeight, 80, maximumHeight);
    return {
      width,
      height,
      left: clamp(finite(saved.left) ?? DEFAULT_MARGIN, DEFAULT_MARGIN, window.innerWidth - width - DEFAULT_MARGIN),
      top: clamp(finite(saved.top) ?? DEFAULT_MARGIN, DEFAULT_MARGIN, window.innerHeight - height - DEFAULT_MARGIN)
    };
  }

  all() {
    return foundry.utils.deepClone(game.settings.get(this.moduleId, this.settingKey) || {});
  }

  async reset(windowId = null) {
    if (!windowId) return game.settings.set(this.moduleId, this.settingKey, {});
    const state = this.all();
    delete state[windowId];
    return game.settings.set(this.moduleId, this.settingKey, state);
  }
}
