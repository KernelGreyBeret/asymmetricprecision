/*
AP Atlas Stability Core
Sprint 32 — Atlas Stability Core
Principle: A map must remain usable before it becomes elaborate.

This renderer intentionally replaces the fragile accumulated Atlas renderer with a
small, bounded, fail-soft core. It preserves AP behavior that matters most:
- focused URLs (?focus=...)
- projection modes
- density modes
- label modes
- relationship grammar-like language
- journey-aware views when journey data exists
- bounded DOM rendering so the Atlas cannot lock the page
*/

const DEFAULT_ATLAS_PATH = '../assets/data/ap-atlas.json';
const DEFAULT_JOURNEY_PATH = '../assets/data/ap-journeys.json';
const MAX_VISIBLE_NODES = 64;
const MAX_VISIBLE_EDGES = 140;
const MAX_LABELS = 24;
const ATLAS_MOVE_MODE = 'true';

export function initializeAtlasPreview() {
  initializeAtlas();
}

export function initializeAtlasExplorer() {
  initializeAtlas();
}

export function initializeAtlasCartography() {
  initializeAtlas();
}

export function initializeAtlasMaturity() {
  initializeAtlas();
}

export function initializeAtlas() {
  const roots = document.querySelectorAll('[data-ap-atlas]');
  roots.forEach((root) => {
    if (root.dataset.apAtlasStableReady === 'true') return;
    if (root.dataset.apAtlasStableInitializing === 'true') return;
    root.dataset.apAtlasStableInitializing = 'true';
    bootAtlas(root).catch((error) => renderFailure(root, error));
  });
}

async function bootAtlas(root) {
  const els = collect(root);
  if (!els.map || !els.list || !els.detail) {
    throw new Error('Atlas surface is missing required map/list/detail elements.');
  }

  const [atlas, journeys] = await Promise.all([
    loadJson(root.dataset.apAtlas || DEFAULT_ATLAS_PATH),
    loadJson(DEFAULT_JOURNEY_PATH).catch(() => ({ journeys: [] }))
  ]);

  const nodes = sanitizeNodes(atlas.nodes || []);
  const edges = sanitizeEdges(atlas.edges || []);
  const byId = new Map(nodes.map((node) => [node.id, node]));

  if (!nodes.length) throw new Error('Atlas data loaded, but no nodes were found.');

  ensureControls(root, els, nodes);

  const state = {
    root,
    els,
    nodes,
    edges,
    byId,
    journeys: Array.isArray(journeys.journeys) ? journeys.journeys : [],
    selectedId: pickInitialNode(byId, nodes),
    trail: [],
    manualPositions: new Map(),
    lastProjection: null,
    suppressClickUntil: 0
  };

  const params = new URLSearchParams(window.location.search);
  const focus = params.get('focus') || params.get('node');
  if (focus && byId.has(focus)) state.selectedId = focus;
  applyParams(els, params);

  root.addEventListener('click', (event) => {
    if (Date.now() < (state.suppressClickUntil || 0)) {
      event.preventDefault();
      return;
    }

    const workspace = event.target.closest('[data-ap-atlas-workspace]');
    if (workspace) {
      event.preventDefault();
      openWorkspace(state);
      return;
    }

    const workspaceClose = event.target.closest('[data-ap-atlas-workspace-close]');
    if (workspaceClose) {
      event.preventDefault();
      closeWorkspace(state);
      return;
    }

    const moveToggle = event.target.closest('[data-ap-atlas-move-toggle]');
    if (moveToggle) {
      event.preventDefault();
      toggleMoveMode(state);
      return;
    }

    const image = event.target.closest('[data-ap-atlas-open-image]');
    if (image) {
      event.preventDefault();
      openMapImage(state);
      return;
    }

    const download = event.target.closest('[data-ap-atlas-download-svg]');
    if (download) {
      event.preventDefault();
      downloadMapSvg(state);
      return;
    }

    const downloadPng = event.target.closest('[data-ap-atlas-download-png]');
    if (downloadPng) {
      event.preventDefault();
      downloadMapPng(state);
      return;
    }

    const fullBlueprint = event.target.closest('[data-ap-atlas-open-blueprint]');
    if (fullBlueprint) {
      event.preventDefault();
      openFullBlueprint(state);
      return;
    }

    const nodeButton = event.target.closest('[data-node-id]');
    if (nodeButton) {
      event.preventDefault();
      selectNode(state, nodeButton.dataset.nodeId);
      return;
    }

    const follow = event.target.closest('[data-ap-follow-connection]');
    if (follow) {
      event.preventDefault();
      selectNode(state, follow.dataset.apFollowConnection);
      return;
    }

    const reset = event.target.closest('[data-ap-atlas-clear]');
    if (reset) {
      event.preventDefault();
      resetControls(state);
      return;
    }

    const projection = event.target.closest('[data-ap-atlas-projection-action]');
    if (projection && els.projection) {
      event.preventDefault();
      els.projection.value = projection.dataset.apAtlasProjectionAction || 'system';
      render(state, true);
      return;
    }

    const density = event.target.closest('[data-ap-atlas-density-action]');
    if (density && els.density) {
      event.preventDefault();
      els.density.value = density.dataset.apAtlasDensityAction || 'balanced';
      render(state, true);
    }
  });

  root.addEventListener('pointerdown', (event) => {
    const nodeButton = event.target.closest('.ap-atlas-node[data-node-id]');
    if (!nodeButton || root.dataset.apAtlasMove !== ATLAS_MOVE_MODE) return;
    event.preventDefault();
    event.stopPropagation();
    startNodeDrag(state, nodeButton, event);
  });

  ['input', 'change'].forEach((type) => {
    [els.search, els.type, els.domain, els.projection, els.density, els.labels]
      .filter(Boolean)
      .forEach((control) => control.addEventListener(type, () => render(state, true)));
  });

  render(state, false);
  root.dataset.apAtlasStableReady = 'true';
  root.dataset.apAtlasStableInitializing = 'false';
  root.dataset.apAtlasReady = 'true';
  window.APSystem = window.APSystem || {};
  window.APSystem.atlas = { status: 'stable-core', rerender: () => render(state, true), state };
  document.dispatchEvent(new CustomEvent('ap:atlas-ready', { detail: { root, state } }));
}

