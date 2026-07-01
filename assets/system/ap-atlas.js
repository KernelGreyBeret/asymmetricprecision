export function initializeAtlasPreview() {
  document.querySelectorAll(".atlas-map .node").forEach((node) => {
    node.setAttribute("tabindex", "0");
    node.setAttribute("role", "button");
    node.setAttribute("aria-label", `Atlas node: ${node.textContent.trim()}`);
  });

  const atlasRoot = document.querySelector("[data-ap-atlas]");
  if (atlasRoot) {
    renderAtlas(atlasRoot);
  }
}

async function renderAtlas(root) {
  const map = root.querySelector("[data-ap-atlas-map]");
  const list = root.querySelector("[data-ap-atlas-list]");
  const detail = root.querySelector("[data-ap-atlas-detail]");
  if (!map || !list || !detail) return;

  try {
    const response = await fetch(root.dataset.apAtlas || "../assets/data/ap-atlas.json");
    const atlas = await response.json();
    const nodes = atlas.nodes || [];
    const edges = atlas.edges || [];
    const byId = new Map(nodes.map((node) => [node.id, node]));

    map.innerHTML = nodes.map((node, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(nodes.length, 1);
      const radius = node.type === "core" ? 0 : 38;
      const x = node.type === "core" ? 50 : 50 + Math.cos(angle) * radius;
      const y = node.type === "core" ? 50 : 50 + Math.sin(angle) * radius;
      return `<button class="ap-atlas-node ap-atlas-node-${node.type}" style="left:${x}%;top:${y}%" data-node-id="${node.id}">${node.label}</button>`;
    }).join("");

    list.innerHTML = nodes.map((node) => `<button class="ap-atlas-list-item" data-node-id="${node.id}"><strong>${node.label}</strong><span>${node.type} · ${node.domain}</span></button>`).join("");

    const showNode = (id) => {
      const node = byId.get(id) || nodes[0];
      const connections = edges
        .filter((edge) => edge.from === node.id || edge.to === node.id)
        .map((edge) => {
          const otherId = edge.from === node.id ? edge.to : edge.from;
          const other = byId.get(otherId);
          return other ? `<li><span>${edge.relationship}</span> <strong>${other.label}</strong></li>` : "";
        })
        .join("");

      detail.innerHTML = `
        <p class="section-label">${node.type} · ${node.domain}</p>
        <h2>${node.label}</h2>
        <p>${node.summary}</p>
        <h3>Connections</h3>
        <ul class="ap-connection-list">${connections || "<li>No connections defined yet.</li>"}</ul>
      `;

      root.querySelectorAll("[data-node-id]").forEach((el) => el.classList.toggle("is-active", el.dataset.nodeId === node.id));
    };

    root.addEventListener("click", (event) => {
      const target = event.target.closest("[data-node-id]");
      if (target) showNode(target.dataset.nodeId);
    });

    showNode("ap");
  } catch (error) {
    detail.innerHTML = "<p>The Atlas data could not be loaded locally. Check the data path when deployed.</p>";
  }
}
