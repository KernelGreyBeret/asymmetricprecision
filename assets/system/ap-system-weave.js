/* AP System Weave
   Sprint 23 — System Weave
   Principle: connections should appear where they create understanding.

   The weave turns relationships into read-along signals instead of forcing
   every connection to live at the bottom of the page. It is intentionally
   local-first, data-driven, and defensive: if AP data is incomplete, the page
   remains readable.
*/

import { normalizeAtlasEdge, describeRelationship } from "./ap-relationship-grammar.js";

const WEAVE_DATA = {
  content: new URL("../data/ap-content.json", import.meta.url),
  atlas: new URL("../data/ap-atlas.json", import.meta.url),
  essays: new URL("../data/ap-essays.json", import.meta.url),
  books: new URL("../data/ap-books.json", import.meta.url),
  frameworks: new URL("../data/ap-frameworks.json", import.meta.url),
  journeys: new URL("../data/ap-journeys.json", import.meta.url)
};

export function initializeAPSystemWeave() {
  bootSystemWeave().catch((error) => {
    console.warn("[AP System Weave] Could not initialize", error);
  });
}

async function bootSystemWeave() {
  if (document.documentElement.dataset.apSystemWeave === "ready") return;

  const article = document.querySelector(".ap-readable-surface, .ap-essay-body, .ap-content-body, .book-detail-body");
  if (!article) return;

  const [contentData, atlasData, essayData, bookData, frameworkData, journeyData] = await Promise.all([
    fetchJson(WEAVE_DATA.content),
    fetchJson(WEAVE_DATA.atlas),
    fetchJson(WEAVE_DATA.essays),
    fetchJson(WEAVE_DATA.books),
    fetchJson(WEAVE_DATA.frameworks),
    fetchJson(WEAVE_DATA.journeys)
  ]);

  const registries = flattenRegistries(contentData, essayData, bookData, frameworkData);
  const nodes = atlasData.nodes || [];
  const edges = (atlasData.edges || []).map(normalizeAtlasEdge).filter(Boolean);
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const current = resolveCurrent(registries, nodes);
  if (!current) return;

  const weave = buildWeaveModel({ current, nodeMap, edges, journeys: journeyData.journeys || [] });
  if (!weave.signals.length && !weave.journeyMatches.length) return;

  document.body.dataset.apWeaveNode = current.id;
  renderWeaveRail(article, weave);
  placeReadAlongSignals(article, weave);
  markAtlasLinks(current);
  document.documentElement.dataset.apSystemWeave = "ready";
  document.dispatchEvent(new CustomEvent("ap:system-weave-ready", { detail: { current, weave } }));
}

function flattenRegistries(contentData, essayData, bookData, frameworkData) {
  const books = (bookData.books || []).map((book) => ({ ...book, type: "book", title: book.title || book.label }));
  const frameworks = (frameworkData.frameworks || []).map((framework) => ({ ...framework, type: "framework", title: framework.title || framework.label }));
  return [
    ...(contentData.items || []),
    ...(essayData.items || []).map((item) => ({ ...item, type: "essay" })),
    ...books,
    ...frameworks
  ];
}

function resolveCurrent(items, nodes) {
  const currentPath = normalizePath(window.location.pathname);
  const pageTitle = normalizeText(document.querySelector("h1")?.textContent || document.title);

  const itemByUrl = items.find((item) => sameUrl(item.url, currentPath));
  if (itemByUrl) return mergeNode(itemByUrl, nodes);

  const nodeByUrl = nodes.find((node) => sameUrl(node.url, currentPath));
  if (nodeByUrl) return normalizeNode(nodeByUrl);

  const itemByTitle = items.find((item) => normalizeText(item.title || item.label) === pageTitle);
  if (itemByTitle) return mergeNode(itemByTitle, nodes);

  const nodeByTitle = nodes.find((node) => normalizeText(node.label || node.title) === pageTitle);
  if (nodeByTitle) return normalizeNode(nodeByTitle);

  return null;
}

function mergeNode(item, nodes) {
  const node = nodes.find((candidate) => candidate.id === item.id) || {};
  return {
    ...node,
    ...item,
    label: item.title || item.label || node.label,
    title: item.title || item.label || node.label,
    summary: item.summary || node.summary,
    connections: unique([...(item.connections || []), ...(node.connections || [])])
  };
}

