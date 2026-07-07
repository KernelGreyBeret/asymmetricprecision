/* AP Atlas Maturity Pass
   Principle: the Atlas should orient the learner before it expands the map.
*/

export function initializeAtlasMaturity() {
  const roots = document.querySelectorAll('[data-ap-atlas]');
  roots.forEach((root) => matureAtlas(root));

  document.addEventListener('ap:system-initialized', () => {
    document.querySelectorAll('[data-ap-atlas]').forEach((root) => matureAtlas(root));
  }, { once: true });
}

function matureAtlas(root) {
  if (!root || root.dataset.apAtlasMatured === 'true') return;
  root.dataset.apAtlasMatured = 'true';

  installOrientation(root);
  installObserver(root);
  refreshAtlasMaturity(root);

  root.addEventListener('click', (event) => {
    const action = event.target.closest('[data-ap-atlas-maturity-action]');
    if (!action) return;
    const projection = action.dataset.apAtlasMaturityAction;
    const projectionSelect = root.querySelector('[data-ap-atlas-projection]');
    if (projectionSelect && projection) {
      projectionSelect.value = projection;
      projectionSelect.dispatchEvent(new Event('change', { bubbles: true }));
      projectionSelect.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
}

function installOrientation(root) {
  if (root.querySelector('[data-ap-atlas-orientation]')) return;
  const interfaceRoot = root.querySelector('.ap-atlas-interface') || root.querySelector('[data-ap-atlas-map]') || root.firstElementChild;
  const panel = document.createElement('section');
  panel.className = 'ap-atlas-orientation';
  panel.dataset.apAtlasOrientation = '';
  panel.setAttribute('aria-live', 'polite');
  panel.innerHTML = `
    <div>
      <strong>Atlas Orientation</strong>
      <p data-ap-atlas-orientation-copy>The Atlas is reading the current projection.</p>
    </div>
    <div class="ap-atlas-orientation-actions" aria-label="Atlas projection shortcuts">
      <button type="button" data-ap-atlas-maturity-action="neighborhood">Focus the neighborhood</button>
      <button type="button" data-ap-atlas-maturity-action="domain">Show the domain</button>
      <button type="button" data-ap-atlas-maturity-action="system">Return to system</button>
    </div>
  `;
  root.insertBefore(panel, interfaceRoot || root.firstChild);
}

function installObserver(root) {
  const map = root.querySelector('[data-ap-atlas-map]');
  const detail = root.querySelector('[data-ap-atlas-detail]');
  const target = map || detail || root;
  const observer = new MutationObserver(() => refreshAtlasMaturity(root));
  observer.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-projection', 'data-density', 'data-labels'] });
}

function refreshAtlasMaturity(root) {
  const map = root.querySelector('[data-ap-atlas-map]');
  const selected = map?.querySelector('.ap-atlas-node.is-active');
  const selectedLabel = selected?.querySelector('span')?.textContent?.trim() || selected?.textContent?.trim()?.replace(/You are here/i, '').trim() || 'the selected node';
  const projection = map?.dataset.projection || root.querySelector('[data-ap-atlas-projection]')?.value || 'system';
  const density = map?.dataset.density || root.querySelector('[data-ap-atlas-density]')?.value || 'balanced';
  const visibleNodes = map?.querySelectorAll('.ap-atlas-node').length || 0;
  const visibleEdges = map?.querySelectorAll('.ap-atlas-edge').length || 0;

  updateOrientation(root, { selectedLabel, projection, density, visibleNodes, visibleEdges });
  updateCompass(root, map);
  markSelectedNode(selected);
  improveDetailLanguage(root, { selectedLabel, projection, density, visibleNodes, visibleEdges });
}

function updateOrientation(root, state) {
  const copy = root.querySelector('[data-ap-atlas-orientation-copy]');
  if (!copy) return;
  const projectionPhrase = projectionDescription(state.projection);
  copy.innerHTML = `${projectionPhrase} Current focus: <strong>${escapeHtml(state.selectedLabel)}</strong>. Projected view: ${state.visibleNodes} nodes and ${state.visibleEdges} relationships at ${escapeHtml(state.density)} density.`;
}

function updateCompass(root, map) {
  if (!map) return;
  let compass = map.querySelector('[data-ap-atlas-compass]');
  if (!compass) {
    compass = document.createElement('aside');
    compass.className = 'ap-atlas-compass';
    compass.dataset.apAtlasCompass = '';
    compass.setAttribute('aria-label', 'Atlas visual legend');
    compass.innerHTML = `
      <strong>Map Reading</strong>
      <span class="ap-compass-selected"><i></i>Selected focus</span>
      <span class="ap-compass-connected"><i></i>Direct relationship</span>
      <span class="ap-compass-context"><i></i>System context</span>
    `;
    map.appendChild(compass);
  }
}

function markSelectedNode(selected) {
  document.querySelectorAll('.ap-atlas-you-are-here').forEach((marker) => marker.remove());
  if (!selected || selected.querySelector('.ap-atlas-you-are-here')) return;
  const marker = document.createElement('span');
  marker.className = 'ap-atlas-you-are-here';
  marker.textContent = 'You are here';
  selected.appendChild(marker);
}

function improveDetailLanguage(root, state) {
  const detail = root.querySelector('[data-ap-atlas-detail]');
  if (!detail || detail.querySelector('[data-ap-atlas-reading-note]')) return;
  const note = document.createElement('div');
  note.className = 'ap-atlas-reading-note ap-atlas-projection-summary';
  note.dataset.apAtlasReadingNote = '';
  note.innerHTML = `<strong>How to read this view</strong><span>${escapeHtml(readingNote(state.projection))}</span>`;
  const heading = detail.querySelector('h3');
  detail.insertBefore(note, heading || detail.firstChild);
}

function projectionDescription(value) {
  const descriptions = {
    system: 'System Map shows the broad AP knowledge field.',
    neighborhood: 'Focused Neighborhood shows the selected idea and its immediate relationships.',
    domain: 'Domain Cluster shows where the selected idea sits among related concepts.',
    journey: 'Journey Path shows sequence: the route a learner is currently walking.'
  };
  return descriptions[value] || descriptions.system;
}

function readingNote(value) {
  const notes = {
    system: 'Start with regions, then follow relationship lines into the detail panel when a node matters.',
    neighborhood: 'Use this view when you want meaning: it strips away distance and shows direct influence.',
    domain: 'Use this view when you want context: it shows the conceptual territory around the selected idea.',
    journey: 'Use this view when you want sequence: it shows how understanding is meant to move.'
  };
  return notes[value] || notes.system;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