function collect(root) {
  return {
    controls: root.querySelector('[data-ap-atlas-controls], .ap-atlas-controls'),
    search: root.querySelector('[data-ap-atlas-search]'),
    type: root.querySelector('[data-ap-atlas-type]'),
    domain: root.querySelector('[data-ap-atlas-domain]'),
    clear: root.querySelector('[data-ap-atlas-clear]'),
    projection: root.querySelector('[data-ap-atlas-projection]'),
    density: root.querySelector('[data-ap-atlas-density]'),
    labels: root.querySelector('[data-ap-atlas-labels]'),
    map: root.querySelector('[data-ap-atlas-map]'),
    list: root.querySelector('[data-ap-atlas-list]'),
    detail: root.querySelector('[data-ap-atlas-detail]'),
    trail: root.querySelector('[data-ap-atlas-trail]')
  };
}

async function loadJson(path) {
  const url = new URL(path, window.location.href);
  const response = await fetch(url.href, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`${url.pathname} returned ${response.status}`);
  return response.json();
}

function sanitizeNodes(nodes) {
  return nodes
    .filter((node) => node && node.id)
    .map((node) => ({
      id: String(node.id),
      label: String(node.label || node.title || node.id),
      type: String(node.type || 'node'),
      domain: String(node.domain || 'Unmapped'),
      summary: String(node.summary || 'This node is part of the Asymmetric Precision system.'),
      url: node.url || ''
    }));
}

function sanitizeEdges(edges) {
  return edges
    .map((edge) => ({
      from: String(edge.from || edge.source || ''),
      to: String(edge.to || edge.target || ''),
      relationship: String(edge.relationship || edge.type || edge.label || 'relates to')
    }))
    .filter((edge) => edge.from && edge.to && edge.from !== edge.to);
}

function ensureControls(root, els, nodes) {
  fillSelect(els.type, 'All types', unique(nodes.map((node) => node.type)));
  fillSelect(els.domain, 'All domains', unique(nodes.map((node) => node.domain)));

  els.projection = ensureSelect(els.controls, els.clear, 'Projection', 'ap-atlas-projection', [
    ['system', 'System Map'],
    ['neighborhood', 'Focused Neighborhood'],
    ['domain', 'Domain Cluster'],
    ['journey', 'Journey Path']
  ], els.projection);

  els.density = ensureSelect(els.controls, els.clear, 'Density', 'ap-atlas-density', [
    ['quiet', 'Quiet'],
    ['balanced', 'Balanced'],
    ['full', 'Full System']
  ], els.density);

  els.labels = ensureSelect(els.controls, els.clear, 'Labels', 'ap-atlas-labels', [
    ['active', 'Active only'],
    ['visible', 'Visible edges'],
    ['none', 'Hide labels']
  ], els.labels);

  ensureWorkspaceControls(root, els);

  if (!root.querySelector('[data-ap-atlas-stability]')) {
    const status = document.createElement('div');
    status.className = 'ap-atlas-stability';
    status.dataset.apAtlasStability = '';
    status.innerHTML = '<strong>Atlas Stability Core</strong><span>Bounded rendering active. The map remains usable while the system grows.</span>';
    const interfaceEl = root.querySelector('.ap-atlas-interface') || els.map;
    root.insertBefore(status, interfaceEl || root.firstChild);
  }
}

function ensureSelect(controls, beforeEl, label, dataName, options, existing) {
  if (existing) return existing;
  if (!controls) return null;
  const wrapper = document.createElement('label');
  wrapper.className = `ap-atlas-control ap-atlas-${dataName.replace('ap-atlas-', '')}-control`;
  wrapper.innerHTML = `<span>${escapeHtml(label)}</span><select data-${dataName}>${options.map(([value, text]) => `<option value="${escapeHtml(value)}">${escapeHtml(text)}</option>`).join('')}</select>`;
  controls.insertBefore(wrapper, beforeEl || null);
  return wrapper.querySelector('select');
}

function applyParams(els, params) {
  if (els.search && params.get('q')) els.search.value = params.get('q');
  if (els.type && params.get('type')) els.type.value = params.get('type');
  if (els.domain && params.get('domain')) els.domain.value = params.get('domain');
  if (els.projection) els.projection.value = params.get('projection') || (params.get('journey') ? 'journey' : 'system');
  if (els.density) els.density.value = params.get('density') || 'balanced';
  if (els.labels) els.labels.value = params.get('labels') || 'active';
}

function pickInitialNode(byId, nodes) {
  return byId.has('ap') ? 'ap' : nodes[0].id;
}

function readView(els) {
  return {
    query: (els.search?.value || '').trim().toLowerCase(),
    type: els.type?.value || '',
    domain: els.domain?.value || '',
    projection: els.projection?.value || 'system',
    density: els.density?.value || 'balanced',
    labels: els.labels?.value || 'active',
    journey: new URLSearchParams(window.location.search).get('journey') || readJourneyId()
  };
}

function render(state, pushUrl) {
  try {
    const view = readView(state.els);
    const filtered = filterNodes(state.nodes, state.edges, view);
    let visibleNodes = projectNodes(filtered, state, view);
    visibleNodes = boundNodes(visibleNodes, state.selectedId);
    const visibleIds = new Set(visibleNodes.map((node) => node.id));
    if (!visibleIds.has(state.selectedId)) {
      state.selectedId = visibleNodes[0]?.id || state.selectedId;
      if (state.selectedId) visibleIds.add(state.selectedId);
    }
    const visibleEdges = boundEdges(projectEdges(state.edges, visibleIds, state.selectedId, view));
    const relatedIds = connectedIds(state.selectedId, state.edges);
    const positions = layoutNodes(visibleNodes, state, relatedIds, view);
    state.lastProjection = { nodes: visibleNodes, edges: visibleEdges, positions, relatedIds, view };

    renderMetrics(state.root, visibleNodes, visibleEdges, view);
    renderList(state, visibleNodes, relatedIds);
    renderMap(state, visibleNodes, visibleEdges, positions, relatedIds, view);
    renderDetail(state, visibleNodes, visibleEdges, view);
    renderTrail(state, view);
    if (pushUrl) syncUrl(state, view);
  } catch (error) {
    renderFailure(state.root, error);
  }
}

function filterNodes(nodes, edges, view) {
  return nodes.filter((node) => {
    if (view.type && node.type !== view.type) return false;
    if (view.domain && node.domain !== view.domain) return false;
    if (!view.query) return true;
    const edgeText = edges
      .filter((edge) => edge.from === node.id || edge.to === node.id)
      .map((edge) => edge.relationship)
      .join(' ');
    return `${node.label} ${node.type} ${node.domain} ${node.summary} ${edgeText}`.toLowerCase().includes(view.query);
  });
}

