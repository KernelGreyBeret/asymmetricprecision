export function initializeAtlasPreview() {
  document.querySelectorAll(".atlas-map .node").forEach((node) => {
    node.setAttribute("tabindex", "0");
    node.setAttribute("role", "button");
    node.setAttribute("aria-label", `Atlas node: ${node.textContent.trim()}`);
  });

  document.querySelectorAll("[data-ap-atlas]").forEach((atlasRoot) => {
    renderAtlasExplorer(atlasRoot);
  });
}

async function renderAtlasExplorer(root) {
  const map = root.querySelector("[data-ap-atlas-map]");
  const list = root.querySelector("[data-ap-atlas-list]");
  const detail = root.querySelector("[data-ap-atlas-detail]");
  const trail = root.querySelector("[data-ap-atlas-trail]");
  const search = root.querySelector("[data-ap-atlas-search]");
  const typeFilter = root.querySelector("[data-ap-atlas-type]");
  const domainFilter = root.querySelector("[data-ap-atlas-domain]");
  const clear = root.querySelector("[data-ap-atlas-clear]");

  if (!map || !list || !detail) return;

  try {
    const response = await fetch(root.dataset.apAtlas || "../assets/data/ap-atlas.json");
    const atlas = await response.json();
    const nodes = atlas.nodes || [];
    const edges = atlas.edges || [];
    const byId = new Map(nodes.map((node) => [node.id, node]));
    let selectedId = nodes[0]?.id || null;
    const selectedTrail = [];

    fillSelect(typeFilter, "All types", unique(nodes.map((node) => node.type)));
    fillSelect(domainFilter, "All domains", unique(nodes.map((node) => node.domain)));

    const state = () => ({
      query: (search?.value || "").trim().toLowerCase(),
      type: typeFilter?.value || "",
      domain: domainFilter?.value || ""
    });

    const getVisibleNodes = () => {
      const current = state();
      return nodes.filter((node) => {
        const matchesType = !current.type || node.type === current.type;
        const matchesDomain = !current.domain || node.domain === current.domain;
        const searchable = [node.label, node.type, node.domain, node.summary]
          .join(" ")
          .toLowerCase();
        const connectedEdges = edges.filter((edge) => edge.from === node.id || edge.to === node.id);
        const relationshipText = connectedEdges.map((edge) => edge.relationship).join(" ").toLowerCase();
        const matchesQuery = !current.query || searchable.includes(current.query) || relationshipText.includes(current.query);
        return matchesType && matchesDomain && matchesQuery;
      });
    };

    const render = () => {
      const visible = getVisibleNodes();
      const visibleIds = new Set(visible.map((node) => node.id));
      const visibleEdges = edges.filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to));
      const positions = calculatePositions(visible);
      const selectedConnections = getConnectedIds(selectedId, edges);

      renderList(list, visible, selectedId, selectedConnections);
      renderMap(map, visible, visibleEdges, positions, selectedId, selectedConnections);

      if (!visibleIds.has(selectedId) && visible.length) {
        selectedId = visible[0].id;
      }

      renderDetail(detail, byId, edges, selectedId);
      renderTrail(trail, selectedTrail, byId);
    };

    const selectNode = (id) => {
      if (!byId.has(id)) return;
      selectedId = id;
      selectedTrail.push(id);
      while (selectedTrail.length > 7) selectedTrail.shift();
      render();
    };

    root.addEventListener("click", (event) => {
      const target = event.target.closest("[data-node-id]");
      if (target) selectNode(target.dataset.nodeId);

      const next = event.target.closest("[data-ap-follow-connection]");
      if (next) selectNode(next.dataset.apFollowConnection);

      const reflection = event.target.closest("[data-ap-atlas-reflection]");
      if (reflection) {
        const output = root.querySelector("[data-ap-atlas-reflection-output]");
        const value = reflection.dataset.apAtlasReflection;
        if (output) {
          output.textContent = reflectionResponse(value);
        }
        recordLocalReflection(selectedId, value);
      }
    });

    [search, typeFilter, domainFilter].forEach((control) => {
      control?.addEventListener("input", render);
      control?.addEventListener("change", render);
    });

    clear?.addEventListener("click", () => {
      if (search) search.value = "";
      if (typeFilter) typeFilter.value = "";
      if (domainFilter) domainFilter.value = "";
      selectedId = "ap";
      selectedTrail.length = 0;
      render();
    });

    selectNode("ap");
  } catch (error) {
    detail.innerHTML = "<p>The Atlas data could not be loaded locally. Check the data path when deployed.</p>";
  }
}

function fillSelect(select, label, values) {
  if (!select) return;
  select.innerHTML = [`<option value="">${label}</option>`, ...values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)].join("");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function calculatePositions(nodes) {
  const positions = new Map();
  const core = nodes.find((node) => node.type === "core") || nodes[0];
  if (core) positions.set(core.id, { x: 50, y: 50 });

  const orbit = nodes.filter((node) => node.id !== core?.id);
  orbit.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(orbit.length, 1) - Math.PI / 2;
    const radius = 38;
    positions.set(node.id, {
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius
    });
  });
  return positions;
}

function getConnectedIds(id, edges) {
  const ids = new Set();
  edges.forEach((edge) => {
    if (edge.from === id) ids.add(edge.to);
    if (edge.to === id) ids.add(edge.from);
  });
  return ids;
}