function normalizeNode(node) {
  return {
    ...node,
    title: node.title || node.label,
    connections: node.connections || []
  };
}

function buildWeaveModel({ current, nodeMap, edges, journeys }) {
  const explicit = (current.connections || [])
    .map((id) => nodeMap.get(id))
    .filter(Boolean);

  const edgeNeighbors = edges
    .filter((edge) => edge.from === current.id || edge.to === current.id)
    .map((edge) => {
      const description = describeRelationship(edge, current.id, nodeMap);
      if (!description) return null;
      return {
        ...description.target,
        relationship: description.relationship,
        relationshipPhrase: description.phrase,
        relationshipSentence: description.sentence
      };
    })
    .filter(Boolean);

  const signals = uniqueById([...explicit, ...edgeNeighbors]);
  const principles = signals.filter((node) => node.type === "principle");
  const frameworks = signals.filter((node) => node.type === "framework");
  const essays = signals.filter((node) => node.type === "essay");
  const books = signals.filter((node) => node.type === "book");
  const labs = signals.filter((node) => ["laboratory", "project", "lab"].includes(node.type));
  const concepts = signals.filter((node) => !["principle", "framework", "essay", "book", "laboratory", "project", "lab"].includes(node.type));

  return {
    current,
    signals,
    principles,
    frameworks,
    essays,
    books,
    labs,
    concepts,
    journeyMatches: resolveJourneyMatches(current, journeys)
  };
}

function resolveJourneyMatches(current, journeys) {
  const currentUrl = normalizeComparableUrl(current.url || window.location.pathname);
  const title = normalizeText(current.title || current.label);
  return journeys
    .map((journey) => {
      const steps = journey.steps || [];
      const stepIndex = steps.findIndex((step) => normalizeComparableUrl(step.url || "") === currentUrl || normalizeText(step.title) === title);
      const connected = (journey.connections || []).includes(current.id) || (current.connections || []).some((id) => (journey.connections || []).includes(id));
      if (stepIndex < 0 && !connected) return null;
      return { journey, stepIndex: Math.max(0, stepIndex) };
    })
    .filter(Boolean)
    .slice(0, 2);
}

function renderWeaveRail(article, weave) {
  if (document.querySelector(".ap-system-weave-rail")) return;

  const topPrinciples = weave.principles.slice(0, 3);
  const nextJourney = nextJourneyStep(weave.journeyMatches[0]);
  const atlasHref = atlasLink({ focus: weave.current.id, projection: "focused", density: "balanced", labels: "active" });

  const rail = document.createElement("aside");
  rail.className = "ap-system-weave-rail";
  rail.setAttribute("aria-label", "System weave for this page");
  rail.innerHTML = `
    <p class="section-label">System Weave</p>
    <h3>What this page is touching</h3>
    ${topPrinciples.length ? `<div class="ap-weave-cluster"><strong>Principles</strong>${topPrinciples.map((node) => signalChip(node)).join("")}</div>` : ""}
    ${weave.frameworks.length ? `<div class="ap-weave-cluster"><strong>Operating Models</strong>${weave.frameworks.slice(0, 2).map((node) => signalChip(node)).join("")}</div>` : ""}
    ${weave.journeyMatches.length ? `<div class="ap-weave-cluster"><strong>Journey Signal</strong>${weave.journeyMatches.map((match) => journeyChip(match, nextJourney)).join("")}</div>` : ""}
    <a class="ap-action ap-action-secondary ap-weave-atlas-link" href="${atlasHref}">Open focused Atlas</a>
  `;

  const layout = article.closest(".ap-readalong-layout");
  if (layout && !layout.querySelector(".ap-system-weave-rail")) {
    layout.appendChild(rail);
    layout.classList.add("ap-readalong-layout--with-weave");
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "ap-weave-layout";
  article.parentNode.insertBefore(wrapper, article);
  wrapper.appendChild(article);
  wrapper.appendChild(rail);
}

function placeReadAlongSignals(article, weave) {
  if (article.dataset.apWeaveSignals === "ready") return;

  const headings = Array.from(article.querySelectorAll("h2, h3")).filter((heading) => !heading.closest(".ap-weave-signal"));
  const paragraphs = Array.from(article.querySelectorAll("p")).filter((p) => p.textContent.trim().length > 80);

  const signals = [
    makeSignal("Principle in play", weave.principles[0], "This is one of the AP ideas operating beneath the surface."),
    makeSignal("Related model", weave.frameworks[0] || weave.concepts[0], "This relationship gives the page a practical operating frame."),
    makeSignal("Atlas projection", weave.current, "See this idea as part of the larger system map.", atlasLink({ focus: weave.current.id, projection: "focused", density: "balanced" }))
  ].filter(Boolean);

  const targets = [headings[0], headings[Math.floor(headings.length / 2)], paragraphs[Math.floor(paragraphs.length * 0.65)]].filter(Boolean);
  signals.slice(0, targets.length).forEach((signal, index) => {
    const target = targets[index];
    if (!target || target.previousElementSibling?.classList?.contains("ap-weave-signal")) return;
    target.insertAdjacentHTML("beforebegin", signal);
  });

  article.dataset.apWeaveSignals = "ready";
}

function makeSignal(label, node, body, explicitHref) {
  if (!node) return "";
  const href = explicitHref || atlasLink({ focus: node.id, projection: "focused", density: "balanced" });
  return `
    <aside class="ap-weave-signal" aria-label="${escapeHtml(label)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(node.label || node.title || "Connected idea")}</strong>
      <p>${escapeHtml(node.relationshipSentence || node.summary || body || "This signal connects the page to the larger AP system.")}</p>
      <a href="${href}">Trace this connection</a>
    </aside>
  `;
}

function markAtlasLinks(current) {
  document.querySelectorAll("a[href*='atlas/index.html']").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (href.includes("focus=") || href.includes("journey=")) return;
    link.href = atlasLink({ focus: current.id, projection: "focused", density: "balanced" });
    link.dataset.apWeaveFocused = "true";
  });
}