function projectNodes(filtered, state, view) {
  const filteredIds = new Set(filtered.map((node) => node.id));
  const keep = new Set();
  const selected = state.selectedId;
  const neighbors = connectedIds(selected, state.edges);

  if (view.projection === 'neighborhood') {
    keep.add(selected); keep.add('ap'); neighbors.forEach((id) => keep.add(id));
    if (view.density === 'full') neighbors.forEach((id) => connectedIds(id, state.edges).forEach((next) => keep.add(next)));
    return state.nodes.filter((node) => keep.has(node.id) && (filteredIds.has(node.id) || node.id === selected || node.id === 'ap'));
  }

  if (view.projection === 'domain') {
    const domain = state.byId.get(selected)?.domain;
    return state.nodes.filter((node) => (node.id === 'ap' || node.id === selected || node.domain === domain) && (filteredIds.has(node.id) || node.id === selected || node.id === 'ap'));
  }

  if (view.projection === 'journey') {
    journeyIds(state.journeys, view.journey, state.nodes).forEach((id) => keep.add(id));
    if (!keep.size) { keep.add(selected); neighbors.forEach((id) => keep.add(id)); }
    keep.add('ap');
    return state.nodes.filter((node) => keep.has(node.id) && (filteredIds.has(node.id) || keep.has(node.id)));
  }

  if (view.density === 'quiet') {
    keep.add(selected); keep.add('ap'); neighbors.forEach((id) => keep.add(id));
    return state.nodes.filter((node) => keep.has(node.id) && (filteredIds.has(node.id) || node.id === selected || node.id === 'ap'));
  }

  if (view.density === 'balanced') {
    keep.add(selected); keep.add('ap'); neighbors.forEach((id) => keep.add(id));
    state.edges.filter(isStructural).forEach((edge) => { keep.add(edge.from); keep.add(edge.to); });
    return state.nodes.filter((node) => keep.has(node.id) && (filteredIds.has(node.id) || node.id === selected || node.id === 'ap'));
  }

  return filtered;
}

function boundNodes(nodes, selectedId) {
  if (nodes.length <= MAX_VISIBLE_NODES) return nodes;
  const sorted = [...nodes].sort((a, b) => {
    if (a.id === selectedId) return -1;
    if (b.id === selectedId) return 1;
    if (a.id === 'ap') return -1;
    if (b.id === 'ap') return 1;
    return a.label.localeCompare(b.label);
  });
  return sorted.slice(0, MAX_VISIBLE_NODES);
}

function projectEdges(edges, visibleIds, selectedId, view) {
  let visible = edges.filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to));
  if (view.density === 'quiet') visible = visible.filter((edge) => edge.from === selectedId || edge.to === selectedId || edge.from === 'ap' || edge.to === 'ap');
  if (view.density === 'balanced') visible = visible.filter((edge) => edge.from === selectedId || edge.to === selectedId || edge.from === 'ap' || edge.to === 'ap' || isStructural(edge));
  return visible;
}

function boundEdges(edges) {
  if (edges.length <= MAX_VISIBLE_EDGES) return edges;
  return edges.slice(0, MAX_VISIBLE_EDGES);
}

function layoutNodes(nodes, state, relatedIds, view) {
  const positions = new Map();
  const selectedId = state.selectedId;
  const selected = nodes.find((node) => node.id === selectedId);
  if (selected) positions.set(selected.id, { x: 50, y: 50, role: 'focus' });

  if (view.projection === 'journey') {
    const count = nodes.length || 1;
    nodes.forEach((node, index) => {
      if (node.id === selectedId && count > 1) return;
      positions.set(node.id, {
        x: count === 1 ? 50 : 8 + (84 * index) / Math.max(count - 1, 1),
        y: 50 + Math.sin(index * 0.9) * 18,
        role: node.id === selectedId ? 'focus' : 'journey'
      });
    });
    applyManualPositions(nodes, positions, state);
    return positions;
  }

  const related = nodes.filter((node) => node.id !== selectedId && relatedIds.has(node.id));
  const context = nodes.filter((node) => node.id !== selectedId && !relatedIds.has(node.id));
  ring(related, positions, 50, 50, 30, 'related');
  ring(context, positions, 50, 50, 43, 'context');
  applyManualPositions(nodes, positions, state);
  return positions;
}

function ring(nodes, positions, cx, cy, radius, role) {
  nodes.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(nodes.length, 1) - Math.PI / 2;
    positions.set(node.id, {
      x: clamp(cx + Math.cos(angle) * radius, 5, 95),
      y: clamp(cy + Math.sin(angle) * radius, 8, 92),
      role
    });
  });
}

function renderMetrics(root, nodes, edges, view) {
  let metrics = root.querySelector('[data-ap-atlas-metrics]');
  if (!metrics) {
    metrics = document.createElement('div');
    metrics.className = 'ap-atlas-metrics';
    metrics.dataset.apAtlasMetrics = '';
    const anchor = root.querySelector('.ap-atlas-interface');
    root.insertBefore(metrics, anchor || root.firstChild);
  }
  metrics.innerHTML = `
    <span><strong>${nodes.length}</strong> nodes</span>
    <span><strong>${edges.length}</strong> relationships</span>
    <span><strong>${escapeHtml(projectionLabel(view.projection))}</strong></span>
    <span><strong>${escapeHtml(view.density)}</strong> density</span>
  `;
}

function renderList(state, nodes, relatedIds) {
  const { list } = state.els;
  if (!list) return;
  list.innerHTML = nodes.map((node) => `
    <button type="button" class="ap-atlas-list-item${node.id === state.selectedId ? ' is-active' : ''}${relatedIds.has(node.id) ? ' is-related' : ''}" data-node-id="${escapeHtml(node.id)}">
      <strong>${escapeHtml(node.label)}</strong>
      <span>${escapeHtml(node.type)} · ${escapeHtml(node.domain)}</span>
    </button>
  `).join('') || '<p class="ap-muted">No nodes match this projection.</p>';
}

