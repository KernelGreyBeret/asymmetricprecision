/* AP Page Intelligence
   Sprint 26 — Page Intelligence Pass
   Principle: Every page should know what it is, where it sits, and what becomes clearer next.

   This layer turns AP pages from static destinations into self-aware surfaces.
   It reads the Atlas, content graph, journeys, and resource datasets, then adds
   compact context: surface type, domains, related principles/resources, active
   journeys, and focused Atlas actions.
*/

import { normalizeAtlasEdge, describeRelationship } from './ap-relationship-grammar.js';

const DATA = {
  atlas: new URL('../data/ap-atlas.json', import.meta.url),
  content: new URL('../data/ap-content.json', import.meta.url),
  essays: new URL('../data/ap-essays.json', import.meta.url),
  books: new URL('../data/ap-books.json', import.meta.url),
  frameworks: new URL('../data/ap-frameworks.json', import.meta.url),
  fieldNotes: new URL('../data/ap-field-notes.json', import.meta.url),
  laboratories: new URL('../data/ap-laboratories.json', import.meta.url),
  journeys: new URL('../data/ap-journeys.json', import.meta.url)
};

const DETAIL_TYPES = new Set(['essay', 'book', 'framework', 'field-note', 'laboratory', 'principle', 'concept']);
const UTILITY_PATHS = new Set(['about/index.html', 'contact/index.html']);

export function initializePageIntelligence() {
  bootPageIntelligence().catch((error) => console.warn('[AP Page Intelligence] Initialization failed', error));
}

export function initializeAPPageIntelligence() {
  initializePageIntelligence();
}

async function bootPageIntelligence() {
  if (document.documentElement.dataset.apPageIntelligenceReady === 'true') return;
  document.documentElement.dataset.apPageIntelligenceReady = 'true';

  const knowledge = await buildKnowledgeBase();
  const current = identifyCurrentSurface(knowledge);
  if (!current) return;

  window.APSystem = window.APSystem || {};
  window.APSystem.currentSurface = current;

  rewriteContextualAtlasLinks(current);
  renderSystemContextStrip(current, knowledge);
  renderPageCompanions(current, knowledge);
  renderBookAvailability(current, knowledge);
  markPageWithIntelligence(current);
}

async function buildKnowledgeBase() {
  const [atlas, content, essays, books, frameworks, fieldNotes, laboratories, journeys] = await Promise.all([
    fetchJson(DATA.atlas, { nodes: [], edges: [] }),
    fetchJson(DATA.content, { items: [] }),
    fetchJson(DATA.essays, { items: [] }),
    fetchJson(DATA.books, { books: [] }),
    fetchJson(DATA.frameworks, { frameworks: [] }),
    fetchJson(DATA.fieldNotes, { fieldNotes: [] }),
    fetchJson(DATA.laboratories, { laboratories: [] }),
    fetchJson(DATA.journeys, { journeys: [] })
  ]);

  const nodes = (atlas.nodes || []).map((node) => normalizeNode(node));
  const edges = (atlas.edges || []).map(normalizeAtlasEdge).filter(Boolean);
  const atlasById = new Map(nodes.map((node) => [node.id, node]));

  const catalog = [];
  catalog.push(...(content.items || []).map((item) => normalizeCatalogItem(item, 'content')));
  catalog.push(...(essays.items || []).map((item) => normalizeCatalogItem(item, 'essay')));
  catalog.push(...(books.books || []).map((item) => normalizeCatalogItem(item, 'book')));
  catalog.push(...(frameworks.frameworks || []).map((item) => normalizeCatalogItem(item, 'framework')));
  catalog.push(...(fieldNotes.fieldNotes || []).map((item) => normalizeCatalogItem(item, 'field-note')));
  catalog.push(...(laboratories.laboratories || []).map((item) => normalizeCatalogItem(item, 'laboratory')));

  const catalogById = new Map();
  for (const item of catalog) {
    if (!item.id || catalogById.has(item.id)) continue;
    catalogById.set(item.id, item);
  }

  const resources = mergeNodesAndCatalog(nodes, catalogById);
  const byId = new Map(resources.map((item) => [item.id, item]));
  const byPath = new Map(resources.filter((item) => item.path).map((item) => [normalizePath(item.path), item]));
  const journeysList = journeys.journeys || [];

  return { nodes, edges, atlasById, catalog, catalogById, resources, byId, byPath, journeys: journeysList };
}

