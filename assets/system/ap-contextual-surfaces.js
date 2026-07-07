/* AP Contextual Surfaces
   Principle: context should travel with the learner.

   This layer turns pages into system-aware surfaces:
   - identifies the current content item or Atlas node
   - renders a compact context strip near the top of detail pages
   - places read-along cues around the article body
   - makes Atlas links focus on the current idea
   - makes journey membership visible without forcing a single path
*/

const DATA = {
  content: new URL("../data/ap-content.json", import.meta.url),
  atlas: new URL("../data/ap-atlas.json", import.meta.url),
  journeys: new URL("../data/ap-journeys.json", import.meta.url)
};

export function initializeAPContextualSurfaces() {
  bootContextualSurfaces().catch((error) => {
    console.warn("[AP Contextual Surfaces] Could not initialize", error);
  });
}

async function bootContextualSurfaces() {
  if (document.documentElement.dataset.apContextualSurfaces === "ready") return;

  const [contentData, atlasData, journeyData] = await Promise.all([
    fetchJson(DATA.content),
    fetchJson(DATA.atlas),
    fetchJson(DATA.journeys)
  ]);

  const nodes = atlasData.nodes || [];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const contentItems = contentData.items || [];
  const current = resolveCurrentSurface(contentItems, nodes);

  if (!current) return;

  const connectionNodes = resolveConnectionNodes(current, nodeMap).slice(0, 8);
  const journeyMatches = resolveJourneyMembership(current, journeyData.journeys || []);

  document.body.dataset.apCurrentNode = current.id;
  document.body.dataset.apCurrentType = current.type || "surface";

  renderContextStrip(current, connectionNodes, journeyMatches);
  renderReadAlongCues(current, connectionNodes, journeyMatches);
  refineAtlasLinks(current);
  refineContinueSurface(current, connectionNodes, journeyMatches);

  document.documentElement.dataset.apContextualSurfaces = "ready";
  document.dispatchEvent(new CustomEvent("ap:contextual-surfaces-ready", { detail: { current } }));
}

function resolveCurrentSurface(contentItems, nodes) {
  const currentPath = normalizePath(window.location.pathname);
  const title = normalizeText(document.querySelector("h1")?.textContent || document.title);

  const byContentUrl = contentItems.find((item) => sameUrl(item.url, currentPath));
  if (byContentUrl) return enrichFromNode(byContentUrl, nodes);

  const byNodeUrl = nodes.find((node) => sameUrl(node.url, currentPath));
  if (byNodeUrl) return normalizeNodeAsSurface(byNodeUrl);

  const byContentTitle = contentItems.find((item) => normalizeText(item.title) === title);
  if (byContentTitle) return enrichFromNode(byContentTitle, nodes);

  const byNodeTitle = nodes.find((node) => normalizeText(node.label || node.title) === title);
  if (byNodeTitle) return normalizeNodeAsSurface(byNodeTitle);

  return null;
}

function enrichFromNode(item, nodes) {
  const node = nodes.find((candidate) => candidate.id === item.id) || {};
  return {
    ...node,
    ...item,
    label: item.title || node.label,
    summary: item.summary || node.summary,
    connections: Array.from(new Set([...(item.connections || []), ...(node.connections || [])]))
  };
}

function normalizeNodeAsSurface(node) {
  return {
    ...node,
    title: node.label || node.title,
    connections: node.connections || []
  };
}

function resolveConnectionNodes(current, nodeMap) {
  const direct = (current.connections || [])
    .map((id) => nodeMap.get(id))
    .filter(Boolean);

  /* If explicit connections are sparse, infer first-degree Atlas edges. */
  return uniqueById(direct);
}

function resolveJourneyMembership(current, journeys) {
  const currentId = current.id;
  const currentUrl = normalizeComparableUrl(current.url || window.location.pathname);

  return journeys
    .map((journey) => {
      const steps = journey.steps || [];
      const index = steps.findIndex((step) => {
        return normalizeComparableUrl(step.url || "") === currentUrl || normalizeText(step.title) === normalizeText(current.title || current.label);
      });
      const connected = (journey.connections || []).includes(currentId) || (current.connections || []).some((id) => (journey.connections || []).includes(id));
      if (index < 0 && !connected) return null;
      return { journey, stepIndex: Math.max(0, index) };
    })
    .filter(Boolean)
    .slice(0, 3);
}