function renderMap(state, nodes, edges, positions, relatedIds, view) {
  const { map } = state.els;
  if (!map) return;
  map.dataset.projection = view.projection;
  map.dataset.density = view.density;
  map.dataset.apAtlasMove = state.root.dataset.apAtlasMove || 'false';

  const svg = renderSvg(edges, positions, state, view);
  const nodeHtml = nodes.map((node) => {
    const pos = positions.get(node.id) || { x: 50, y: 50, role: 'context' };
    const active = node.id === state.selectedId ? ' is-active' : '';
    const related = relatedIds.has(node.id) ? ' is-related' : '';
    return `<button type="button" class="ap-atlas-node ap-atlas-node-${escapeHtml(node.type)}${active}${related}" style="left:${pos.x}%;top:${pos.y}%" data-node-id="${escapeHtml(node.id)}"><span>${escapeHtml(node.label)}</span><small>${escapeHtml(node.type)}</small></button>`;
  }).join('');
  const label = `<div class="ap-atlas-blueprint-label">${escapeHtml(projectionLabel(view.projection))}</div>`;
  map.innerHTML = `${svg}${nodeHtml}${label}`;
}

function renderSvg(edges, positions, state, view) {
  const labels = view.labels || 'active';
  const labelEdges = labels === 'none' ? [] : (labels === 'visible' ? edges.slice(0, MAX_LABELS) : edges.filter((edge) => edge.from === state.selectedId || edge.to === state.selectedId).slice(0, MAX_LABELS));
  const paths = edges.map((edge, index) => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) return '';
    const mid = curve(from, to, index);
    const active = edge.from === state.selectedId || edge.to === state.selectedId ? ' is-active' : '';
    return `<path class="ap-atlas-edge${active}" d="M ${from.x} ${from.y} Q ${mid.x} ${mid.y} ${to.x} ${to.y}"/>`;
  }).join('');
  const text = labelEdges.map((edge, index) => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) return '';
    const mid = curve(from, to, index);
    return `<text class="ap-atlas-edge-label" x="${mid.x}" y="${mid.y}">${escapeHtml(relationshipPhrase(edge.relationship))}</text>`;
  }).join('');
  return `<svg class="ap-atlas-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${paths}${text}</svg>`;
}

function renderDetail(state, visibleNodes, visibleEdges, view) {
  const { detail } = state.els;
  if (!detail) return;
  const node = state.byId.get(state.selectedId) || visibleNodes[0];
  if (!node) {
    detail.innerHTML = '<h2>No node selected</h2><p>Reset the Atlas or widen the projection.</p>';
    return;
  }
  const connections = state.edges
    .filter((edge) => edge.from === node.id || edge.to === node.id)
    .slice(0, 24)
    .map((edge) => relationshipRow(edge, node.id, state.byId))
    .join('');
  const page = node.url ? `<a class="ap-action ap-action-secondary" href="${escapeHtml(resolveSiteUrl(node.url))}">Open related page</a>` : '';
  const share = `<a class="ap-action ap-action-secondary" href="${escapeHtml(atlasUrl(node.id, view))}">Share this Atlas view</a>`;

  detail.innerHTML = `
    <p class="section-label">${escapeHtml(node.type)} · ${escapeHtml(node.domain)}</p>
    <h2>${escapeHtml(node.label)}</h2>
    <p>${escapeHtml(node.summary)}</p>
    <div class="ap-atlas-projection-summary"><strong>${escapeHtml(projectionLabel(view.projection))}</strong><span>${visibleNodes.length} nodes · ${visibleEdges.length} relationships visible</span><span>This is a bounded projection of the larger AP system.</span></div>
    <p class="ap-action-row">${page}${share}</p>
    <div class="ap-atlas-projection-actions">
      <button type="button" data-ap-atlas-projection-action="system">System map</button>
      <button type="button" data-ap-atlas-projection-action="neighborhood">Neighborhood</button>
      <button type="button" data-ap-atlas-projection-action="domain">Domain</button>
      <button type="button" data-ap-atlas-density-action="full">Show fuller map</button>
    </div>
    <h3>Connections</h3>
    <ul class="ap-connection-list ap-connection-actions">${connections || '<li>No connections defined yet.</li>'}</ul>
  `;
}

function relationshipRow(edge, currentId, byId) {
  const otherId = edge.from === currentId ? edge.to : edge.from;
  const other = byId.get(otherId);
  if (!other) return '';
  const phrase = edge.from === currentId ? relationshipPhrase(edge.relationship) : inversePhrase(edge.relationship);
  const sentence = `${nodeName(byId.get(currentId))} ${phrase} ${other.label}.`;
  return `<li class="ap-relationship-row"><button type="button" data-ap-follow-connection="${escapeHtml(other.id)}"><span class="ap-relationship-verb">${escapeHtml(phrase)}</span><strong>${escapeHtml(other.label)}</strong><small>${escapeHtml(other.type)} · ${escapeHtml(other.domain)}</small><em>${escapeHtml(sentence)}</em></button></li>`;
}

function renderTrail(state, view) {
  const { trail } = state.els;
  if (!trail) return;
  const nodes = state.trail.map((id) => state.byId.get(id)).filter(Boolean);
  if (!nodes.length) {
    trail.innerHTML = `<p><strong>Understanding Trail:</strong> Select nodes to trace your path through the system. Current view: ${escapeHtml(projectionLabel(view.projection))}.</p>`;
    return;
  }
  trail.innerHTML = `<p><strong>Understanding Trail:</strong></p><div>${nodes.map((node) => `<span>${escapeHtml(node.label)}</span>`).join('<span class="ap-trail-arrow">→</span>')}</div>`;
}

function selectNode(state, id) {
  if (!state.byId.has(id)) return;
  state.selectedId = id;
  state.trail.push(id);
  state.trail = state.trail.slice(-9);
  render(state, true);
}

function resetControls(state) {
  const { els } = state;
  if (els.search) els.search.value = '';
  if (els.type) els.type.value = '';
  if (els.domain) els.domain.value = '';
  if (els.projection) els.projection.value = 'system';
  if (els.density) els.density.value = 'balanced';
  if (els.labels) els.labels.value = 'active';
  state.selectedId = pickInitialNode(state.byId, state.nodes);
  state.trail = [];
  render(state, true);
}

function syncUrl(state, view) {
  if (!window.history?.replaceState) return;
  const next = new URL(window.location.href);
  next.searchParams.set('focus', state.selectedId);
  next.searchParams.set('projection', view.projection);
  next.searchParams.set('density', view.density);
  next.searchParams.set('labels', view.labels);
  if (view.query) next.searchParams.set('q', view.query); else next.searchParams.delete('q');
  if (view.type) next.searchParams.set('type', view.type); else next.searchParams.delete('type');
  if (view.domain) next.searchParams.set('domain', view.domain); else next.searchParams.delete('domain');
  window.history.replaceState({}, '', next.pathname + next.search + next.hash);
}