function identifyCurrentSurface(knowledge) {
  const currentPath = normalizePath(currentRelativePath());
  const pageKind = pageKindFromPath(currentPath);

  let item = knowledge.byPath.get(currentPath);
  if (!item && currentPath.endsWith('/index.html')) item = knowledge.byPath.get(currentPath.replace('/index.html', '/'));

  if (!item) {
    item = synthesizeSurface(currentPath, pageKind);
  }

  const atlasNode = knowledge.atlasById.get(item.id) || findNodeByPath(knowledge.nodes, currentPath) || null;
  const activeJourney = findActiveJourney(knowledge.journeys, currentPath);
  const journeyMemberships = findJourneyMemberships(knowledge.journeys, currentPath, item.id);
  const connections = collectConnections(item, atlasNode, knowledge);
  const domains = normalizeDomains(item.domains || item.domain || atlasNode?.domains || atlasNode?.domain || []);

  return {
    ...item,
    id: item.id || atlasNode?.id || pageKind.id,
    title: item.title || item.label || atlasNode?.label || pageKind.title,
    label: item.label || item.title || atlasNode?.label || pageKind.title,
    summary: item.summary || atlasNode?.summary || pageKind.summary,
    type: normalizeType(item.type || atlasNode?.type || pageKind.type),
    path: item.path || currentPath,
    domains,
    atlasNode,
    activeJourney,
    journeyMemberships,
    connections,
    isUtility: UTILITY_PATHS.has(currentPath)
  };
}

function renderSystemContextStrip(surface, knowledge) {
  if (document.querySelector('[data-ap-page-context-strip]')) return;
  const main = document.querySelector('main');
  const anchor = document.querySelector('main .page-hero, main .hero, main .ap-content-hero, main article h1') || main?.firstElementChild;
  if (!main || !anchor) return;

  const journey = surface.activeJourney || surface.journeyMemberships[0] || null;
  const next = journey ? nextJourneyStep(journey, surface.path) : null;

  const strip = document.createElement('section');
  strip.className = 'ap-page-context-strip';
  strip.dataset.apPageContextStrip = surface.id;
  strip.innerHTML = `
    <div class="ap-context-cell ap-context-cell-primary">
      <span class="ap-context-label">This surface</span>
      <strong>${escapeHtml(typeLabel(surface.type))}</strong>
      <small>${escapeHtml(surface.title)}</small>
    </div>
    ${surface.domains.length ? `<div class="ap-context-cell"><span class="ap-context-label">Domains</span><div class="ap-context-chips">${surface.domains.slice(0, 4).map(chip).join('')}</div></div>` : ''}
    ${journey ? `<div class="ap-context-cell"><span class="ap-context-label">Journey context</span><strong>${escapeHtml(journey.title)}</strong>${next ? `<small>Next: ${escapeHtml(next.title)}</small>` : '<small>Path complete or outside sequenced steps.</small>'}</div>` : ''}
    <div class="ap-context-cell ap-context-actions">
      <span class="ap-context-label">Atlas</span>
      <a class="ap-action ap-action-secondary" href="${escapeAttr(atlasHref(surface, journey))}">Open focused view</a>
    </div>
  `;

  insertAfter(anchor, strip);
}