function renderContextStrip(current, connectionNodes, journeyMatches) {
  const anchor = document.querySelector(".ap-content-metadata-surface, .page-hero, .hero");
  if (!anchor || document.querySelector(".ap-system-context-strip")) return;

  const principleNodes = connectionNodes.filter((node) => node.type === "principle").slice(0, 3);
  const conceptNodes = connectionNodes.filter((node) => node.type !== "principle").slice(0, 4);
  const atlasHref = atlasLink({ focus: current.id, projection: "focused" });

  const html = `
    <section class="ap-system-context-strip" aria-label="System context for this page">
      <div class="ap-context-strip-main">
        <p class="section-label">System Context</p>
        <h2>${escapeHtml(current.title || current.label || "Current surface")}</h2>
        <p>${escapeHtml(current.summary || "This page is part of the connected AP system.")}</p>
      </div>
      <div class="ap-context-strip-details">
        <span class="ap-context-chip">${escapeHtml(labelCase(current.type || "surface"))}</span>
        ${current.domain ? `<span class="ap-context-chip">${escapeHtml(current.domain)}</span>` : ""}
        ${current.path ? `<span class="ap-context-chip">Path: ${escapeHtml(current.path)}</span>` : ""}
        ${principleNodes.map((node) => `<a class="ap-context-chip ap-context-chip-link" href="${atlasLink({ focus: node.id, projection: "focused" })}">${escapeHtml(node.label)}</a>`).join("")}
      </div>
      <div class="ap-context-strip-actions">
        <a class="ap-action primary" href="${atlasHref}">View this in the Atlas</a>
        ${journeyMatches[0] ? `<a class="ap-action ap-action-secondary" href="${journeyLink(journeyMatches[0])}">Continue ${escapeHtml(journeyMatches[0].journey.title)}</a>` : `<a class="ap-action ap-action-secondary" href="${siteHref("journeys/index.html")}">Find a Journey</a>`}
      </div>
      ${conceptNodes.length ? `<div class="ap-context-related" aria-label="Related AP surfaces">${conceptNodes.map((node) => relatedNode(node)).join("")}</div>` : ""}
    </section>`;

  anchor.insertAdjacentHTML(anchor.matches(".page-hero, .hero") ? "afterend" : "afterend", html);
}

function renderReadAlongCues(current, connectionNodes, journeyMatches) {
  const article = document.querySelector(".ap-readable-surface, .ap-essay-body, .ap-content-body");
  if (!article || document.querySelector(".ap-readalong-panel")) return;

  const principles = connectionNodes.filter((node) => node.type === "principle").slice(0, 3);
  const other = connectionNodes.filter((node) => node.type !== "principle").slice(0, 3);
  const activeJourney = journeyMatches[0];

  const panel = document.createElement("aside");
  panel.className = "ap-readalong-panel";
  panel.setAttribute("aria-label", "Read-along system context");
  panel.innerHTML = `
    <p class="section-label">Read-Along Context</p>
    ${principles.length ? `<div class="ap-readalong-group"><h3>Principles in play</h3>${principles.map(readAlongNode).join("")}</div>` : ""}
    ${other.length ? `<div class="ap-readalong-group"><h3>Connected ideas</h3>${other.map(readAlongNode).join("")}</div>` : ""}
    <div class="ap-readalong-group ap-mini-atlas">
      <h3>Atlas projection</h3>
      <p>This surface is a node in the larger AP map.</p>
      <a class="ap-action ap-action-secondary" href="${atlasLink({ focus: current.id, projection: "focused", density: "balanced" })}">Open focused map</a>
    </div>
    ${activeJourney ? `<div class="ap-readalong-group"><h3>Journey signal</h3><p>You are near <strong>${escapeHtml(activeJourney.journey.title)}</strong>.</p><a class="ap-action ap-action-secondary" href="${journeyLink(activeJourney)}">Resume path</a></div>` : ""}
  `;

  const wrapper = document.createElement("div");
  wrapper.className = "ap-readalong-layout";
  article.parentNode.insertBefore(wrapper, article);
  wrapper.appendChild(article);
  wrapper.appendChild(panel);
}

function refineAtlasLinks(current) {
  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (!href || !href.includes("atlas/index.html")) return;
    if (href.includes("focus=") || href.includes("journey=")) return;
    link.setAttribute("href", atlasLink({ focus: current.id, projection: "focused", density: "balanced" }));
    link.dataset.apContextualized = "atlas-focus";
  });
}