function atlasUrl(nodeId, view) {
  const url = new URL(window.location.href);
  url.searchParams.set('focus', nodeId);
  url.searchParams.set('projection', view.projection || 'system');
  url.searchParams.set('density', view.density || 'balanced');
  url.searchParams.set('labels', view.labels || 'active');
  return url.pathname + url.search + url.hash;
}

function connectedIds(id, edges) {
  const ids = new Set();
  edges.forEach((edge) => {
    if (edge.from === id) ids.add(edge.to);
    if (edge.to === id) ids.add(edge.from);
  });
  return ids;
}

function journeyIds(journeys, journeyId, nodes) {
  const journey = (journeys || []).find((item) => item.id === journeyId);
  if (!journey) return [];
  const ids = [];
  for (const step of journey.steps || []) {
    if (step.nodeId) ids.push(step.nodeId);
    if (step.url) {
      const matched = nodes.find((node) => node.url && normalizePath(node.url) === normalizePath(step.url));
      if (matched) ids.push(matched.id);
    }
  }
  return [...new Set(ids)];
}

function readJourneyId() {
  try {
    const state = JSON.parse(localStorage.getItem('ap-journey-state') || '{}');
    return state.journeyId || '';
  } catch (_) {
    return '';
  }
}

function isStructural(edge) {
  const key = edge.relationship.toLowerCase();
  return key.includes('contain') || key.includes('belong') || key.includes('ground') || key.includes('govern') || key.includes('through');
}

function relationshipPhrase(raw) {
  const key = String(raw || 'relates to').toLowerCase().trim();
  const map = {
    'contains': 'contains',
    'belongs to': 'belongs to',
    'is grounded in': 'is grounded in',
    'explains itself through': 'explains itself through',
    'maps itself through': 'maps itself through',
    'teaches through': 'teaches through',
    'welcomes through': 'welcomes through',
    'operationalizes through': 'operationalizes through',
    'sharpens through': 'sharpens through',
    'connects to': 'connects to',
    'proves': 'proves',
    'implements': 'implements',
    'observes through': 'observes through',
    'captures': 'captures',
    'shapes': 'shapes'
  };
  return map[key] || key.replace(/_/g, ' ') || 'relates to';
}

function inversePhrase(raw) {
  const key = String(raw || 'relates to').toLowerCase().trim();
  const map = {
    'contains': 'belongs to',
    'belongs to': 'contains',
    'is grounded in': 'grounds',
    'explains itself through': 'explains',
    'maps itself through': 'maps',
    'teaches through': 'teaches',
    'welcomes through': 'welcomes',
    'operationalizes through': 'operationalizes',
    'sharpens through': 'sharpens',
    'connects to': 'connects to',
    'proves': 'is proven by',
    'implements': 'is implemented by',
    'observes through': 'observes',
    'captures': 'is captured by',
    'shapes': 'is shaped by'
  };
  return map[key] || 'relates to';
}

function projectionLabel(value) {
  return {
    system: 'System Map',
    neighborhood: 'Focused Neighborhood',
    domain: 'Domain Cluster',
    journey: 'Journey Path'
  }[value] || 'System Map';
}

function curve(from, to, index) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / dist;
  const ny = dx / dist;
  const offset = ((index % 5) - 2) * 1.2;
  return { x: (from.x + to.x) / 2 + nx * offset, y: (from.y + to.y) / 2 + ny * offset };
}

function fillSelect(select, label, values) {
  if (!select) return;
  const current = select.value;
  select.innerHTML = [`<option value="">${escapeHtml(label)}</option>`, ...values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)].join('');
  if ([...select.options].some((option) => option.value === current)) select.value = current;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function nodeName(node) {
  return node?.label || 'This node';
}

function normalizePath(value) {
  try {
    return new URL(value, window.location.href).pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '/');
  } catch (_) {
    return String(value || '').replace(/\/index\.html$/, '/').replace(/\/+$/, '/');
  }
}

function resolveSiteUrl(value) {
  try {
    return window.AP?.paths?.resolve?.(value) || value;
  } catch (_) {
    return value;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}


function ensureWorkspaceControls(root, els) {
  if (!els.controls || root.querySelector('[data-ap-atlas-workspace-tools]')) return;
  const tools = document.createElement('div');
  tools.className = 'ap-atlas-workspace-tools';
  tools.dataset.apAtlasWorkspaceTools = '';
  tools.innerHTML = `
    <button type="button" class="ap-action ap-action-secondary" data-ap-atlas-workspace>Open Map Workspace</button>
    <button type="button" class="ap-action ap-action-secondary" data-ap-atlas-move-toggle>Move Nodes: Off</button>
    <button type="button" class="ap-action ap-action-secondary" data-ap-atlas-open-image>Open Map Image</button>
    <button type="button" class="ap-action ap-action-secondary" data-ap-atlas-open-blueprint>Open Full Blueprint</button>
    <button type="button" class="ap-action ap-action-secondary" data-ap-atlas-download-svg>Download SVG</button>
    <button type="button" class="ap-action ap-action-secondary" data-ap-atlas-download-png>Download PNG</button>
    <button type="button" class="ap-action ap-action-secondary ap-atlas-workspace-close" data-ap-atlas-workspace-close>Close Workspace</button>
  `;
  els.controls.appendChild(tools);
}

function toggleMoveMode(state) {
  const enabled = state.root.dataset.apAtlasMove === ATLAS_MOVE_MODE;
  state.root.dataset.apAtlasMove = enabled ? 'false' : ATLAS_MOVE_MODE;
  const label = enabled ? 'Move Nodes: Off' : 'Move Nodes: On';
  state.root.querySelectorAll('[data-ap-atlas-move-toggle]').forEach((button) => { button.textContent = label; });
  state.els.map?.setAttribute('data-ap-atlas-move', state.root.dataset.apAtlasMove);
}

function openWorkspace(state) {
  state.root.classList.add('is-atlas-workspace');
  document.body.classList.add('ap-atlas-workspace-open');
  state.root.querySelector('[data-ap-atlas-workspace-close]')?.focus?.();
}

function closeWorkspace(state) {
  state.root.classList.remove('is-atlas-workspace');
  document.body.classList.remove('ap-atlas-workspace-open');
  state.root.querySelector('[data-ap-atlas-workspace]')?.focus?.();
}

function startNodeDrag(state, nodeButton, event) {
  const id = nodeButton.dataset.nodeId;
  if (!id || !state.els.map) return;
  const rect = state.els.map.getBoundingClientRect();
  const update = (clientX, clientY) => {
    const x = clamp(((clientX - rect.left) / Math.max(rect.width, 1)) * 100, 3, 97);
    const y = clamp(((clientY - rect.top) / Math.max(rect.height, 1)) * 100, 4, 96);
    state.manualPositions.set(id, { x, y, role: id === state.selectedId ? 'focus' : 'manual' });
    const view = readView(state.els);
    const projection = state.lastProjection;
    if (projection) {
      const positions = new Map(projection.positions || []);
      positions.set(id, state.manualPositions.get(id));
      state.lastProjection = { ...projection, positions };
      renderMap(state, projection.nodes, projection.edges, positions, projection.relatedIds || connectedIds(state.selectedId, state.edges), view);
    }
  };
  const move = (moveEvent) => {
    moveEvent.preventDefault();
    update(moveEvent.clientX, moveEvent.clientY);
  };
  const up = (upEvent) => {
    update(upEvent.clientX, upEvent.clientY);
    state.suppressClickUntil = Date.now() + 250;
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
  };
  nodeButton.setPointerCapture?.(event.pointerId);
  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', up, { once: true });
}

function applyManualPositions(nodes, positions, state) {
  if (!state.manualPositions?.size) return;
  const visible = new Set(nodes.map((node) => node.id));
  state.manualPositions.forEach((pos, id) => {
    if (visible.has(id)) positions.set(id, pos);
  });
}

function openMapImage(state) {
  const svg = buildSheetSvg(state, { scope: 'visible' });
  if (!svg) return;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 20000);
}