function renderPageCompanions(surface, knowledge) {
  if (document.querySelector('[data-ap-page-companions]')) return;
  if (surface.isUtility) return;
  if (!DETAIL_TYPES.has(surface.type) && !isCoreSystemPage(surface.path)) return;

  const main = document.querySelector('main');
  if (!main) return;

  const companions = buildCompanionGroups(surface, knowledge);
  const hasCompanions = companions.some((group) => group.items.length);
  const journey = surface.activeJourney || surface.journeyMemberships[0] || null;
  const next = journey ? nextJourneyStep(journey, surface.path) : null;

  if (!hasCompanions && !journey) return;

  const section = document.createElement('section');
  section.className = 'ap-page-companions ap-system-surface';
  section.dataset.apPageCompanions = surface.id;
  section.innerHTML = `
    <div class="ap-page-companions-intro">
      <p class="section-label">System Intelligence</p>
      <h2>What this surface touches</h2>
      <p>${escapeHtml(companionSummary(surface))}</p>
    </div>
    <div class="ap-companion-grid">
      ${companions.filter((group) => group.items.length).map(renderCompanionGroup).join('')}
      ${journey ? renderJourneyCompanion(journey, next, surface) : ''}
    </div>
  `;

  const preferredAnchor = document.querySelector('.ap-learning-checkpoint, [data-ap-learning-checkpoint], .ap-path-continuation, footer');
  if (preferredAnchor && preferredAnchor.parentNode === main) main.insertBefore(section, preferredAnchor);
  else main.appendChild(section);
}

function renderBookAvailability(surface, knowledge) {
  if (surface.type !== 'book') return;
  if (document.querySelector('[data-ap-book-availability]')) return;
  const status = String(surface.status || '').toLowerCase();
  if (status.includes('published') || status.includes('available') || status.includes('released')) return;

  const anchor = document.querySelector('[data-ap-page-context-strip], .ap-content-hero, .page-hero');
  if (!anchor) return;

  const section = document.createElement('section');
  section.className = 'ap-book-availability ap-book-availability-intelligent';
  section.dataset.apBookAvailability = surface.id;
  const alternatives = surface.connections.filter((item) => item.type !== 'book').slice(0, 3);
  section.innerHTML = `
    <div>
      <p class="section-label">Curriculum Status</p>
      <h2>${escapeHtml(statusTitle(surface.status))}</h2>
      <p>${escapeHtml(surface.title)} is part of the AP curriculum, but this path is not a dead end. Continue through connected essays, frameworks, principles, and the focused Atlas view while the book matures.</p>
    </div>
    <div class="ap-book-availability-actions">
      <a class="ap-action primary" href="${escapeAttr(siteHref('contact/index.html', { subject: surface.id }))}">Ask for updates</a>
      <a class="ap-action ap-action-secondary" href="${escapeAttr(atlasHref(surface))}">View curriculum context</a>
      ${alternatives[0] ? `<a class="ap-action ap-action-secondary" href="${escapeAttr(resolveHref(alternatives[0]))}">Continue with ${escapeHtml(alternatives[0].title || alternatives[0].label)}</a>` : ''}
    </div>
  `;
  insertAfter(anchor, section);
}

function buildCompanionGroups(surface, knowledge) {
  const connections = dedupeById(surface.connections);
  return [
    { title: 'Principles', items: connections.filter((item) => item.type === 'principle').slice(0, 4) },
    { title: 'Operating models', items: connections.filter((item) => item.type === 'framework' || item.type === 'operating-model').slice(0, 3) },
    { title: 'Related lenses', items: connections.filter((item) => item.type === 'essay' || item.type === 'field-note').slice(0, 4) },
    { title: 'Proof surfaces', items: connections.filter((item) => item.type === 'laboratory' || item.type === 'book').slice(0, 3) }
  ];
}

function renderCompanionGroup(group) {
  return `
    <article class="ap-companion-group">
      <h3>${escapeHtml(group.title)}</h3>
      <div class="ap-companion-list">
        ${group.items.map((item) => `
          <a class="ap-companion-link ap-companion-${escapeAttr(item.type)}" href="${escapeAttr(resolveHref(item))}">
            <span>${escapeHtml(typeLabel(item.type))}</span>
            <strong>${escapeHtml(item.title || item.label || item.id)}</strong>
            ${item.summary ? `<small>${escapeHtml(item.summary)}</small>` : ''}
          </a>
        `).join('')}
      </div>
    </article>
  `;
}

