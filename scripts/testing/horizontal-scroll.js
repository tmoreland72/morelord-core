import { assert } from './in-game.js';
import { applyPageLayout } from '../ui/page-layout.js';

export const horizontalScrollCheck = {
  id: 'core.horizontal-table-scroll',
  async run() {
    const root = document.createElement('div');
    root.className = 'application ml-window';
    root.style.width = '360px';
    root.innerHTML = '<div class="window-content"><section class="ml-app ml-app-shell"><div style="overflow:auto"><div class="ml-horizontal-scroll"><table style="width:800px"><tbody><tr><td>Wide table fixture</td></tr></tbody></table></div></div><div class="ml-card ml-item-row"><img src="icons/svg/item-bag.svg" alt=""><div class="ml-stack"><a class="content-link ml-item-link">An exceptionally long inventory item name that must wrap inside its cart card</a></div></div></section></div>';
    document.body.append(root);
    try {
      applyPageLayout({ element: root });
      const body = root.querySelector('.ml-page-body'), region = root.querySelector('.ml-horizontal-scroll');
      assert(!region.classList.contains('ml-page-flow'), 'Page layout preserves horizontal table scrolling.');
      assert(region.parentElement.classList.contains('ml-page-flow'), 'Ancestors keep single vertical page flow.');
      assert(getComputedStyle(region).overflowX === 'auto' && getComputedStyle(region).overflowY === 'hidden', 'Table has no vertical scroll pane.');
      assert(region.scrollWidth > region.clientWidth && body.scrollWidth <= body.clientWidth + 1, 'Wide table stays inside the page.');
      region.scrollLeft = 50;
      assert(region.scrollLeft === 50, 'Horizontal scrolling works.');
      const link = root.querySelector('.ml-item-link');
      assert(getComputedStyle(link).whiteSpace === 'normal' && link.scrollWidth <= link.clientWidth + 1, 'Long shared item links wrap inside cards.');
    } finally { root.remove(); }
  }
};
