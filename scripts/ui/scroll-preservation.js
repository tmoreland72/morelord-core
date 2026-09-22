const latestRender = new WeakMap();

/** Preserve page and keyed panel positions, including panels temporarily hidden by a tab. */
export async function renderPreservingScroll(application, renderOperation, {
  selector = ".window-content, .ml-page-body, [data-ml-scroll-key]",
  positions = new Map(),
  reset = false,
  deferred = false
} = {}) {
  const renderToken = {};
  latestRender.set(application, renderToken);
  const entries = root => scrollEntries(root, selector);
  if (reset) { positions.clear(); automaticScroll.get(application.element)?.positions.clear(); }
  for (const { element, key } of entries(application.element)) {
    // Wildcard consumers preserve nested overflow without retaining every DOM node.
    if (selector === "*" && !element.scrollTop && !element.scrollLeft) {
      const style = globalThis.getComputedStyle?.(element);
      if (!/auto|scroll/.test(`${style?.overflowX} ${style?.overflowY}`)) continue;
    }
    positions.set(key, { top: reset ? 0 : element.scrollTop, left: reset ? 0 : element.scrollLeft });
  }
  const result = await renderOperation();
  const root = application.element;
  const restore = () => {
    if (latestRender.get(application) !== renderToken || application.element !== root || root?.isConnected === false) return;
    for (const { element, key } of entries(root)) {
      const position = reset ? { top: 0, left: 0 } : positions.get(key);
      if (!position) continue;
      element.scrollTop = position.top;
      element.scrollLeft = position.left;
    }
  };
  restore();
  if (reset) automaticScroll.get(root)?.capture();
  if (deferred && globalThis.requestAnimationFrame) {
    requestAnimationFrame(() => requestAnimationFrame(restore));
  }
  return result;
}

function scrollEntries(root, selector) {
    const counts = new Map();
    const elements = Array.from(root?.querySelectorAll?.(selector) ?? []);
    if (root?.matches?.(selector)) elements.unshift(root);
    return elements.map(element => {
      const explicit = element.dataset?.mlScrollKey ?? element.dataset?.scrollKey;
      const signature = explicit ? `key:${explicit}` : element.id ? `id:${element.id}`
        : `${element.tagName}.${Array.from(element.classList ?? []).sort().join(".")}`;
      const ordinal = counts.get(signature) ?? 0;
      counts.set(signature, ordinal + 1);
      return { element, key: `${signature}:${ordinal}` };
    });
  }

const automaticScroll = new WeakMap();
const applicationScroll = new WeakMap();

/** Default for every Core window, including plain DOM trays and newly inserted panels. */
export function preserveWindowScroll(application, root = application?.element) {
  if (!root?.addEventListener || !globalThis.MutationObserver) return;
  let state=automaticScroll.get(root) ?? applicationScroll.get(application);
  if (!state) {
    state={positions:new Map(),nodes:new Map(),root:null,observer:null};
    state.capture=()=>{
      for (const [element,key] of state.nodes) {
        if (element.isConnected && element.getClientRects().length) state.positions.set(key,{top:element.scrollTop,left:element.scrollLeft});
      }
    };
    state.refresh=()=>{
      if (!state.root.isConnected) return;
      const scope=state.root.querySelector('[role="tab"][aria-selected="true"]')?.id ?? '';
      state.nodes=new Map(scrollEntries(state.root,'*').filter(({element})=>{
        const style=getComputedStyle(element);
        return element.matches('.window-content, .ml-page-body, [data-ml-scroll-key]') || /auto|scroll/.test(`${style.overflowX} ${style.overflowY}`);
      }).map(({element,key})=>[element,`${scope}:${key}`]));
      for (const [element,key] of state.nodes) {
        if (!element.getClientRects().length) continue;
        const saved=state.positions.get(key);
        if(saved) {element.scrollTop=saved.top;element.scrollLeft=saved.left;}
      }
      state.capture();
    };
    state.onScroll=event=>{
      const key=state.nodes.get(event.target);
      if(key && event.target.isConnected && event.target.getClientRects().length)
        state.positions.set(key,{top:event.target.scrollTop,left:event.target.scrollLeft});
    };
  }
  if (state.root!==root) {
    if(state.root) {
      state.observer.disconnect();
      state.root.removeEventListener('scroll',state.onScroll,true);
      for(const name of ['pointerdown','click','keydown','change']) state.root.removeEventListener(name,state.capture,true);
    }
    state.root=root;
    root.addEventListener('scroll',state.onScroll,true);
    for(const name of ['pointerdown','click','keydown','change']) root.addEventListener(name,state.capture,true);
    state.observer=new MutationObserver(state.refresh);
    state.observer.observe(root,{childList:true,subtree:true});
    automaticScroll.set(root,state);
    applicationScroll.set(application,state);
  }
  state.refresh();
}