function openFullBlueprint(state) {
  const html = buildBlueprintHtml(state, { scope: 'full' });
  if (!html) return;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 20000);
}

function downloadMapSvg(state) {
  const svg = buildSheetSvg(state, { scope: 'visible' });
  if (!svg) return;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const focus = state.byId.get(state.selectedId)?.label || 'atlas';
  link.href = url;
  link.download = `ap-atlas-${slugify(focus)}.svg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadMapPng(state) {
  const svg = buildSheetSvg(state, { scope: 'visible' });
  if (!svg) return;
  const focus = state.byId.get(state.selectedId)?.label || 'atlas';
  const blob = await svgToPngBlob(svg, 2200, null);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ap-atlas-${slugify(focus)}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function buildBlueprintHtml(state, options = {}) {
  const svg = buildSheetSvg(state, { ...options, scope: options.scope || 'full' });
  if (!svg) return '';
  const title = state.byId.get(state.selectedId)?.label || 'Asymmetric Precision Atlas';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} — Atlas Blueprint</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; padding: 1.25rem; background: #060708; color: #f2eee6; font-family: Arial, sans-serif; }
  .sheet { max-width: 1800px; margin: 0 auto; }
  .sheet-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 0 0 1rem; }
  .sheet-actions button { border: 1px solid rgba(200,164,93,0.34); background: rgba(200,164,93,0.12); color: #f2eee6; padding: 0.7rem 1rem; border-radius: 999px; cursor: pointer; }
  .sheet-frame { border: 1px solid rgba(200,164,93,0.28); border-radius: 1rem; overflow: hidden; background: #0b0c0d; box-shadow: 0 24px 60px rgba(0,0,0,0.45); }
  .sheet-frame img, .sheet-frame object, .sheet-frame svg { display: block; width: 100%; height: auto; }
  .sheet-note { color: #b8b0a3; font-size: 0.95rem; margin-top: 0.75rem; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="sheet-actions">
      <button id="downloadPng">Download PNG</button>
      <button id="downloadSvg">Download SVG</button>
    </div>
    <div class="sheet-frame">${svg}</div>
    <p class="sheet-note">Atlas Blueprint export / Asymmetric Precision</p>
  </div>
<script>
const svgMarkup = ${JSON.stringify(svg)};
function svgBlob() { return new Blob([svgMarkup], { type: 'image/svg+xml' }); }
function trigger(name, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}
async function svgToPngBlob(svgText) {
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.decoding = 'async';
  return new Promise((resolve) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 2200;
      canvas.height = img.naturalHeight || 1600;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0b0c0d'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => { URL.revokeObjectURL(url); resolve(blob); }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}
document.getElementById('downloadSvg').addEventListener('click', () => trigger('ap-atlas-blueprint-${slugify(title)}.svg', svgBlob()));
document.getElementById('downloadPng').addEventListener('click', async () => {
  const blob = await svgToPngBlob(svgMarkup); if (blob) trigger('ap-atlas-blueprint-${slugify(title)}.png', blob);
});
</script>
</body>
</html>`;
}