function renderJourneyCompanion(journey, next, surface) {
  return `
    <article class="ap-companion-group ap-companion-journey">
      <h3>Journey</h3>
      <p>${escapeHtml(journey.question || journey.summary || journey.title)}</p>
      <div class="ap-companion-list">
        ${next ? `<a class="ap-companion-link" href="${escapeAttr(siteHref(cleanPath(next.url), { journey: journey.id, step: next.index + 1 }))}"><span>Next step</span><strong>${escapeHtml(next.title)}</strong><small>${escapeHtml(next.label || 'Continue the path')}</small></a>` : `<a class="ap-companion-link" href="${escapeAttr(siteHref('learning/index.html', { journey: journey.id }))}"><span>Reflect</span><strong>Record what became clearer</strong><small>This path is ready for a learning checkpoint.</small></a>`}
        <a class="ap-companion-link" href="${escapeAttr(siteHref('atlas/index.html', { journey: journey.id, projection: 'journey', focus: surface.id }))}"><span>Atlas</span><strong>View this path as a system</strong><small>See the relationship between this stop and the journey.</small></a>
      </div>
    </article>
  `;
}

function collectConnections(item, atlasNode, knowledge) {
  const refs = new Set([...(item.connections || []), ...(atlasNode?.connections || [])]);
  const currentIds = new Set([item.id, atlasNode?.id].filter(Boolean));
  const connections = [];

  for (const ref of refs) {
    const resolved = resolveReference(ref, knowledge);
    if (resolved) connections.push(resolved);
  }

  for (const edge of knowledge.edges) {
    for (const id of currentIds) {
      const description = describeRelationship(edge, id, knowledge.byId);
      if (!description) continue;
      const target = normalizeResource(description.target);
      if (target?.id && !currentIds.has(target.id)) {
        connections.push({
          ...target,
          relationshipPhrase: description.phrase,
          relationshipSentence: description.sentence,
          relationshipGroup: description.group
        });
      }
    }
  }

  for (const journey of findJourneyMemberships(knowledge.journeys, item.path, item.id)) {
    connections.push(normalizeCatalogItem({
      id: journey.id,
      title: journey.title,
      type: 'journey',
      domain: (journey.domains || [])[0],
      summary: journey.summary,
      url: 'journeys/index.html'
    }, 'journey'));
  }

  return dedupeById(connections).filter((connection) => connection.id !== item.id);
}

function resolveReference(ref, knowledge) {
  if (!ref) return null;
  const key = String(ref).trim();
  if (knowledge.byId.has(key)) return knowledge.byId.get(key);
  if (knowledge.catalogById.has(key)) return knowledge.catalogById.get(key);

  const normalized = normalizeTextKey(key);
  return knowledge.resources.find((item) =>
    normalizeTextKey(item.id) === normalized ||
    normalizeTextKey(item.title) === normalized ||
    normalizeTextKey(item.label) === normalized
  ) || null;
}

function findActiveJourney(journeys, currentPath) {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('journey') || params.get('ap_journey');
  const stored = readStoredJourney();
  const id = query || stored?.journeyId;
  if (!id) return null;
  const journey = journeys.find((item) => item.id === id || item.id.replace(/^journey-/, '') === id);
  if (!journey) return null;
  return { ...journey, active: true };
}

function findJourneyMemberships(journeys, currentPath, currentId) {
  return journeys.filter((journey) => {
    const steps = journey.steps || [];
    const byPath = steps.some((step) => normalizePath(cleanPath(step.url)) === normalizePath(currentPath));
    const byConnection = (journey.connections || []).some((connection) => connection === currentId);
    return byPath || byConnection;
  });
}

