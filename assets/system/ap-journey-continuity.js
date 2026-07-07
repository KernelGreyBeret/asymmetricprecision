/* AP Sprint 24 — Journey Continuity
   Principle: A path should continue from wherever understanding begins.

   This module keeps learning-path intent attached to the learner as they move
   through AP. It is intentionally local-first, optional, and defensive: if the
   journey data is missing, the site continues to work as normal.
*/

const AP_JOURNEY_STORAGE_KEY = 'ap.activeJourney.v1';

function deriveAPBasePath() {
  const systemScript = Array.from(document.scripts).find((script) =>
    script.src && script.src.includes('/assets/system/ap-system.js')
  );

  if (systemScript) {
    const url = new URL(systemScript.src, window.location.href);
    return url.pathname.replace(/assets\/system\/ap-system\.js$/, '');
  }

  const marker = '/asymmetricprecision-preview/';
  if (window.location.pathname.includes(marker)) return marker;
  return '/';
}

function normalizePath(pathOrUrl) {
  if (!pathOrUrl) return '';

  let url;
  try {
    url = new URL(pathOrUrl, window.location.href);
  } catch (_) {
    return pathOrUrl.replace(/^\.\.\//, '').replace(/^\//, '').replace(/#.*$/, '').replace(/\?.*$/, '');
  }

  const base = deriveAPBasePath();
  let pathname = url.pathname;
  if (base !== '/' && pathname.startsWith(base)) pathname = pathname.slice(base.length);
  pathname = pathname.replace(/^\//, '');
  if (!pathname || pathname.endsWith('/')) pathname += 'index.html';
  pathname = pathname.replace(/\/index\.html$/, '/index.html');
  return pathname.replace(/^\.\.\//, '').replace(/^\.\//, '');
}

function resolveInternalUrl(path, params = {}) {
  const base = deriveAPBasePath();
  const clean = String(path || 'index.html')
    .replace(/^\.\.\//, '')
    .replace(/^\.\//, '')
    .replace(/^\//, '');
  const url = new URL(base + clean, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });
  return url.toString();
}

async function loadJourneys() {
  const base = deriveAPBasePath();
  const response = await fetch(`${base}assets/data/ap-journeys.json`, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Unable to load journeys: ${response.status}`);
  const data = await response.json();
  return data.journeys || [];
}

function getStoredJourney() {
  try {
    return JSON.parse(localStorage.getItem(AP_JOURNEY_STORAGE_KEY) || 'null');
  } catch (_) {
    return null;
  }
}

function storeJourney(state) {
  try {
    localStorage.setItem(AP_JOURNEY_STORAGE_KEY, JSON.stringify({
      ...state,
      updatedAt: new Date().toISOString()
    }));
  } catch (_) {
    // Local storage is optional. AP still works without it.
  }
}

function clearJourney() {
  try {
    localStorage.removeItem(AP_JOURNEY_STORAGE_KEY);
  } catch (_) {}
}

function findJourney(journeys, id) {
  return journeys.find((journey) => journey.id === id || journey.id.replace(/^journey-/, '') === id);
}

function findStepIndex(journey, currentPath) {
  if (!journey || !Array.isArray(journey.steps)) return -1;
  return journey.steps.findIndex((step) => normalizePath(step.url) === currentPath);
}

function getCurrentJourneyState(journeys) {
  const params = new URLSearchParams(window.location.search);
  const queryJourney = params.get('journey') || params.get('ap_journey');
  const currentPath = normalizePath(window.location.href);

  if (queryJourney) {
    const journey = findJourney(journeys, queryJourney);
    if (journey) {
      const explicitStep = Number.parseInt(params.get('step') || '', 10);
      const matchedStep = findStepIndex(journey, currentPath);
      const stepIndex = Number.isFinite(explicitStep) ? Math.max(explicitStep - 1, 0) : Math.max(matchedStep, 0);
      const state = { journeyId: journey.id, stepIndex, source: 'url' };
      storeJourney(state);
      return { journey, stepIndex, source: 'url' };
    }
  }

  const stored = getStoredJourney();
  if (stored?.journeyId) {
    const journey = findJourney(journeys, stored.journeyId);
    if (journey) {
      const matchedStep = findStepIndex(journey, currentPath);
      const stepIndex = matchedStep >= 0 ? matchedStep : Number(stored.stepIndex || 0);
      return { journey, stepIndex, source: 'storage' };
    }
  }

  return null;
}

function createJourneyStatus(context) {
  const { journey, stepIndex } = context;
  const current = journey.steps[stepIndex] || journey.steps[0];
  const next = journey.steps[stepIndex + 1];
  const total = journey.steps.length;

  const surface = document.createElement('aside');
  surface.className = 'ap-journey-continuity';
  surface.setAttribute('aria-label', 'Active AP learning journey');
  surface.innerHTML = `
    <div class="ap-journey-continuity__signal">Active journey</div>
    <div class="ap-journey-continuity__body">
      <p class="ap-journey-continuity__title">${escapeHTML(journey.title)}</p>
      <p class="ap-journey-continuity__step">Step ${stepIndex + 1} of ${total}: ${escapeHTML(current?.title || 'Current stop')}</p>
      ${next ? `<a class="ap-action ap-journey-continuity__next" href="${resolveInternalUrl(normalizePath(next.url), { journey: journey.id, step: stepIndex + 2 })}">Continue: ${escapeHTML(next.title)}</a>` : `<span class="ap-journey-continuity__complete">This journey is complete. Record what became clearer.</span>`}
    </div>
    <button class="ap-journey-continuity__clear" type="button" data-ap-clear-journey>Clear path</button>
  `;
  return surface;
}

function createBottomContinuation(context) {
  const { journey, stepIndex } = context;
  const next = journey.steps[stepIndex + 1];
  const atlasUrl = resolveInternalUrl('atlas/index.html', {
    journey: journey.id,
    projection: 'journey',
    density: 'balanced',
    labels: 'active'
  });

  const section = document.createElement('section');
  section.className = 'ap-path-continuation ap-system-surface';
  section.innerHTML = `
    <p class="section-label">Continue the path</p>
    <h2>${escapeHTML(journey.title)}</h2>
    <p>${escapeHTML(journey.question || journey.summary || 'Continue this learning path with the next intentional step.')}</p>
    <div class="ap-path-continuation__actions">
      ${next ? `<a class="button primary" href="${resolveInternalUrl(normalizePath(next.url), { journey: journey.id, step: stepIndex + 2 })}">Next step: ${escapeHTML(next.title)}</a>` : `<a class="button primary" href="${resolveInternalUrl('learning/index.html', { journey: journey.id })}">Record what changed</a>`}
      <a class="button secondary" href="${atlasUrl}">View this path in the Atlas</a>
    </div>
  `;
  return section;
}

function injectJourneySurfaces(context) {
  if (!context?.journey) return;
  const main = document.querySelector('main');
  if (!main) return;

  if (!document.querySelector('.ap-journey-continuity')) {
    const status = createJourneyStatus(context);
    const hero = main.querySelector('.page-hero, .hero, .ap-entry');
    if (hero?.nextElementSibling) main.insertBefore(status, hero.nextElementSibling);
    else main.prepend(status);
  }

  const oldGeneric = Array.from(document.querySelectorAll('.ap-continuation, .ap-connection-surface, .connection-surface'))
    .find((el) => /where this connects|do not leave the idea isolated/i.test(el.textContent || ''));
  if (oldGeneric) {
    oldGeneric.replaceWith(createBottomContinuation(context));
  } else if (!document.querySelector('.ap-path-continuation')) {
    main.appendChild(createBottomContinuation(context));
  }

  document.querySelector('[data-ap-clear-journey]')?.addEventListener('click', () => {
    clearJourney();
    window.location.href = window.location.pathname;
  });
}

function propagateJourneyContext(context) {
  if (!context?.journey) return;
  const { journey } = context;

  const stepMap = new Map(
    journey.steps.map((step, index) => [normalizePath(step.url), index])
  );

  document.querySelectorAll('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http') && !href.includes(window.location.host)) return;

    let url;
    try {
      url = new URL(anchor.href, window.location.href);
    } catch (_) {
      return;
    }

    if (url.origin !== window.location.origin) return;

    const normalized = normalizePath(url.href);
    const stepIndex = stepMap.get(normalized);
    const isAtlas = normalized === 'atlas/index.html';
    const isLearning = normalized === 'learning/index.html';

    if (stepIndex !== undefined || isAtlas || isLearning) {
      url.searchParams.set('journey', journey.id);
      if (stepIndex !== undefined) url.searchParams.set('step', String(stepIndex + 1));
      if (isAtlas && !url.searchParams.has('projection')) url.searchParams.set('projection', 'journey');
      anchor.href = url.toString();
    }
  });
}

function activateJourneyCards(journeys) {
  const normalizedEntries = new Map(journeys.map((journey) => [normalizePath(journey.entry || journey.steps?.[0]?.url), journey]));

  document.querySelectorAll('a[href]').forEach((anchor) => {
    const normalized = normalizePath(anchor.href);
    const journey = normalizedEntries.get(normalized);
    if (!journey) return;

    const url = new URL(anchor.href, window.location.href);
    url.searchParams.set('journey', journey.id);
    url.searchParams.set('step', '1');
    anchor.href = url.toString();
    anchor.setAttribute('data-ap-journey-start', journey.id);
  });
}

function escapeHTML(value) {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

export async function initializeJourneyContinuity() {
  window.APSystem = window.APSystem || {};
  window.APSystem.initialized = window.APSystem.initialized || new Set();
  if (window.APSystem.initialized.has('initializeJourneyContinuity')) return;
  window.APSystem.initialized.add('initializeJourneyContinuity');

  let journeys = [];
  try {
    journeys = await loadJourneys();
  } catch (error) {
    console.warn('[AP Journey Continuity] Journey data unavailable.', error);
    return;
  }

  activateJourneyCards(journeys);
  const context = getCurrentJourneyState(journeys);
  if (!context) return;

  injectJourneySurfaces(context);
  propagateJourneyContext(context);

  window.APJourneyContinuity = {
    activeJourney: context.journey.id,
    stepIndex: context.stepIndex,
    clear: clearJourney
  };
}

initializeJourneyContinuity();