function renderList(list, nodes, selectedId, selectedConnections) {
  if (!nodes.length) {
    list.innerHTML = `<p class="ap-muted">No nodes match this view. Reset the Atlas or widen the filter.</p>`;
    return;
  }

  list.innerHTML = nodes.map((node) => {
    const active = node.id === selectedId ? " is-active" : "";
    const related = selectedConnections.has(node.id) ? " is-related" : "";
    return `<button class="ap-atlas-list-item${active}${related}" data-node-id="${node.id}">
      <strong>${escapeHtml(node.label)}</strong>
      <span>${escapeHtml(node.type)} · ${escapeHtml(node.domain)}</span>
    </button>`;
  }).join("");
}

function renderMap(map, nodes, edges, positions, selectedId, selectedConnections) {
  if (!nodes.length) {
    map.innerHTML = `<div class="ap-atlas-empty">No visible nodes.</div>`;
    return;
  }

  const lineLayer = `<svg class="ap-atlas-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    ${edges.map((edge) => {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      if (!from || !to) return "";
      const active = edge.from === selectedId || edge.to === selectedId ? " is-active" : "";
      return `<line class="ap-atlas-edge${active}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" />`;
    }).join("")}
  </svg>`;

  const nodeLayer = nodes.map((node) => {
    const position = positions.get(node.id) || { x: 50, y: 50 };
    const active = node.id === selectedId ? " is-active" : "";
    const related = selectedConnections.has(node.id) ? " is-related" : "";
    return `<button class="ap-atlas-node ap-atlas-node-${node.type}${active}${related}" style="left:${position.x}%;top:${position.y}%" data-node-id="${node.id}">
      <span>${escapeHtml(node.label)}</span>
      <small>${escapeHtml(node.type)}</small>
    </button>`;
  }).join("");

  map.innerHTML = `${lineLayer}${nodeLayer}`;
}

function renderDetail(detail, byId, edges, id) {
  const node = byId.get(id) || byId.values().next().value;
  if (!node) return;

  const connections = edges
    .filter((edge) => edge.from === node.id || edge.to === node.id)
    .map((edge) => {
      const outbound = edge.from === node.id;
      const otherId = outbound ? edge.to : edge.from;
      const other = byId.get(otherId);
      if (!other) return "";
      const direction = outbound ? edge.relationship : `is ${edge.relationship} by`;
      return `<li>
        <button type="button" data-ap-follow-connection="${other.id}">
          <span>${escapeHtml(direction)}</span>
          <strong>${escapeHtml(other.label)}</strong>
        </button>
      </li>`;
    })
    .join("");

  const localStats = readLocalReflection(node.id);
  const url = node.url ? `<p><a class="ap-action ap-action-secondary" href="${escapeHtml(node.url)}">Open related page</a></p>` : "";

  detail.innerHTML = `
    <p class="section-label">${escapeHtml(node.type)} · ${escapeHtml(node.domain)}</p>
    <h2>${escapeHtml(node.label)}</h2>
    <p>${escapeHtml(node.summary)}</p>
    ${url}
    <h3>Connections</h3>
    <ul class="ap-connection-list ap-connection-actions">${connections || "<li>No connections defined yet.</li>"}</ul>
    <div class="ap-atlas-reflection" aria-live="polite">
      <h3>Understanding Checkpoint</h3>
      <p>Did this connection help you see the system more clearly?</p>
      <div class="ap-reflection-actions">
        <button type="button" data-ap-atlas-reflection="clearer">Yes</button>
        <button type="button" data-ap-atlas-reflection="thinking">Still thinking</button>
        <button type="button" data-ap-atlas-reflection="unclear">Not yet</button>
      </div>
      <p class="ap-learning-response" data-ap-atlas-reflection-output>${localStats}</p>
    </div>
  `;
}

function renderTrail(trail, selectedTrail, byId) {
  if (!trail) return;
  if (!selectedTrail.length) {
    trail.innerHTML = `<p><strong>Understanding Trail:</strong> Select nodes to trace your path through the system.</p>`;
    return;
  }

  const visibleTrail = selectedTrail
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((node) => `<span>${escapeHtml(node.label)}</span>`)
    .join(`<span class="ap-trail-arrow">→</span>`);

  trail.innerHTML = `<p><strong>Understanding Trail:</strong></p><div>${visibleTrail}</div>`;
}

function reflectionResponse(value) {
  switch (value) {
    case "clearer":
      return "Signal recorded locally: this relationship increased clarity.";
    case "thinking":
      return "Good. Some systems need time. Follow another connection and let the model sharpen.";
    case "unclear":
      return "Useful signal. This path needs a better explanation, stronger connection, or clearer diagram.";
    default:
      return "Reflection recorded locally.";
  }
}

function recordLocalReflection(nodeId, value) {
  try {
    const key = "ap-atlas-reflections";
    const current = JSON.parse(localStorage.getItem(key) || "{}");
    current[nodeId] = current[nodeId] || { clearer: 0, thinking: 0, unclear: 0 };
    current[nodeId][value] = (current[nodeId][value] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(current));
  } catch (_) {
    // Local reflection is optional. AP keeps working without storage.
  }
}

function readLocalReflection(nodeId) {
  try {
    const current = JSON.parse(localStorage.getItem("ap-atlas-reflections") || "{}");
    const stats = current[nodeId];
    if (!stats) return "Reflection is local to this browser. No backend. No tracking. Just signal.";
    return `Local reflection: ${stats.clearer || 0} clearer · ${stats.thinking || 0} still thinking · ${stats.unclear || 0} not yet.`;
  } catch (_) {
    return "Reflection is local to this browser. No backend. No tracking. Just signal.";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