function nextJourneyStep(journey, currentPath) {
  if (!journey?.steps?.length) return null;
  const index = journey.steps.findIndex((step) => normalizePath(cleanPath(step.url)) === normalizePath(currentPath));
  const nextIndex = index >= 0 ? index + 1 : 0;
  const next = journey.steps[nextIndex];
  return next ? { ...next, index: nextIndex } : null;
}

function rewriteContextualAtlasLinks(surface) {
  document.querySelectorAll('a[href*="atlas/index.html"], a[href$="/atlas/"], a[href$="/atlas/index.html"]').forEach((link) => {
    let url;
    try { url = new URL(link.getAttribute('href'), window.location.href); } catch { return; }
    if (!url.searchParams.has('focus')) url.searchParams.set('focus', surface.id);
    if (surface.activeJourney && !url.searchParams.has('journey')) url.searchParams.set('journey', surface.activeJourney.id);
    link.setAttribute('href', normalizeInternalHref(url.pathname + url.search + url.hash));
  });
}

function markPageWithIntelligence(surface) {
  document.body.dataset.apSurfaceId = surface.id;
  document.body.dataset.apSurfaceType = surface.type;
  document.body.classList.add('ap-page-intelligence-ready');
}

function synthesizeSurface(currentPath, pageKind) {
  return {
    id: pageKind.id,
    title: pageKind.title,
    type: pageKind.type,
    domain: pageKind.domain,
    domains: pageKind.domain ? [pageKind.domain] : [],
    summary: pageKind.summary,
    path: currentPath,
    connections: pageKind.connections || []
  };
}

function pageKindFromPath(path) {
  if (path === 'index.html') return { id: 'ap-home', title: 'Asymmetric Precision', type: 'core', domain: 'Applied Systems Thinking', summary: 'The front door into the AP system.' };
  if (path.startsWith('essays/')) return { id: 'essay-layer', title: 'Essays', type: 'essay', domain: 'Thinking', summary: 'The essay layer frames ideas as lenses.' };
  if (path.startsWith('books/')) return { id: 'book-layer', title: 'Books', type: 'book', domain: 'Learning', summary: 'The book layer deepens AP ideas into curriculum paths.' };
  if (path.startsWith('frameworks/')) return { id: 'framework-layer', title: 'Frameworks', type: 'framework', domain: 'Application', summary: 'The framework layer turns concepts into operating models.' };
  if (path.startsWith('field-notes/')) return { id: 'field-note-layer', title: 'Field Notes', type: 'field-note', domain: 'Observation', summary: 'The field note layer captures signals from real systems.' };
  if (path.startsWith('laboratories/')) return { id: 'laboratory-layer', title: 'Laboratories', type: 'laboratory', domain: 'Evidence', summary: 'The laboratory layer proves ideas through implementation.' };
  if (path.startsWith('atlas/')) return { id: 'atlas', title: 'Atlas', type: 'atlas', domain: 'Cartography', summary: 'The Atlas maps relationships across AP.' };
  if (path.startsWith('journeys/')) return { id: 'journeys', title: 'Journeys', type: 'journey', domain: 'Learning', summary: 'Journeys guide exploration through intentional paths.' };
  if (path.startsWith('learning/')) return { id: 'learning', title: 'Learning', type: 'learning', domain: 'Reflection', summary: 'The learning layer measures clarity rather than engagement.' };
  if (path.startsWith('philosophy/')) return { id: 'philosophy', title: 'Philosophy', type: 'principle', domain: 'Applied Systems Thinking', summary: 'The philosophy page explains why AP exists.' };
  if (path.startsWith('start-here/')) return { id: 'start-here', title: 'Start Here', type: 'gateway', domain: 'Orientation', summary: 'The guided entrance into AP.' };
  if (path.startsWith('about/')) return { id: 'about', title: 'About', type: 'identity', domain: 'Orientation', summary: 'The context behind AP.' };
  if (path.startsWith('contact/')) return { id: 'contact', title: 'Contact', type: 'conversation', domain: 'Connection', summary: 'The conversation surface for AP.' };
  return { id: slugify(path), title: document.title.replace(/\s*\|\s*Asymmetric Precision/i, '') || 'AP Surface', type: 'surface', domain: 'AP', summary: 'An AP surface.' };
}