function signalChip(node) {
  const label = node.relationshipPhrase || labelCase(node.type || "node");
  const title = node.relationshipSentence || node.summary || "Trace this connection in the Atlas.";
  return `<a class="ap-weave-chip" href="${atlasLink({ focus: node.id, projection: "focused" })}" title="${escapeHtml(title)}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(node.label || node.title)}</strong></a>`;
}

function journeyChip(match, next) {
  const href = next ? stepHref(next, match.journey.id, match.stepIndex + 2) : siteHref("journeys/index.html", { journey: match.journey.id });
  const label = next ? `Next: ${next.title}` : "Open Journey";
  return `<a class="ap-weave-chip" href="${href}"><span>${escapeHtml(match.journey.title)}</span><strong>${escapeHtml(label)}</strong></a>`;
}

function nextJourneyStep(match) {
  if (!match) return null;
  const steps = match.journey.steps || [];
  return steps[match.stepIndex + 1] || null;
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
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });
  return url.pathname + url.search + url.hash;
}

function resolveContentHref(url) {
  if (!url) return siteHref("index.html");
  if (/^https?:\/\//i.test(url)) return url;
  const clean = url.replace(/^\.\.\//, "").replace(/^\.\//, "").replace(/^\//, "");
  return siteHref(clean);
}

function resolveRootRelative(path) {
  const clean = String(path || "").replace(/^\.\.\//, "").replace(/^\.\//, "").replace(/^\//, "");
  const script = document.querySelector('script[src$="/assets/system/ap-system.js"], script[src*="assets/system/ap-system.js"]');
  if (!script) return `/${clean}`;
  const src = new URL(script.getAttribute("src"), window.location.href);
  const marker = "/assets/system/ap-system.js";
  const base = src.pathname.includes(marker) ? src.pathname.slice(0, src.pathname.indexOf(marker) + 1) : "/";
  return `${base}${clean}`.replace(/\/+/g, "/");
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

function sameUrl(candidate, currentPath) {
  if (!candidate) return false;
  return normalizeComparableUrl(candidate) === normalizeComparableUrl(currentPath);
}

function normalizePath(path) {
  return String(path || "").replace(/\\/g, "/");
}

function normalizeComparableUrl(value) {
  const string = String(value || "");
  try {
    const url = new URL(string, window.location.origin);
    return url.pathname.replace(/\/index\.html$/, "/").replace(/\/$/, "").toLowerCase();
  } catch {
    return string.replace(/^\.\.\//, "/").replace(/\/index\.html$/, "").replace(/\/$/, "").toLowerCase();
  }
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function labelCase(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function uniqueById(nodes) {
  const seen = new Set();
  return nodes.filter((node) => {
    if (!node?.id || seen.has(node.id)) return false;
    seen.add(node.id);
    return true;
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
