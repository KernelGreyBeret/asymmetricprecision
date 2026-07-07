/* AP Applied Guides
Sprint 34 — Applied Guides Integration
Principle: Applied guides turn builder knowledge into repeatable operating paths.
*/

const APPLIED_GUIDES_PATH = '../assets/data/ap-applied-guides.json';

function escapeHTML(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function siteRelative(path) {
  if (!path) return '#';
  if (/^(https?:|mailto:)/i.test(path)) return path;
  const depth = window.location.pathname.split('/').filter(Boolean).length;
  const prefix = depth > 1 ? '../' : '';
  return path.replace(/^\.\.\//, prefix).replace(/^\.\//, prefix);
}

async function loadAppliedGuides() {
  const response = await fetch(siteRelative(APPLIED_GUIDES_PATH), { cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to load AP applied guides data.');
  return response.json();
}

function guideCard(guide) {
  const domains = (guide.domains || []).slice(0, 6).map((domain) => `<span>${escapeHTML(domain)}</span>`).join('');
  const actions = (guide.actions || []).map((action, index) => {
    const kind = index === 0 ? 'primary' : 'secondary';
    const href = siteRelative(action.url);
    const externalAttrs = /^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a class="button ${kind}" href="${escapeHTML(href)}"${externalAttrs}>${escapeHTML(action.label)}</a>`;
  }).join('');

  return `
    <article class="ap-guide-card" data-ap-guide-id="${escapeHTML(guide.id)}">
      <header>
        <div>
          <span class="ap-guide-stage">${escapeHTML(guide.stage)}</span>
          <h3>${escapeHTML(guide.title)}</h3>
        </div>
        <span class="ap-guide-status">${escapeHTML(guide.status)}</span>
      </header>
      <p>${escapeHTML(guide.summary)}</p>
      <p class="ap-guide-question"><strong>System question:</strong> ${escapeHTML(guide.systemQuestion)}</p>
      <p><strong>Reader outcome:</strong> ${escapeHTML(guide.readerOutcome)}</p>
      ${guide.availabilityNote ? `<p class="ap-guide-availability-note"><strong>Availability:</strong> ${escapeHTML(guide.availabilityNote)}</p>` : ''}
      <div class="ap-guide-domain-row">${domains}</div>
      <div class="ap-guide-actions">${actions}</div>
    </article>
  `;
}

function renderAppliedGuidesOnBooks(data) {
  const bookGrid = document.getElementById('book-grid');
  if (!bookGrid || document.querySelector('.ap-applied-guides-surface')) return;
  const guides = data.guides || [];
  if (!guides.length) return;

  const section = document.createElement('section');
  section.className = 'ap-applied-guides-surface';
  section.id = 'applied-guides';
  section.innerHTML = `
    <div class="ap-applied-guides-header">
      <div>
        <p class="section-label">Applied Systems Guides</p>
        <h2>Published guides for builders turning systems into working products.</h2>
        <p>These are practical AP-adjacent guides: not the core curriculum sequence, but operating paths for people applying systems thinking to real builder problems.</p>
      </div>
      <a class="button secondary" href="../atlas/index.html?focus=book-turning-code-into-cash">View in Atlas</a>
    </div>
    <div class="ap-guide-grid">${guides.map(guideCard).join('')}</div>
  `;
  bookGrid.insertAdjacentElement('afterend', section);
}

function renderBuilderJourneyNudge(data) {
  const journeysSurface = document.querySelector('.ap-journey-surface');
  if (!journeysSurface || document.querySelector('.ap-builder-journey-card')) return;
  const guide = (data.guides || [])[0];
  if (!guide) return;

  const card = document.createElement('aside');
  card.className = 'ap-builder-journey-card';
  card.innerHTML = `
    <p class="section-label">Builder Path</p>
    <h3>For builders turning useful software into viable products.</h3>
    <p>You built something. The next system is commercialization: licensing, packaging, distribution, support, updates, and promotion. The published guide is available now; the AP companion path around it can grow over time.</p>
    <a class="button secondary" href="${escapeHTML(siteRelative(guide.url))}">Open ${escapeHTML(guide.title)}</a>
  `;
  journeysSurface.insertAdjacentElement('afterend', card);
}

function enhanceGuideDetailPage(data) {
  const page = document.querySelector('[data-ap-guide="turning-code-into-cash"]');
  if (!page || document.querySelector('.ap-applied-guide-callout')) return;
  const guide = (data.guides || []).find((item) => item.id === 'book-turning-code-into-cash');
  if (!guide) return;
  const target = page.querySelector('.ap-content-metadata-surface') || page.querySelector('.page-hero');
  const callout = document.createElement('section');
  callout.className = 'ap-applied-guide-callout';
  const purchaseUrl = guide.purchaseUrl || 'https://amzn.to/4fjjAEa';
  callout.innerHTML = `
    <p class="section-label">Applied Systems Guide</p>
    <h2>Software commercialization as an operating model.</h2>
    <p>This guide belongs in AP because it treats licensing, packaging, intellectual property, distribution, payments, support, updates, and promotion as one connected system around useful software.</p>
    <div class="ap-guide-actions">
      <a class="button primary" href="${escapeHTML(purchaseUrl)}" target="_blank" rel="noopener noreferrer">Buy on Amazon</a>
      <a class="button secondary" href="../atlas/index.html?focus=book-turning-code-into-cash">View in Atlas</a>
      <a class="button secondary" href="mailto:tommy@asymmetricprecision.com?subject=The%20Ultimate%20Guide%20for%20Turning%20Code%20into%20Cash">Ask about the book</a>
    </div>
  `;
  target?.insertAdjacentElement('afterend', callout);
}

export async function initializeAppliedGuides() {
  try {
    const data = await loadAppliedGuides();
    window.APSystem = window.APSystem || {};
    window.APSystem.appliedGuides = data;
    renderAppliedGuidesOnBooks(data);
    renderBuilderJourneyNudge(data);
    enhanceGuideDetailPage(data);
  } catch (error) {
    console.warn('[AP Applied Guides] Surface did not initialize.', error);
  }
}

export function initializeAppliedGuideSurfaces() {
  initializeAppliedGuides();
}
