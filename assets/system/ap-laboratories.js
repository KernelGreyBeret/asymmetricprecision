export function initializeLaboratorySurfaces() {
  document.querySelectorAll("[data-ap-laboratories]").forEach((root) => renderLaboratories(root));
}

async function renderLaboratories(root) {
  const source = root.dataset.apLaboratories || "../assets/data/ap-laboratories.json";
  try {
    const response = await fetch(source);
    const data = await response.json();
    const labs = data.laboratories || [];
    root.innerHTML = buildShell(labs);
    wireControls(root, labs);
  } catch (error) {
    root.innerHTML = `<div class="ap-lab-empty">Laboratory data could not be loaded. Check the AP laboratory data path.</div>`;
  }
}

function buildShell(labs) {
  const domains = unique(labs.map((lab) => lab.domain));
  const types = unique(labs.map((lab) => lab.type));
  return `
    <div class="ap-lab-toolbar">
      <label>Search
        <input type="search" data-ap-lab-search placeholder="Find labs, questions, evidence..." />
      </label>
      <label>Domain
        <select data-ap-lab-domain>
          <option value="">All domains</option>
          ${domains.map((domain) => `<option value="${escapeHtml(domain)}">${escapeHtml(domain)}</option>`).join("")}
        </select>
      </label>
      <label>Type
        <select data-ap-lab-type>
          <option value="">All lab types</option>
          ${types.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("")}
        </select>
      </label>
      <button type="button" class="button secondary" data-ap-lab-clear>Reset</button>
    </div>
    <div class="ap-lab-grid" data-ap-lab-grid></div>
  `;
}

function wireControls(root, labs) {
  const grid = root.querySelector("[data-ap-lab-grid]");
  const search = root.querySelector("[data-ap-lab-search]");
  const domain = root.querySelector("[data-ap-lab-domain]");
  const type = root.querySelector("[data-ap-lab-type]");
  const clear = root.querySelector("[data-ap-lab-clear]");

  const render = () => {
    const state = {
      query: (search?.value || "").trim().toLowerCase(),
      domain: domain?.value || "",
      type: type?.value || ""
    };
    const visible = labs.filter((lab) => matches(lab, state));
    grid.innerHTML = visible.length ? visible.map(renderLab).join("") : `<div class="ap-lab-empty">No laboratories match this view. Widen the filter or reset the surface.</div>`;
  };

  [search, domain, type].forEach((control) => {
    control?.addEventListener("input", render);
    control?.addEventListener("change", render);
  });
  clear?.addEventListener("click", () => {
    if (search) search.value = "";
    if (domain) domain.value = "";
    if (type) type.value = "";
    render();
  });
  render();
}

function matches(lab, state) {
  const haystack = [lab.title, lab.status, lab.type, lab.domain, lab.question, lab.thesis, lab.application, lab.evidence, ...(lab.connections || [])]
    .join(" ")
    .toLowerCase();
  return (!state.query || haystack.includes(state.query)) && (!state.domain || lab.domain === state.domain) && (!state.type || lab.type === state.type);
}

function renderLab(lab) {
  const href = lab.url || "#";
  const external = href.startsWith("http") ? " target=\"_blank\" rel=\"noopener\"" : "";
  return `<article class="ap-lab-card" id="${escapeHtml(lab.id)}">
    <span class="ap-lab-status">${escapeHtml(lab.status || "Active")}</span>
    <div>
      <p class="card-label">${escapeHtml(lab.type || "Laboratory")} · ${escapeHtml(lab.domain || "AP")}</p>
      <h3>${escapeHtml(lab.title)}</h3>
    </div>
    <p class="ap-lab-question">${escapeHtml(lab.question || "What does this laboratory help us understand?")}</p>
    <p><strong>Thesis:</strong> ${escapeHtml(lab.thesis || "")}</p>
    <p><strong>Application:</strong> ${escapeHtml(lab.application || "")}</p>
    <p><strong>Evidence:</strong> ${escapeHtml(lab.evidence || "")}</p>
    <div class="ap-lab-meta">
      ${(lab.connections || []).slice(0, 4).map((connection) => `<span class="ap-lab-pill">${escapeHtml(clean(connection))}</span>`).join("")}
    </div>
    <div class="ap-lab-actions"><a href="${escapeHtml(href)}"${external}>Explore laboratory →</a></div>
  </article>`;
}

function clean(value) {
  return String(value || "")
    .replace(/^principle-/, "")
    .replace(/^concept-/, "")
    .replace(/^journey-/, "")
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
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