function refineContinueSurface(current, connectionNodes, journeyMatches) {
  const surface = document.querySelector(".ap-connection-surface");
  if (!surface || surface.dataset.apContextualSurface === "ready") return;

  const h2 = surface.querySelector("h2");
  const label = surface.querySelector(".section-label");
  const p = surface.querySelector("p:not(.section-label)");
  const activeJourney = journeyMatches[0];
  const nextJourneyStep = activeJourney ? nextStep(activeJourney) : null;

  surface.classList.add("ap-connection-surface--contextual");
  surface.dataset.apContextualSurface = "ready";

  if (label) label.textContent = activeJourney ? "Continue the Journey" : "Continue the System";
  if (h2) h2.textContent = activeJourney && nextJourneyStep ? `Next: ${nextJourneyStep.title}` : "Do not leave the idea isolated.";
  if (p) p.textContent = activeJourney && nextJourneyStep
    ? `You reached this surface as part of ${activeJourney.journey.title}. Continue to the next step, or open the Atlas around this idea.`
    : "This surface connects to principles, concepts, and other AP resources. Follow the relationships that clarify the system.";

  let grid = surface.querySelector(".ap-connection-grid");
  if (!grid) {
    grid = document.createElement("div");
    grid.className = "ap-connection-grid";
    surface.appendChild(grid);
  }

  const cards = [];
  if (activeJourney && nextJourneyStep) cards.push(connectionCard(stepHref(nextJourneyStep, activeJourney.journey.id, activeJourney.stepIndex + 2), `Next: ${nextJourneyStep.title}`, nextJourneyStep.label || "Continue the guided path."));
  cards.push(connectionCard(atlasLink({ focus: current.id, projection: "focused", density: "balanced" }), "Focused Atlas", "See this idea in its relationship neighborhood."));
  connectionNodes.slice(0, 2).forEach((node) => cards.push(connectionCard(atlasLink({ focus: node.id, projection: "focused" }), node.label, node.summary || node.domain || "Connected AP concept.")));
  grid.innerHTML = cards.join("");
}

function nextStep(match) {
  const steps = match.journey.steps || [];
  return steps[match.stepIndex + 1] || null;
}

function relatedNode(node) {
  return `<a class="ap-context-related-node" href="${atlasLink({ focus: node.id, projection: "focused" })}"><span>${escapeHtml(labelCase(node.type || "node"))}</span><strong>${escapeHtml(node.label)}</strong></a>`;
}

function readAlongNode(node) {
  return `<a class="ap-readalong-node" href="${atlasLink({ focus: node.id, projection: "focused" })}"><span>${escapeHtml(labelCase(node.type || "node"))}</span><strong>${escapeHtml(node.label)}</strong><em>${escapeHtml(node.summary || node.domain || "Connected surface")}</em></a>`;
}

function connectionCard(href, title, body) {
  return `<a class="ap-connection-card" href="${escapeHtml(href)}"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span></a>`;
}

function journeyLink(match) {
  return siteHref("journeys/index.html", { journey: match.journey.id });
}

function stepHref(step, journeyId, stepNumber) {
  const base = resolveContentHref(step.url || "journeys/index.html");
  const url = new URL(base, window.location.origin);
  url.searchParams.set("journey", journeyId);
  url.searchParams.set("step", String(stepNumber));
  return url.pathname + url.search + url.hash;
}

function atlasLink(params) {
  if (window.AP?.paths?.atlasHref) return window.AP.paths.atlasHref(params);
  return siteHref("atlas/index.html", params);
}

function siteHref(path, params = {}) {
  if (window.AP?.paths?.siteHref) return window.AP.paths.siteHref(path, params);
  const url = new URL(resolveRootRelative(path), window.location.origin);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });
  return url.pathname + url.search + url.hash;
}

function resolveContentHref(url) {
  if (!url) return siteHref("index.html");
  if (/^https?:/i.test(url)) return url;
  const clean = String(url).replace(/^\.\.\//, "").replace(/^\.\//, "").replace(/^\//, "");
  return siteHref(clean);
}

function resolveRootRelative(path) {
  const depth = window.location.pathname.split("/").filter(Boolean).length - 1;
  const prefix = depth > 0 ? "../".repeat(depth) : "";
  return `${prefix}${String(path || "").replace(/^\/+/, "")}`;
}

function sameUrl(url, currentPath) {
  if (!url) return false;
  const clean = normalizeComparableUrl(url);
  return currentPath.endsWith(clean) || currentPath.endsWith(clean.replace(/index\.html$/, ""));
}

function normalizeComparableUrl(url) {
  return String(url || "")
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\.\.\//, "")
    .replace(/^\.\//, "")
    .replace(/^\//, "")
    .replace(/\?.*$/, "")
    .replace(/#.*$/, "")
    .replace(/\/index\.html$/, "/")
    .replace(/\/+$/, "/");
}

function normalizePath(pathname) {
  const base = window.AP?.paths?.basePath || document.documentElement.dataset.apBasePath || "/";
  let clean = String(pathname || "");
  if (base !== "/" && clean.startsWith(base)) clean = clean.slice(base.length);
  return clean.replace(/^\//, "").replace(/\/index\.html$/, "/").replace(/\/+$/, "/");
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function labelCase(value) {
  return String(value || "surface").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  return response.json();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
