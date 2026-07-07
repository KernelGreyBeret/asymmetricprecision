export function initializeJourneySurfaces() {
  document.querySelectorAll("[data-ap-journeys]").forEach((root) => renderJourneySurface(root));
}

async function renderJourneySurface(root) {
  const source = root.dataset.apJourneys || "../assets/data/ap-journeys.json";
  const featured = root.dataset.apFeatured === "true";
  const limit = Number(root.dataset.apLimit || 0);

  try {
    const response = await fetch(source);
    const data = await response.json();
    let journeys = data.journeys || [];
    if (featured) journeys = journeys.slice(0, 3);
    root.innerHTML = buildShell(journeys);
    wireJourneyControls(root, journeys, { limit });
  } catch (error) {
    root.innerHTML = `<div class="ap-empty-state">Journey data could not be loaded. Check the AP journey data path.</div>`;
  }
}

function buildShell(journeys) {
  const domains = unique(journeys.flatMap((journey) => journey.domains || []));
  const toolbar = journeys.length > 3 ? `
    <div class="ap-journey-toolbar">
      <label>Explore by signal
        <input type="search" data-ap-journey-search placeholder="leader, architect, Zero Trust, outcomes..." />
      </label>
      <label>Domain
        <select data-ap-journey-domain>
          <option value="">All domains</option>
          ${domains.map((domain) => `<option value="${escapeHtml(domain)}">${escapeHtml(domain)}</option>`).join("")}
        </select>
      </label>
      <button type="button" class="button secondary" data-ap-journey-reset>Reset</button>
    </div>` : "";

  return `
    ${toolbar}
    <div class="ap-journey-grid" data-ap-journey-grid></div>
  `;
}

function wireJourneyControls(root, journeys, options) {
  const grid = root.querySelector("[data-ap-journey-grid]");
  const search = root.querySelector("[data-ap-journey-search]");
  const domain = root.querySelector("[data-ap-journey-domain]");
  const reset = root.querySelector("[data-ap-journey-reset]");

  const render = () => {
    let visible = journeys.filter((journey) => {
      const haystack = [journey.title, journey.signal, journey.question, journey.summary, ...(journey.domains || []), ...(journey.connections || [])].join(" ").toLowerCase();
      const matchesQuery = !search?.value || haystack.includes(search.value.trim().toLowerCase());
      const matchesDomain = !domain?.value || (journey.domains || []).includes(domain.value);
      return matchesQuery && matchesDomain;
    });
    if (options.limit && visible.length > options.limit) visible = visible.slice(0, options.limit);
    grid.innerHTML = visible.length ? visible.map(renderJourney).join("") : `<div class="ap-empty-state">No journeys match this view. Widen the signal or reset the path.</div>`;
  };

  search?.addEventListener("input", render);
  domain?.addEventListener("change", render);
  reset?.addEventListener("click", () => {
    if (search) search.value = "";
    if (domain) domain.value = "";
    render();
  });

  render();
}

function renderJourney(journey) {
  const domains = (journey.domains || []).map((domain) => `<span class="ap-journey-domain">${escapeHtml(domain)}</span>`).join("");
  const steps = (journey.steps || []).map((step, index) => {
    const href = appendJourneyState(step.url || "#", journey.id, index + 1);
    return `
    <li class="ap-route-step">
      <span class="ap-route-index">${index + 1}</span>
      <span class="ap-route-body">
        <span class="ap-route-label">${escapeHtml(step.label || step.type || "Step")}</span>
        <a class="ap-route-title" href="${escapeHtml(href)}">${escapeHtml(step.title || "Continue")}</a>
      </span>
    </li>`;
  }).join("");
  return `
    <article class="ap-journey-card" id="${escapeHtml(journey.id)}">
      <div>
        <p class="card-label">Learning Journey</p>
        <h2>${escapeHtml(journey.title)}</h2>
      </div>
      <p class="ap-journey-signal">${escapeHtml(journey.signal || "")}</p>
      <p class="ap-journey-question">${escapeHtml(journey.question || "")}</p>
      <p class="ap-journey-summary">${escapeHtml(journey.summary || "")}</p>
      <div class="ap-journey-domains">${domains}</div>
      <ol class="ap-route">${steps}</ol>
      <div class="ap-journey-actions">
        <a class="button primary" href="${escapeHtml(appendJourneyState(journey.entry || journey.steps?.[0]?.url || "../start-here/index.html", journey.id, 1))}">Begin this path</a>
        <a class="button secondary" href="../atlas/index.html?journey=${encodeURIComponent(journey.id)}">View in Atlas</a>
      </div>
    </article>`;
}

function appendJourneyState(url, journeyId, stepNumber) {
  try {
    const absolute = new URL(url, window.location.href);
    absolute.searchParams.set("journey", journeyId);
    absolute.searchParams.set("step", String(stepNumber));
    return absolute.pathname + absolute.search + absolute.hash;
  } catch (_) {
    return url;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
