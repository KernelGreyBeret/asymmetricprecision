/* AP Availability System
   Sprint 28 Principle: A missing node should still guide the learner.

   Availability is not a commerce feature. It is a dead-end elimination layer.
   If a book, framework, laboratory, or planned resource is not yet available,
   AP should explain its status and route the learner through useful adjacent material.
*/

const AVAILABILITY_URL = new URL('../data/ap-availability.json', import.meta.url);

let availabilityCache = null;

export function initializeAvailabilitySystem() {
  hydrateAvailability().catch((error) => {
    console.warn('[AP Availability] unavailable', error);
  });
}

export const initializeAPAvailability = initializeAvailabilitySystem;

async function hydrateAvailability() {
  const data = await loadAvailability();
  enhanceAvailabilityCards(data);
  enhanceCurrentPage(data);
  markUnavailableLinks(data);
  document.dispatchEvent(new CustomEvent('ap:availability-ready', { detail: { data } }));
}

async function loadAvailability() {
  if (availabilityCache) return availabilityCache;
  const response = await fetch(AVAILABILITY_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to load AP availability map.');
  availabilityCache = await response.json();
  return availabilityCache;
}

function enhanceCurrentPage(data) {
  const item = findCurrentItem(data);
  if (!item) return;
  document.body.dataset.apAvailability = item.status;
  document.documentElement.dataset.apAvailability = item.status;

  const target = document.querySelector('.ap-content-metadata-surface, .ap-content-hero, .page-hero, main');
  if (!target || document.querySelector('[data-ap-availability-surface="current"]')) return;

  const surface = buildAvailabilitySurface(item, data, 'current');
  if (target.matches('main')) {
    target.insertAdjacentElement('afterbegin', surface);
  } else {
    target.insertAdjacentElement('afterend', surface);
  }
}

function enhanceAvailabilityCards(data) {
  const items = new Map((data.items || []).map((item) => [item.id, item]));
  document.querySelectorAll('[data-book-id], [data-content-id], [data-ap-node-id]').forEach((card) => {
    const id = card.dataset.bookId || card.dataset.contentId || card.dataset.apNodeId;
    const item = items.get(id);
    if (!item || card.dataset.apAvailabilityEnhanced === 'true') return;
    card.dataset.apAvailabilityEnhanced = 'true';
    card.dataset.apAvailability = item.status;
    card.classList.add('ap-availability-card', `ap-availability-${item.status}`);

    const existingStatus = card.querySelector('.ap-book-status, .ap-status, [data-ap-status]');
    if (existingStatus) {
      existingStatus.textContent = statusLabel(item, data);
      existingStatus.classList.add('ap-availability-badge');
    }

    if (isUnavailable(item.status)) {
      const note = document.createElement('div');
      note.className = 'ap-availability-card-note';
      note.innerHTML = `
        <span>${escapeHTML(statusLabel(item, data))}</span>
        <p>${escapeHTML(item.currentAlternative || defaultStatus(item, data).summary)}</p>
      `;
      const action = card.querySelector('a.button, .button, .ap-action');
      if (action) action.insertAdjacentElement('beforebegin', note);
      else card.appendChild(note);
    }
  });
}

function markUnavailableLinks(data) {
  const byUrl = new Map();
  for (const item of data.items || []) {
    if (!item.url) continue;
    byUrl.set(normalizePath(item.url), item);
  }

  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const key = normalizePath(href.split('?')[0].split('#')[0]);
    const item = byUrl.get(key);
    if (!item || !isUnavailable(item.status)) return;
    link.dataset.apAvailability = item.status;
    link.title = `${item.title}: ${statusLabel(item, data)}`;
  });
}