function mergeNodesAndCatalog(nodes, catalogById) {
  const merged = new Map();
  for (const node of nodes) merged.set(node.id, node);
  for (const [id, item] of catalogById) {
    const existing = merged.get(id) || {};
    merged.set(id, { ...existing, ...item, label: item.label || item.title || existing.label, title: item.title || existing.title || existing.label });
  }
  return Array.from(merged.values());
}

function normalizeNode(node) {
  return normalizeResource({
    ...node,
    title: node.title || node.label,
    path: cleanPath(node.url),
    domains: normalizeDomains(node.domains || node.domain || [])
  });
}

function normalizeCatalogItem(item, fallbackType) {
  return normalizeResource({
    ...item,
    label: item.label || item.title,
    title: item.title || item.label,
    type: normalizeType(item.type || fallbackType),
    domains: normalizeDomains(item.domains || item.domain || item.path || []),
    path: cleanPath(item.url || item.href || item.entry),
    connections: Array.isArray(item.connections) ? item.connections : []
  });
}

function normalizeResource(item) {
  if (!item) return null;
  return {
    ...item,
    id: item.id,
    title: item.title || item.label || item.id,
    label: item.label || item.title || item.id,
    type: normalizeType(item.type),
    domains: normalizeDomains(item.domains || item.domain || []),
    path: cleanPath(item.path || item.url || item.href || item.entry),
    summary: item.summary || item.thesis || item.model || item.readerOutcome || ''
  };
}

function typeLabel(type) {
  const labels = {
    'essay': 'Essay Lens',
    'book': 'Curriculum Path',
    'framework': 'Operating Model',
    'operating-model': 'Operating Model',
    'field-note': 'Observation',
    'laboratory': 'Proof Surface',
    'principle': 'Principle',
    'concept': 'Concept',
    'journey': 'Learning Journey',
    'atlas': 'System Map',
    'learning': 'Reflection Surface',
    'gateway': 'Gateway',
    'core': 'Core Surface',
    'identity': 'Identity Surface',
    'conversation': 'Conversation Surface'
  };
  return labels[type] || titleCase(type || 'surface');
}

function companionSummary(surface) {
  if (surface.type === 'essay') return 'This lens touches principles, operating models, and related observations that help the idea become usable.';
  if (surface.type === 'book') return 'This curriculum path connects deeper study to the principles and resources that prepare the reader.';
  if (surface.type === 'framework') return 'This operating model connects to evidence, principles, and applications that make it usable under pressure.';
  if (surface.type === 'laboratory') return 'This proof surface connects implementation back to the AP principles it tests.';
  if (surface.type === 'field-note') return 'This observation connects field signal back to the larger AP system.';
  return 'This surface belongs to a larger system of principles, resources, journeys, and relationships.';
}

function isCoreSystemPage(path) {
  return ['philosophy/index.html', 'start-here/index.html', 'learning/index.html', 'journeys/index.html'].includes(path);
}

function statusTitle(status) {
  const value = String(status || 'In development').trim();
  if (/final|edit/i.test(value)) return 'Final edits in progress.';
  if (/draft/i.test(value)) return 'Draft in progress.';
  if (/planned|future/i.test(value)) return 'Planned curriculum path.';
  if (/development|progress/i.test(value)) return 'In development.';
  return `Status: ${value}`;
}

function atlasHref(surface, journey = null) {
  const params = { focus: surface.id, projection: journey ? 'journey' : 'focus', density: 'balanced', labels: 'active' };
  if (journey) params.journey = journey.id;
  return siteHref('atlas/index.html', params);
}