function buildSheetSvg(state, options = {}) {
  const projection = buildExportProjection(state, options.scope || 'visible');
  if (!projection?.nodes?.length || !projection.positions) return '';

  const width = options.width || 2200;
  const headerHeight = 170;
  const mapHeight = options.scope === 'full' ? 1240 : 980;
  const footerHeight = 74;
  const appendix = buildConnectionAppendix(state, projection, options.scope || 'visible');
  const appendixTitleHeight = 62;
  const appendixRowHeight = 30;
  const appendixHeight = appendixTitleHeight + Math.max(1, appendix.lines.length) * appendixRowHeight + (appendix.more ? 34 : 0) + 24;
  const height = headerHeight + mapHeight + appendixHeight + footerHeight;
  const toX = (value) => 80 + (value / 100) * (width - 160);
  const toY = (value) => headerHeight + 36 + (value / 100) * (mapHeight - 72);

  const grid = buildGrid(width, headerHeight + mapHeight, headerHeight);
  const clusterRects = projection.clusters ? buildClusterRects(projection, width, headerHeight, mapHeight) : '';
  const edges = projection.edges.map((edge, index) => {
    const from = projection.positions.get(edge.from);
    const to = projection.positions.get(edge.to);
    if (!from || !to) return '';
    const mid = curve(from, to, index);
    const active = edge.from === state.selectedId || edge.to === state.selectedId;
    return `<path d="M ${toX(from.x)} ${toY(from.y)} Q ${toX(mid.x)} ${toY(mid.y)} ${toX(to.x)} ${toY(to.y)}" fill="none" stroke="${active ? '#7ee4ff' : '#c8a45d'}" stroke-opacity="${active ? '0.68' : '0.22'}" stroke-width="${active ? '3' : '1.3'}"/>`;
  }).join('');

  const nodes = projection.nodes.map((node) => {
    const pos = projection.positions.get(node.id) || { x: 50, y: 50 };
    const x = toX(pos.x);
    const y = toY(pos.y);
    const active = node.id === state.selectedId;
    const related = projection.relatedIds?.has?.(node.id);
    const dims = exportNodeDimensions(node, active, options.scope === 'full');
    const labelLines = wrapText(node.label, dims.wrap).slice(0, dims.maxLines);
    const rectWidth = dims.width;
    const rectHeight = dims.height + Math.max(0, labelLines.length - 1) * 16;
    const rx = x - rectWidth / 2;
    const ry = y - rectHeight / 2;
    return `<g>
      <rect x="${rx}" y="${ry}" width="${rectWidth}" height="${rectHeight}" rx="24" fill="rgba(7,8,9,0.94)" stroke="${active ? '#c8a45d' : related ? 'rgba(126,228,255,0.72)' : 'rgba(200,164,93,0.44)'}" stroke-width="${active ? '3.5' : '2'}"/>
      ${labelLines.map((line, index) => `<text x="${x}" y="${y - 8 + (index * 18)}" text-anchor="middle" fill="#f2eee6" font-size="${dims.fontSize}" font-family="Georgia, serif" font-weight="700">${escapeHtml(line)}</text>`).join('')}
      <text x="${x}" y="${ry + rectHeight - 12}" text-anchor="middle" fill="#b8b0a3" font-size="12" font-family="Arial, sans-serif" letter-spacing="2">${escapeHtml(node.type.toUpperCase())}</text>
    </g>`;
  }).join('');

  const headerTitle = state.byId.get(state.selectedId)?.label || 'Asymmetric Precision Atlas';
  const headerSubtitle = options.scope === 'full'
    ? 'Full-System Blueprint / cluster layout / non-overlap export surface'
    : `${projectionLabel(projection.view?.projection || 'system')} / ${projection.nodes.length} nodes / ${projection.edges.length} relationships`;

  const appendixLines = appendix.lines.map((line, index) => `<text x="90" y="${headerHeight + mapHeight + appendixTitleHeight + (index + 1) * appendixRowHeight}" fill="#f2eee6" font-size="20" font-family="Arial, sans-serif">${escapeHtml(line)}</text>`).join('');
  const appendixMore = appendix.more ? `<text x="90" y="${headerHeight + mapHeight + appendixTitleHeight + (appendix.lines.length + 1) * appendixRowHeight}" fill="#b8b0a3" font-size="18" font-family="Arial, sans-serif">${escapeHtml(appendix.more)}</text>` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="apBg" cx="50%" cy="42%" r="82%">
      <stop offset="0%" stop-color="#1a1510" stop-opacity="1"/>
      <stop offset="100%" stop-color="#070809" stop-opacity="1"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="#0b0c0d"/>
  <rect width="100%" height="100%" fill="url(#apBg)"/>
  ${grid}
  <g>${clusterRects}</g>
  <g>${edges}</g>
  <g>${nodes}</g>
  <g>
    <rect x="34" y="28" width="${width - 68}" height="112" rx="26" fill="rgba(8,9,10,0.88)" stroke="rgba(200,164,93,0.34)" stroke-width="1.5"/>
    <text x="64" y="68" fill="#c8a45d" font-size="24" font-family="Arial, sans-serif" letter-spacing="4">ASYMMETRIC PRECISION / ATLAS BLUEPRINT</text>
    <text x="64" y="112" fill="#f2eee6" font-size="42" font-family="Georgia, serif" font-weight="700">${escapeHtml(headerTitle)}</text>
    <text x="${width - 64}" y="112" fill="#b8b0a3" font-size="18" text-anchor="end" font-family="Arial, sans-serif" letter-spacing="2">${escapeHtml(headerSubtitle)}</text>
  </g>
  <g>
    <rect x="40" y="${headerHeight + mapHeight + 10}" width="${width - 80}" height="${appendixHeight - 18}" rx="24" fill="rgba(8,9,10,0.88)" stroke="rgba(200,164,93,0.28)" stroke-width="1.4"/>
    <text x="90" y="${headerHeight + mapHeight + 44}" fill="#c8a45d" font-size="22" font-family="Arial, sans-serif" letter-spacing="4">CONNECTION STATEMENTS</text>
    ${appendixLines}
    ${appendixMore}
  </g>
  <g>
    <rect x="0" y="${height - footerHeight}" width="${width}" height="${footerHeight}" fill="rgba(6,7,8,0.94)"/>
    <text x="52" y="${height - 28}" fill="#b8b0a3" font-size="18" font-family="Arial, sans-serif">© 2026 Tommy Burke / Asymmetric Precision</text>
    <text x="${width - 52}" y="${height - 28}" fill="#8e887e" font-size="16" font-family="Arial, sans-serif" text-anchor="end">Generated from the AP Atlas export surface</text>
  </g>
</svg>`;
}

function buildExportProjection(state, scope) {
  if (scope === 'full') {
    const nodes = [...state.nodes];
    const edges = [...state.edges];
    const relatedIds = connectedIds(state.selectedId, state.edges);
    const { positions, clusters } = layoutFullBlueprint(nodes, state);
    return { nodes, edges, positions, relatedIds, clusters, view: { projection: 'full-blueprint' } };
  }
  if (state.lastProjection?.nodes?.length && state.lastProjection?.positions) {
    return state.lastProjection;
  }
  return null;
}

function layoutFullBlueprint(nodes, state) {
  const positions = new Map();
  const clusters = [];
  const typeGroups = new Map();
  nodes.forEach((node) => {
    const key = node.type || 'node';
    if (!typeGroups.has(key)) typeGroups.set(key, []);
    typeGroups.get(key).push(node);
  });
  const frames = {
    core: { x: 41, y: 36, w: 18, h: 12, label: 'Core' },
    concept: { x: 4, y: 6, w: 20, h: 14, label: 'Concepts' },
    principle: { x: 4, y: 24, w: 22, h: 27, label: 'Principles' },
    philosophy: { x: 34, y: 22, w: 12, h: 10, label: 'Philosophy' },
    oath: { x: 34, y: 50, w: 12, h: 9, label: 'Oath' },
    'visual-language': { x: 48, y: 14, w: 18, h: 10, label: 'Visual Language' },
    system: { x: 48, y: 28, w: 18, h: 10, label: 'Systems' },
    application: { x: 48, y: 50, w: 18, h: 10, label: 'Applications' },
    medium: { x: 68, y: 6, w: 24, h: 12, label: 'Media Layers' },
    book: { x: 28, y: 2, w: 36, h: 12, label: 'Books' },
    essay: { x: 71, y: 22, w: 25, h: 52, label: 'Essays' },
    framework: { x: 6, y: 56, w: 20, h: 18, label: 'Frameworks' },
    laboratory: { x: 28, y: 72, w: 40, h: 18, label: 'Laboratories' },
    'field-note': { x: 70, y: 76, w: 24, h: 14, label: 'Field Notes' },
    page: { x: 48, y: 62, w: 16, h: 8, label: 'Pages' }
  };
  Object.entries(frames).forEach(([type, frame]) => {
    const items = [...(typeGroups.get(type) || [])].sort((a, b) => a.label.localeCompare(b.label));
    if (!items.length) return;
    const cols = Math.max(1, Math.ceil(Math.sqrt(items.length * (frame.w / Math.max(frame.h, 1)))));
    const rows = Math.max(1, Math.ceil(items.length / cols));
    const stepX = frame.w / (cols + 1);
    const stepY = frame.h / (rows + 1);
    items.forEach((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const jitter = ((index % 2) ? 0.28 : -0.28);
      positions.set(node.id, {
        x: clamp(frame.x + stepX * (col + 1) + jitter, frame.x + 1.6, frame.x + frame.w - 1.6),
        y: clamp(frame.y + stepY * (row + 1), frame.y + 1.7, frame.y + frame.h - 1.7),
        role: type
      });
    });
    clusters.push({ ...frame, type, count: items.length });
  });
  if (!positions.has(state.selectedId) && nodes.find((n) => n.id === state.selectedId)) {
    positions.set(state.selectedId, { x: 50, y: 42, role: 'focus' });
  }
  return { positions, clusters };
}

function buildClusterRects(projection, width, headerHeight, mapHeight) {
  const toX = (value) => 80 + (value / 100) * (width - 160);
  const toY = (value) => headerHeight + 36 + (value / 100) * (mapHeight - 72);
  return (projection.clusters || []).map((cluster) => {
    const x = toX(cluster.x) - 14;
    const y = toY(cluster.y) - 14;
    const w = (cluster.w / 100) * (width - 160) + 28;
    const h = (cluster.h / 100) * (mapHeight - 72) + 28;
    return `<g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="28" fill="rgba(255,255,255,0.015)" stroke="rgba(200,164,93,0.16)" stroke-dasharray="8 8"/>
      <text x="${x + 18}" y="${y + 28}" fill="#c8a45d" font-size="16" font-family="Arial, sans-serif" letter-spacing="3">${escapeHtml(String(cluster.label || cluster.type || '').toUpperCase())}</text>
    </g>`;
  }).join('');
}

function exportNodeDimensions(node, active, fullSystem) {
  if (node.type === 'core') return { width: 250, height: 84, wrap: 18, maxLines: 3, fontSize: 26 };
  if (active) return { width: fullSystem ? 220 : 260, height: fullSystem ? 78 : 84, wrap: fullSystem ? 16 : 18, maxLines: 3, fontSize: fullSystem ? 18 : 24 };
  return { width: fullSystem ? 168 : 210, height: fullSystem ? 62 : 68, wrap: fullSystem ? 14 : 18, maxLines: 3, fontSize: fullSystem ? 14 : 18 };
}

function buildConnectionAppendix(state, projection, scope) {
  const current = state.byId.get(state.selectedId) || projection.nodes[0];
  if (!current) return { lines: ['No focused node selected.'], more: '' };
  const all = state.edges
    .filter((edge) => edge.from === current.id || edge.to === current.id)
    .map((edge) => relationshipStatement(edge, current.id, state.byId));
  const limit = scope === 'full' ? 14 : 12;
  return {
    lines: all.slice(0, limit).map((line, index) => `${index + 1}. ${line}`),
    more: all.length > limit ? `${all.length - limit} additional connection statements are available in the interactive Atlas.` : ''
  };
}

function relationshipStatement(edge, currentId, byId) {
  const current = byId.get(currentId);
  const otherId = edge.from === currentId ? edge.to : edge.from;
  const other = byId.get(otherId);
  if (!current || !other) return 'Relationship unavailable.';
  const phrase = edge.from === currentId ? relationshipPhrase(edge.relationship) : inversePhrase(edge.relationship);
  return `${nodeName(current)} ${phrase} ${other.label} (${other.type} / ${other.domain}).`;
}

function buildGrid(width, mapHeight, offsetY = 0) {
  const vertical = Array.from({ length: Math.ceil(width / 40) + 1 }, (_, i) => {
    const x = i * 40;
    return `<path d="M ${x} ${offsetY} V ${mapHeight}" stroke="rgba(200,164,93,0.08)" stroke-width="1"/>`;
  }).join('');
  const horizontal = Array.from({ length: Math.ceil((mapHeight - offsetY) / 40) + 1 }, (_, i) => {
    const y = offsetY + i * 40;
    return `<path d="M 0 ${y} H ${width}" stroke="rgba(200,164,93,0.08)" stroke-width="1"/>`;
  }).join('');
  return `<g>${vertical}${horizontal}</g>`;
}

async function svgToPngBlob(svg, fallbackWidth = 2200, fallbackHeight = null) {
  return new Promise((resolve) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      const width = image.naturalWidth || fallbackWidth;
      const height = image.naturalHeight || fallbackHeight || Math.round(width * 0.75);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0b0c0d';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      canvas.toBlob((pngBlob) => {
        URL.revokeObjectURL(url);
        resolve(pngBlob || null);
      }, 'image/png');
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    image.src = url;
  });
}
function wrapText(text, maxLength) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : ['Atlas Node'];
}

function slugify(value) {
  return String(value || 'atlas').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'atlas';
}


function renderFailure(root, error) {
  root.dataset.apAtlasStableInitializing = 'false';
  root.dataset.apAtlasError = 'true';
  const message = error?.message || String(error || 'Unknown Atlas error.');
  const map = root.querySelector('[data-ap-atlas-map]');
  const list = root.querySelector('[data-ap-atlas-list]');
  const detail = root.querySelector('[data-ap-atlas-detail]');
  if (map) map.innerHTML = '<div class="ap-atlas-empty">Atlas signal interrupted, but the page remains usable.</div>';
  if (list) list.innerHTML = '<p class="ap-muted">The Atlas data could not be projected.</p>';
  if (detail) detail.innerHTML = `<h2>Atlas signal interrupted</h2><p>The Atlas failed soft instead of locking the page.</p><p class="ap-muted">${escapeHtml(message)}</p>`;
  console.warn('[AP Atlas Stability Core]', error);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
