/*
  AP Essay Experience
  An essay is not a post. An essay is a lens.
*/

const difficultyLabel = (value = 1) => {
  const n = Math.max(1, Math.min(5, Number(value) || 1));
  return `${"■".repeat(n)}${"□".repeat(5 - n)}`;
};

const normalize = (value = "") => String(value).toLowerCase().trim();

function essayCard(item) {
  const url = item.url || "#";
  return `
    <article class="ap-essay-lens-card" data-ap-essay-id="${item.id}" data-ap-domain="${item.domain}">
      <div class="ap-essay-meta-row">
        <span class="ap-essay-pill">${item.domain || "Domain"}</span>
        <span class="ap-essay-pill">${item.status || "Published"}</span>
        <span class="ap-essay-pill">${item.readingMode || "Lens"}</span>
      </div>
      <h3>${item.title}</h3>
      <p class="ap-essay-lens">${item.lens || "A lens for understanding a difficult system."}</p>
      <p class="ap-essay-question"><strong>Question:</strong> ${item.centralQuestion || "What does this help us see?"}</p>
      <p class="ap-essay-summary">${item.summary || ""}</p>
      <div class="ap-essay-actions">
        <a href="${url}">Read as lens</a>
        <span class="ap-essay-difficulty" title="Difficulty">${difficultyLabel(item.difficulty)}</span>
      </div>
    </article>
  `;
}

function buildToolbar(surface, items) {
  const domains = [...new Set(items.map((item) => item.domain).filter(Boolean))].sort();
  const toolbar = document.createElement("section");
  toolbar.className = "ap-essay-toolbar";
  toolbar.setAttribute("aria-label", "Essay exploration controls");
  toolbar.innerHTML = `
    <input type="search" data-ap-essay-search placeholder="Search essays, domains, questions, or lenses" aria-label="Search essays" />
    <select data-ap-essay-domain aria-label="Filter essays by domain">
      <option value="">All domains</option>
      ${domains.map((domain) => `<option value="${domain}">${domain}</option>`).join("")}
    </select>
    <select data-ap-essay-difficulty aria-label="Filter essays by difficulty">
      <option value="">All difficulty</option>
      <option value="2">Accessible</option>
      <option value="3">Intermediate</option>
      <option value="4">Advanced</option>
    </select>
  `;
  surface.parentNode.insertBefore(toolbar, surface);
  return toolbar;
}

function render(surface, items, state = {}) {
  const q = normalize(state.query);
  const domain = state.domain || "";
  const difficulty = Number(state.difficulty || 0);
  const filtered = items.filter((item) => {
    const haystack = normalize([item.title, item.domain, item.summary, item.lens, item.centralQuestion, (item.connections || []).join(" ")].join(" "));
    const matchesQuery = !q || haystack.includes(q);
    const matchesDomain = !domain || item.domain === domain;
    const matchesDifficulty = !difficulty || Number(item.difficulty || 1) <= difficulty;
    return matchesQuery && matchesDomain && matchesDifficulty;
  });
  surface.innerHTML = filtered.length
    ? filtered.map(essayCard).join("")
    : `<div class="ap-essay-empty">No essay lenses match that exploration path yet.</div>`;
}

async function hydrateEssayIndex(surface) {
  const src = surface.getAttribute("data-ap-essays") || "../assets/data/ap-essays.json";
  try {
    const response = await fetch(src);
    const data = await response.json();
    const items = data.items || [];
    const toolbar = buildToolbar(surface, items);
    const state = { query: "", domain: "", difficulty: "" };
    const update = () => render(surface, items, state);
    toolbar.querySelector("[data-ap-essay-search]").addEventListener("input", (event) => {
      state.query = event.target.value;
      update();
    });
    toolbar.querySelector("[data-ap-essay-domain]").addEventListener("change", (event) => {
      state.domain = event.target.value;
      update();
    });
    toolbar.querySelector("[data-ap-essay-difficulty]").addEventListener("change", (event) => {
      state.difficulty = event.target.value;
      update();
    });
    update();
  } catch (error) {
    surface.innerHTML = `<div class="ap-essay-empty">Essay lenses could not load. The system should fail visibly, not silently.</div>`;
    console.warn("AP Essay surface failed to load", error);
  }
}

async function hydrateEssayMetadata(surface) {
  const essayId = surface.getAttribute("data-ap-essay-metadata");
  const src = surface.getAttribute("data-ap-essays-src") || "../assets/data/ap-essays.json";
  if (!essayId) return;
  try {
    const response = await fetch(src);
    const data = await response.json();
    const item = (data.items || []).find((entry) => entry.id === essayId);
    if (!item) return;
    surface.innerHTML = `
      <p class="section-label">Lens Metadata</p>
      <h2>${item.title}</h2>
      <p>${item.lens}</p>
      <div class="ap-essay-metadata-grid">
        <div><span>Domain</span><strong>${item.domain}</strong></div>
        <div><span>Path</span><strong>${item.path}</strong></div>
        <div><span>Difficulty</span><strong>${difficultyLabel(item.difficulty)}</strong></div>
        <div><span>Central Question</span><strong>${item.centralQuestion}</strong></div>
      </div>
    `;
  } catch (error) {
    console.warn("AP Essay metadata failed to load", error);
  }
}

export function initializeEssayExperience() {
  document.querySelectorAll("[data-ap-essays]").forEach(hydrateEssayIndex);
  document.querySelectorAll("[data-ap-essay-metadata]").forEach(hydrateEssayMetadata);
}
