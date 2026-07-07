/* AP Applied Guides Core Bridge
Sprint 34.1 — Browser-Only Applied Guides Repair
Principle: A system should not require a terminal to become whole.

This module makes Applied Systems Guides first-class at runtime without
requiring Node, terminal access, or local data-file merge scripts.
It patches AP data responses in memory so existing AP surfaces see the guide.
*/

const GUIDE_ID = 'book-turning-code-into-cash';

const APPLIED_GUIDE = {
  id: GUIDE_ID,
  title: 'The Ultimate Guide for Turning Code into Cash',
  subtitle: 'From Idea to Income',
  author: 'Tommy Burke',
  status: 'Published',
  publishedYear: '2023',
  stage: 'Applied Systems Guides',
  domain: 'Software Commercialization',
  difficulty: 2,
  url: '../books/turning-code-into-cash.html',
  purchaseUrl: 'https://amzn.to/4fjjAEa',
  availabilityNote: 'The book is published and available now. The AP companion curriculum around it — worksheets, builder journey steps, reflection prompts, and lab exercises — is still in development.',
  curriculumStatus: 'Companion AP curriculum in development',
  summary: 'A practical commercialization guide for builders who have created software but need to understand the system around selling, licensing, packaging, distributing, supporting, and sustaining it.',
  readerOutcome: 'The reader sees software commercialization as an operating system around the product, not a single sales action.',
  systemQuestion: "How does a useful software project become a commercially viable product that can survive outside the builder's machine?",
  domains: [
    'Software Commercialization',
    'Productization',
    'Operational Design',
    'Builders',
    'Business Systems'
  ],
  connections: [
    'principle-practical',
    'principle-outcomes',
    'principle-evidence',
    'laboratories',
    'lab-kgb-studio',
    'lab-code-shield'
  ]
};

const APPLIED_STAGE = {
  id: 'stage-applied-guides',
  label: 'Applied Systems Guides',
  summary: 'Published practical guides that apply AP-style systems thinking to builder, productization, and commercialization problems.'
};

const ATLAS_NODE = {
  id: GUIDE_ID,
  label: 'Turning Code into Cash',
  type: 'book',
  domain: 'Software Commercialization',
  summary: 'A published applied systems guide for turning software from an isolated creation into a commercially viable, licensed, packaged, distributed, supported product.',
  url: '../books/turning-code-into-cash.html'
};

const ATLAS_EDGES = [
  { source: GUIDE_ID, target: 'principle-practical', type: 'proves' },
  { source: GUIDE_ID, target: 'principle-outcomes', type: 'applies' },
  { source: GUIDE_ID, target: 'principle-evidence', type: 'uses' },
  { source: GUIDE_ID, target: 'laboratories', type: 'connects-to' },
  { source: GUIDE_ID, target: 'lab-kgb-studio', type: 'informs' },
  { source: GUIDE_ID, target: 'lab-code-shield', type: 'informs' },
  { source: 'books', target: GUIDE_ID, type: 'contains' }
];

const AVAILABILITY_RESOURCE = {
  id: GUIDE_ID,
  status: 'Published',
  statusLabel: 'Published',
  actionLabel: 'Buy the book',
  actionUrl: 'https://amzn.to/4fjjAEa',
  secondaryActionLabel: 'Ask about the book',
  secondaryActionUrl: 'mailto:tommy@asymmetricprecision.com?subject=The%20Ultimate%20Guide%20for%20Turning%20Code%20into%20Cash',
  currentPath: 'The book is published and available now. The AP companion curriculum around it is still in development: worksheets, builder journey steps, reflection prompts, lab tie-ins, and commercialization exercises.'
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function upsert(list, item) {
  const output = Array.isArray(list) ? [...list] : [];
  const index = output.findIndex((entry) => entry && entry.id === item.id);
  if (index >= 0) output[index] = { ...output[index], ...item };
  else output.push(item);
  return output;
}

function upsertEdge(edges, edge) {
  const output = Array.isArray(edges) ? [...edges] : [];
  const exists = output.some((entry) => (
    entry && entry.source === edge.source && entry.target === edge.target && entry.type === edge.type
  ));
  if (!exists) output.push(edge);
  return output;
}

function shouldPatch(url) {
  return /assets\/data\/(ap-books|ap-content|ap-atlas|ap-availability)\.json(?:[?#].*)?$/i.test(url || '');
}

function identifyDataFile(url) {
  const match = String(url || '').match(/assets\/data\/(ap-books|ap-content|ap-atlas|ap-availability)\.json/i);
  return match ? match[1] : '';
}

export function mergeAppliedGuideData(fileName, data) {
  const next = clone(data || {});

  if (fileName === 'ap-books') {
    next.curriculumStages = upsert(next.curriculumStages || [], APPLIED_STAGE);
    next.books = upsert(next.books || [], APPLIED_GUIDE);
    next.version = next.version || '0.34-browser';
    return next;
  }

  if (fileName === 'ap-content') {
    next.items = upsert(next.items || [], {
      ...APPLIED_GUIDE,
      type: 'book',
      path: 'Learn',
      domains: APPLIED_GUIDE.domains
    });
    next.version = next.version || '0.34-browser';
    return next;
  }

  if (fileName === 'ap-atlas') {
    next.nodes = upsert(next.nodes || [], ATLAS_NODE);
    let edges = Array.isArray(next.edges) ? [...next.edges] : [];
    ATLAS_EDGES.forEach((edge) => { edges = upsertEdge(edges, edge); });
    next.edges = edges;
    next.version = next.version || '0.34-browser';
    return next;
  }

  if (fileName === 'ap-availability') {
    next.resources = upsert(next.resources || [], AVAILABILITY_RESOURCE);
    next.version = next.version || '0.34-browser';
    return next;
  }

  return next;
}

function installFetchBridge() {
  window.APSystem = window.APSystem || {};
  if (window.APSystem.appliedGuidesBridge?.active) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function apAppliedGuideFetch(input, init) {
    const response = await originalFetch(input, init);
    const requestUrl = typeof input === 'string' ? input : input?.url;

    if (!shouldPatch(requestUrl) || !response.ok) return response;

    try {
      const fileName = identifyDataFile(requestUrl);
      const data = await response.clone().json();
      const merged = mergeAppliedGuideData(fileName, data);
      const headers = new Headers(response.headers);
      headers.set('content-type', 'application/json; charset=utf-8');
      headers.set('x-ap-applied-guides', 'runtime-merged');

      return new Response(JSON.stringify(merged, null, 2), {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      console.warn('[AP Applied Guides Bridge] Data response could not be merged.', error);
      return response;
    }
  };

  window.APSystem.appliedGuidesBridge = {
    active: true,
    mode: 'browser-only-runtime-merge',
    guideId: GUIDE_ID,
    installedAt: Date.now()
  };

  document.documentElement.classList.add('ap-applied-guides-bridge-active');
}

export function initializeAppliedGuidesCore() {
  installFetchBridge();
}

export function initializeAppliedGuideDataBridge() {
  installFetchBridge();
}