function buildAvailabilitySurface(item, data, mode = 'current') {
  const status = defaultStatus(item, data);
  const surface = document.createElement('section');
  surface.className = `ap-availability-surface ap-availability-${item.status}`;
  surface.dataset.apAvailabilitySurface = mode;
  surface.setAttribute('aria-label', `${item.title} availability`);

  const isDeadEndRisk = isUnavailable(item.status);
  const label = isDeadEndRisk ? 'Availability / Path Forward' : 'Availability';
  const headline = isDeadEndRisk
    ? 'This node is still useful before it is finished.'
    : 'This node is active in the AP system.';

  surface.innerHTML = `
    <div class="ap-availability-status-column">
      <p class="section-label">${escapeHTML(label)}</p>
      <h2>${escapeHTML(headline)}</h2>
      <div class="ap-availability-meta">
        <span class="ap-availability-badge">${escapeHTML(status.label)}</span>
        <span>${escapeHTML(item.type || 'Resource')}</span>
      </div>
    </div>
    <div class="ap-availability-guidance">
      <p><strong>Why it matters:</strong> ${escapeHTML(item.whyItMatters || item.title)}</p>
      <p><strong>Current path:</strong> ${escapeHTML(item.currentAlternative || status.summary)}</p>
      <div class="ap-availability-actions">
        ${renderActions(item, data)}
      </div>
    </div>
  `;

  return surface;
}

function renderActions(item, data) {
  const actions = item.actions && item.actions.length ? item.actions : fallbackActions(item, data);
  return actions.map((action) => {
    const href = actionHref(action, data);
    const label = action.label || 'Continue';
    return `<a class="ap-availability-action" href="${escapeHTML(href)}">${escapeHTML(label)}</a>`;
  }).join('');
}

function fallbackActions(item, data) {
  return [
    { label: 'View in Atlas', type: 'atlas', focus: item.atlasFocus || item.id },
    { label: 'Continue through Journeys', type: 'link', url: 'journeys/index.html' },
    { label: 'Ask about this resource', type: 'email', subject: item.title }
  ];
}

function actionHref(action, data) {
  const paths = window.AP?.paths;
  if (action.type === 'atlas') {
    const focus = action.focus || action.node || action.id;
    return paths?.atlasHref ? paths.atlasHref({ focus }) : siteHref(`atlas/index.html?focus=${encodeURIComponent(focus || '')}`);
  }
  if (action.type === 'email') {
    const address = data.contactEmail || 'tommy@asymmetricprecision.com';
    const subject = encodeURIComponent(`AP availability: ${action.subject || 'Resource update'}`);
    const body = encodeURIComponent('I would like to know more about this AP resource.');
    return `mailto:${address}?subject=${subject}&body=${body}`;
  }
  return paths?.siteHref ? paths.siteHref(action.url || '') : siteHref(action.url || 'index.html');
}

function findCurrentItem(data) {
  const path = normalizePath(window.location.pathname);
  const title = normalizeTitle(document.querySelector('h1')?.textContent || document.title);
  return (data.items || []).find((item) => {
    const itemPath = normalizePath(item.url || '');
    const itemTitle = normalizeTitle(item.title || '');
    return (itemPath && path.endsWith(itemPath)) || (itemTitle && title.includes(itemTitle));
  });
}

function defaultStatus(item, data) {
  return data.defaults?.[item.status] || { label: item.status || 'Unknown', summary: 'AP should provide a path forward from this point.' };
}

function statusLabel(item, data) {
  return defaultStatus(item, data).label || item.status || 'Status Unknown';
}

function isUnavailable(status) {
  return ['planned', 'in-development', 'final-edits', 'draft', 'pending'].includes(String(status || '').toLowerCase());
}

function normalizePath(value) {
  let path = String(value || '').trim();
  if (!path) return '';
  try {
    path = new URL(path, window.location.origin).pathname;
  } catch {
    /* Keep relative path. */
  }
  return path
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/+/, '')
    .replace(/^\.\.\//, '')
    .replace(/^\.\//, '')
    .replace(/^asymmetricprecision-preview\//, '')
    .replace(/\/index\.html$/, '/index.html')
    .replace(/\/+/g, '/');
}

function normalizeTitle(value) {
  return String(value || '').toLowerCase().replace(/\s+\|\s+asymmetric precision/i, '').trim();
}

function siteHref(path) {
  const clean = String(path || '').replace(/^\/+/, '');
  const base = window.AP?.paths?.basePath || deriveFallbackBase();
  return `${base}${clean}`.replace(/\/+/g, '/');
}

function deriveFallbackBase() {
  const marker = '/asymmetricprecision-preview/';
  if (window.location.pathname.startsWith(marker)) return marker;
  return '/';
}

function escapeHTML(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
