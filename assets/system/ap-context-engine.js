/* AP Context Engine
   Principle: a system should remember why you are there. */

const JOURNEY_KEY = "ap.activeJourney";
const JOURNEY_DATA_URL = new URL("../data/ap-journeys.json", import.meta.url);

export function initializeAPContextEngine() {
  bootContext().catch((error) => console.warn("[AP Context] Context engine could not initialize", error));
}

async function bootContext() {
  const data = await fetchJson(JOURNEY_DATA_URL);
  const journeys = data.journeys || [];
  const params = new URLSearchParams(window.location.search);
  const fromUrl = readContextFromUrl(params);
  if (fromUrl) writeJourneyContext(fromUrl);

  let context = fromUrl || readJourneyContext();
  if (!context?.journeyId) return;

  const journey = journeys.find((item) => item.id === context.journeyId);
  if (!journey) return;

  context = resolveContextStep(context, journey);
  writeJourneyContext(context);
  renderJourneyContext(journey, context);
  refineConnectionsForJourney(journey, context);
  preserveJourneyOnLocalLinks(journey, context);
}

function readContextFromUrl(params) {
  const journeyId = params.get("journey");
  if (!journeyId) return null;
  const step = Number(params.get("step") || 0);
  return {
    journeyId,
    stepIndex: Number.isFinite(step) && step > 0 ? step - 1 : 0,
    source: "url",
    updatedAt: Date.now()
  };
}

function resolveContextStep(context, journey) {
  const current = normalizePath(window.location.pathname);
  const matchedIndex = (journey.steps || []).findIndex((step) => sameDestination(step.url, current));
  const stepIndex = matchedIndex >= 0 ? matchedIndex : Math.max(0, Math.min(Number(context.stepIndex || 0), (journey.steps || []).length - 1));
  return { ...context, stepIndex, updatedAt: Date.now() };
}

function renderJourneyContext(journey, context) {
  const hero = document.querySelector(".page-hero, .hero");
  if (!hero || document.querySelector("[data-ap-active-journey]")) return;

  const steps = journey.steps || [];
  const current = steps[context.stepIndex] || steps[0];
  const next = steps[context.stepIndex + 1];
  const previous = steps[context.stepIndex - 1];

  hero.insertAdjacentHTML("afterend", `
    <section class="ap-journey-context" data-ap-active-journey="${escapeHtml(journey.id)}">
      <div>
        <p class="section-label">Active Journey</p>
        <h2>${escapeHtml(journey.title)}</h2>
        <p>${escapeHtml(journey.question || journey.summary || "Continue through this AP path.")}</p>
      </div>
      <div class="ap-journey-context-steps">
        <p><strong>Current step:</strong> ${escapeHtml(current?.title || "Current surface")}</p>
        <div class="ap-journey-context-actions">
          ${previous ? `<a class="ap-action ap-action-secondary" href="${escapeHtml(withJourney(previous.url, journey.id, context.stepIndex))}">Previous: ${escapeHtml(previous.title)}</a>` : ""}
          ${next ? `<a class="ap-action primary" href="${escapeHtml(withJourney(next.url, journey.id, context.stepIndex + 2))}">Next: ${escapeHtml(next.title)}</a>` : `<a class="ap-action primary" href="${relativeToRoot("learning/index.html")}">Reflect on the journey</a>`}
          <a class="ap-action ap-action-secondary" href="${relativeToRoot("atlas/index.html")}?journey=${encodeURIComponent(journey.id)}">View this path in the Atlas</a>
        </div>
      </div>
    </section>
  `);
}

function refineConnectionsForJourney(journey, context) {
  const surface = document.querySelector(".ap-connection-surface");
  if (!surface) return;
  const steps = journey.steps || [];
  const current = steps[context.stepIndex] || steps[0];
  const next = steps[context.stepIndex + 1];
  const label = surface.querySelector(".section-label");
  const h2 = surface.querySelector("h2");
  const p = surface.querySelector("p:not(.section-label)");
  const grid = surface.querySelector(".ap-connection-grid");

  surface.classList.add("ap-connection-surface--journey");
  if (label) label.textContent = "Journey Continuation";
  if (h2) h2.textContent = next ? `Continue ${journey.title}.` : `Complete ${journey.title}.`;
  if (p) p.textContent = next
    ? `You reached this page through a guided AP path. The next surface is ${next.title}.`
    : "You reached the end of this guided path. Close the loop with reflection or explore the Atlas around this journey.";
  if (grid) {
    grid.innerHTML = `
      ${next ? connectionCard(withJourney(next.url, journey.id, context.stepIndex + 2), `Next: ${next.title}`, next.label || "Continue the route.") : connectionCard(relativeToRoot("learning/index.html"), "Reflect", "Record what became clearer.")}
      ${connectionCard(`${relativeToRoot("atlas/index.html")}?journey=${encodeURIComponent(journey.id)}`, "View Journey in Atlas", "See the path as a relationship surface.")}
      ${connectionCard(relativeToRoot("journeys/index.html"), "All Journeys", "Choose a different route if your question changed.")}
    `;
  }
}

function preserveJourneyOnLocalLinks(journey, context) {
  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("http") || href.includes("journey=")) return;
    const stepIndex = (journey.steps || []).findIndex((step) => sameDestination(step.url, normalizePath(new URL(href, window.location.href).pathname)));
    if (stepIndex >= 0) link.setAttribute("href", withJourney(href, journey.id, stepIndex + 1));
  });
}

export function withJourney(url, journeyId, stepNumber = 1) {
  const absolute = new URL(url, window.location.href);
  absolute.searchParams.set("journey", journeyId);
  absolute.searchParams.set("step", String(stepNumber));
  return absolute.pathname + absolute.search + absolute.hash;
}

function writeJourneyContext(context) {
  try { sessionStorage.setItem(JOURNEY_KEY, JSON.stringify(context)); } catch (_) {}
}

function readJourneyContext() {
  try { return JSON.parse(sessionStorage.getItem(JOURNEY_KEY) || "null"); } catch (_) { return null; }
}

function sameDestination(url, pathname) {
  if (!url) return false;
  return normalizePath(new URL(url, window.location.href).pathname) === normalizePath(pathname);
}

function normalizePath(pathname) {
  return String(pathname || "").replace(/\/index\.html$/, "/").replace(/\/+$/, "/");
}

function relativeToRoot(path) {
  const depth = window.location.pathname.split("/").filter(Boolean).length - 1;
  const prefix = depth > 0 ? "../".repeat(depth) : "";
  return `${prefix}${path}`;
}

function connectionCard(href, title, body) {
  return `<a class="ap-connection-card" href="${escapeHtml(href)}"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span></a>`;
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
