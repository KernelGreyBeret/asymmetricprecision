
export function initializeContentSurfaces() {
  document.querySelectorAll("[data-ap-content]").forEach((root) => {
    renderContentSurface(root);
  });
}

async function renderContentSurface(root) {
  const source = root.dataset.apContent || "../assets/data/ap-content.json";
  const kind = root.dataset.apContentType || "";
  const featuredOnly = root.dataset.apFeatured === "true";
  const limit = Number(root.dataset.apLimit || 0);

  try {
    const response = await fetch(source);
    const data = await response.json();
    let items = data.items || [];
    if (kind) items = items.filter((item) => item.type === kind);
    if (featuredOnly) items = items.filter((item) => String(item.status || "").toLowerCase().includes("featured"));

    root.innerHTML = buildShell(items, { kind, limit });
    wireControls(root, items, { limit });
  } catch (error) {
    root.innerHTML = `<div class="ap-empty-state">Content metadata could not be loaded. Check the AP content data path.</div>`;
  }
}

function buildShell(items, options) {
  const domains = unique(items.map((item) => item.domain));
  const paths = unique(items.map((item) => item.path));
  const shouldFilter = items.length > 6;
  const toolbar = shouldFilter ? `
    <div class="ap-content-toolbar">
      <label>Search
        <input type="search" data-ap-content-search placeholder="Find ideas, domains, paths..." />
      </label>
      <label>Domain
        <select data-ap-content-domain>
          <option value="">All domains</option>
          ${domains.map((domain) => `<option value="${escapeHtml(domain)}">${escapeHtml(domain)}</option>`).join("")}
        </select>
      </label>
      <label>Path
        <select data-ap-content-path>
          <option value="">All paths</option>
          ${paths.map((path) => `<option value="${escapeHtml(path)}">${escapeHtml(path)}</option>`).join("")}
        </select>
      </label>
      <button type="button" class="button secondary" data-ap-content-clear>Reset</button>
    </div>` : "";

  return `
    ${toolbar}
    <div class="ap-content-grid" data-ap-content-grid></div>
  `;
}

function wireControls(root, items, options) {
  const grid = root.querySelector("[data-ap-content-grid]");
  const search = root.querySelector("[data-ap-content-search]");
  const domain = root.querySelector("[data-ap-content-domain]");
  const path = root.querySelector("[data-ap-content-path]");
  const clear = root.querySelector("[data-ap-content-clear]");

  const render = () => {
    let visible = filterItems(items, {
      query: (search?.value || "").trim().toLowerCase(),
      domain: domain?.value || "",
      path: path?.value || ""
    });
    if (options.limit && visible.length > options.limit) visible = visible.slice(0, options.limit);
    grid.innerHTML = visible.length ? visible.map(renderCard).join("") : `<div class="ap-empty-state">No content matches this view. Widen the filter or reset the surface.</div>`;
  };

  [search, domain, path].forEach((control) => {
    control?.addEventListener("input", render);
    control?.addEventListener("change", render);
  });
  clear?.addEventListener("click", () => {
    if (search) search.value = "";
    if (domain) domain.value = "";
    if (path) path.value = "";
    render();
  });
  render();
}

function filterItems(items, state) {
  return items.filter((item) => {
    const matchesDomain = !state.domain || item.domain === state.domain;
    const matchesPath = !state.path || item.path === state.path;
    const haystack = [item.title, item.type, item.status, item.domain, item.path, item.summary, ...(item.connections || [])]
      .join(" ")
      .toLowerCase();
    const matchesQuery = !state.query || haystack.includes(state.query);
    return matchesDomain && matchesPath && matchesQuery;
  });
}

function renderCard(item) {
  const difficulty = item.difficulty ? `${"■".repeat(item.difficulty)}${"□".repeat(Math.max(0, 5 - item.difficulty))}` : "";
  const connectionPreview = (item.connections || []).slice(0, 3).map(cleanConnection).join(" · ");
  const href = item.url || "#";
  const external = href.startsWith("http") ? " target=\"_blank\" rel=\"noopener\"" : "";
  return `<a class="ap-content-card" href="${escapeHtml(href)}" data-ap-path="${escapeHtml(item.path || item.type)}"${external}>
    <p class="card-label">${escapeHtml(item.type)} · ${escapeHtml(item.domain || "AP")}</p>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.summary || "")}</p>
    <div class="ap-content-meta">
      ${item.status ? `<span class="ap-content-pill is-status">${escapeHtml(item.status)}</span>` : ""}
      ${item.path ? `<span class="ap-content-pill">${escapeHtml(item.path)}</span>` : ""}
      ${difficulty ? `<span class="ap-content-pill" title="Conceptual difficulty">${difficulty}</span>` : ""}
    </div>
    ${connectionPreview ? `<div class="ap-connection-preview">Connections: ${escapeHtml(connectionPreview)}</div>` : ""}
  </a>`;
}

function cleanConnection(value) {
  return String(value || "")
    .replace(/^principle-/, "")
    .replace(/^concept-/, "")
    .replace(/^essay-/, "")
    .replace(/^framework-/, "")
    .replace(/-/g, " ");
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
