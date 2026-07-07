/* AP Mobile Reality Pass
   Sprint 29 Principle: Mobile is not a smaller desktop. Mobile is a different operating environment.
*/

const MOBILE_QUERY = '(max-width: 860px)';
const TOUCH_QUERY = '(pointer: coarse)';

export function initializeMobileRealityPass() {
  const mobileMql = window.matchMedia(MOBILE_QUERY);
  const touchMql = window.matchMedia(TOUCH_QUERY);

  const applyState = () => {
    const isMobile = mobileMql.matches;
    const isTouch = touchMql.matches;
    document.documentElement.classList.toggle('ap-mobile-reality', isMobile);
    document.documentElement.classList.toggle('ap-touch-reality', isTouch);
    document.documentElement.dataset.apViewport = isMobile ? 'mobile' : 'wide';
    document.documentElement.dataset.apPointer = isTouch ? 'touch' : 'fine';
  };

  applyState();
  mobileMql.addEventListener?.('change', applyState);
  touchMql.addEventListener?.('change', applyState);

  stabilizeNavigation();
  stabilizeAtlasOnMobile();
  stabilizeMobileTablesAndCode();
  publishMobileRealityAudit();

  document.dispatchEvent(new CustomEvent('ap:mobile-reality-ready'));
}

function stabilizeNavigation() {
  const nav = document.querySelector('.site-nav');
  const toggle = document.querySelector('.nav-toggle');
  if (!nav || !toggle) return;

  nav.querySelectorAll('a[href]').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.matchMedia(MOBILE_QUERY).matches) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!nav.classList.contains('is-open')) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  });
}

function stabilizeAtlasOnMobile() {
  const atlas = document.querySelector('.ap-atlas-surface, .ap-atlas-interface, [data-ap-atlas]');
  if (!atlas) return;

  atlas.classList.add('ap-mobile-reality-atlas');

  const map = atlas.querySelector('.ap-atlas-map, .ap-atlas-canvas, .ap-system-map');
  if (map) {
    map.setAttribute('tabindex', map.getAttribute('tabindex') || '0');
    map.setAttribute('aria-label', map.getAttribute('aria-label') || 'Atlas map. Use the controls above to focus the projection.');
  }

  const detailPanel = atlas.querySelector('.ap-atlas-detail-panel, .ap-atlas-detail, .ap-node-detail');
  if (detailPanel && !detailPanel.querySelector('[data-ap-mobile-detail-note]')) {
    const note = document.createElement('p');
    note.className = 'ap-muted ap-mobile-detail-note';
    note.dataset.apMobileDetailNote = 'true';
    note.textContent = 'On small screens, the Atlas presents orientation, controls, map, and details as a vertical reading path.';
    detailPanel.prepend(note);
  }
}

function stabilizeMobileTablesAndCode() {
  document.querySelectorAll('table').forEach((table) => {
    if (table.parentElement?.classList.contains('ap-scroll-surface')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'ap-scroll-surface';
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', 'Scrollable table');
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });

  document.querySelectorAll('pre').forEach((pre) => {
    pre.setAttribute('tabindex', pre.getAttribute('tabindex') || '0');
  });
}

function publishMobileRealityAudit() {
  const overflowNodes = [];
  const scan = () => {
    overflowNodes.length = 0;
    const width = document.documentElement.clientWidth;
    document.querySelectorAll('body *').forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      const rect = node.getBoundingClientRect();
      if (rect.width > width + 8 || rect.right > width + 8) {
        overflowNodes.push(node);
      }
    });
    window.APSystem = window.APSystem || {};
    window.APSystem.mobileReality = {
      viewport: document.documentElement.dataset.apViewport,
      pointer: document.documentElement.dataset.apPointer,
      overflowCount: overflowNodes.length,
      overflowNodes: overflowNodes.slice(0, 12)
    };
  };

  window.requestAnimationFrame(scan);
  window.addEventListener('resize', () => window.requestAnimationFrame(scan), { passive: true });
}