function resolveHref(item) {
  if (!item) return siteHref('atlas/index.html');
  if (item.path) return siteHref(item.path);
  return siteHref('atlas/index.html', { focus: item.id });
}

function siteHref(path, params = {}) {
  const clean = cleanPath(path || 'index.html');
  if (window.AP?.paths?.siteHref) return window.AP.paths.siteHref(clean, params);
  const url = new URL(clean, window.location.href);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });
  return normalizeInternalHref(url.pathname + url.search + url.hash);
}

function normalizeInternalHref(href) {
  if (window.AP?.paths?.normalizeInternalHref) return window.AP.paths.normalizeInternalHref(href);
  return href;
}

function currentRelativePath() {
  const base = window.AP?.paths?.basePath || document.documentElement.dataset.apBasePath || deriveBasePathFromScript();
  let path = window.location.pathname;
  if (base !== '/' && path.startsWith(base)) path = path.slice(base.length);
  path = path.replace(/^\/+/, '');
  if (!path || path.endsWith('/')) path += 'index.html';
  return path;
}

function cleanPath(raw) {
  if (!raw) return '';
  let value = String(raw).trim();
  if (!value || value.startsWith('#')) return value;
  try {
    const url = new URL(value, window.location.href);
    if (url.origin === window.location.origin) {
      const base = window.AP?.paths?.basePath || document.documentElement.dataset.apBasePath || deriveBasePathFromScript();
      let path = url.pathname;
      if (base !== '/' && path.startsWith(base)) path = path.slice(base.length);
      value = path + url.search + url.hash;
    }
  } catch {}
  value = value.replace(/^\.\.\//, '').replace(/^\.\//, '').replace(/^\/+/, '');
  while (value.startsWith('../')) value = value.slice(3);
  value = value.replace(/#.*$/, '').replace(/\?.*$/, '');
  if (!value || value.endsWith('/')) value += 'index.html';
  return normalizePath(value);
}

function normalizePath(path) {
  return String(path || '')
    .replace(/^\.\.\//, '')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .replace(/\/index\.html$/, '/index.html')
    .replace(/\/+/g, '/');
}

function normalizeType(type) {
  const value = String(type || 'surface').toLowerCase().trim();
  if (value.includes('essay')) return 'essay';
  if (value.includes('book')) return 'book';
  if (value.includes('framework') || value.includes('operating')) return 'framework';
  if (value.includes('field')) return 'field-note';
  if (value.includes('lab')) return 'laboratory';
  if (value.includes('principle')) return 'principle';
  if (value.includes('concept')) return 'concept';
  return value.replace(/\s+/g, '-');
}

function normalizeDomains(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  return [String(value)];
}

function dedupeById(items) {
  const seen = new Set();
  const result = [];
  for (const item of items || []) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

function findNodeByPath(nodes, currentPath) {
  return nodes.find((node) => normalizePath(node.path) === normalizePath(currentPath)) || null;
}

function readStoredJourney() {
  try { return JSON.parse(localStorage.getItem('ap.activeJourney.v1') || 'null'); }
  catch { return null; }
}

function deriveBasePathFromScript() {
  const script = Array.from(document.scripts).find((item) => item.src && item.src.includes('/assets/system/ap-system.js'));
  if (!script) return '/';
  const url = new URL(script.src, window.location.href);
  return url.pathname.replace(/assets\/system\/ap-system\.js$/, '') || '/';
}

async function fetchJson(url, fallback) {
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) return fallback;
    return response.json();
  } catch {
    return fallback;
  }
}

function chip(value) {
  return `<span>${escapeHtml(value)}</span>`;
}

function insertAfter(reference, node) {
  reference.parentNode?.insertBefore(node, reference.nextSibling);
}

function titleCase(value) {
  return String(value || '')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function normalizeTextKey(value) {
  return String(value || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function slugify(value) {
  return normalizeTextKey(value) || 'ap-surface';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}
