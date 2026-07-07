/* AP Coherence Layer
Principle: coherence is not decoration. It is the removal of accidental contradictions.

This layer intentionally patches presentation-level drift without requiring every page
to be hand-edited at once.
*/

const CANONICAL_NAV = [
  ["Start Here", "start-here/index.html"],
  ["Journeys", "journeys/index.html"],
  ["Philosophy", "philosophy/index.html"],
  ["Atlas", "atlas/index.html"],
  ["Learning", "learning/index.html"],
  ["Books", "books/index.html"],
  ["Essays", "essays/index.html"],
  ["Frameworks", "frameworks/index.html"],
  ["Field Notes", "field-notes/index.html"],
  ["Laboratories", "laboratories/index.html"],
  ["About", "about/index.html"],
  ["Contact", "contact/index.html"]
];

const PAGE_COPY = {
  "": {
    h2: "Continue through the system.",
    p: "AP treats relationships as first-class citizens. Continue through one of the connected surfaces below."
  },
  "about": {
    h2: "The philosophy connects to the work.",
    p: "The About page should orient the worldview, then point to the places where that worldview becomes usable."
  },
  "contact": {
    h2: "Start the right conversation.",
    p: "Conversation should connect to purpose: applied systems thinking, organizational clarity, architecture, learning, or collaboration."
  },
  "essays": {
    h2: "Move from lens to system.",
    p: "Essays reveal patterns. Follow the connections into frameworks, journeys, and the Atlas when you want to apply the idea."
  },
  "books": {
    h2: "Books connect the school of thought into a curriculum.",
    p: "Books are deeper paths through the same system of principles, lenses, frameworks, and observations."
  },
  "frameworks": {
    h2: "Frameworks connect thinking to action.",
    p: "Frameworks turn AP ideas into operating models that can be tested against real constraints."
  },
  "field-notes": {
    h2: "Observations belong in the larger system.",
    p: "Field notes capture signal from lived complexity and connect it back into principles, lenses, and frameworks."
  },
  "laboratories": {
    h2: "Laboratories prove the philosophy in practice.",
    p: "A laboratory is evidence that an idea can survive implementation."
  },
  "journeys": {
    h2: "Journeys connect intent to sequence.",
    p: "Follow a path when you want AP to guide exploration instead of leaving you to browse."
  },
  "learning": {
    h2: "Learning closes the loop.",
    p: "Reflection records whether a surface increased clarity, what remains unsettled, and where to explore next."
  },
  "atlas": {
    h2: "The Atlas is the relationship surface.",
    p: "Use the Atlas when the question is not where something lives, but how the ideas connect."
  },
  "philosophy": {
    h2: "The philosophy explains the system.",
    p: "The principles are not slogans. They are the operating logic behind the entire AP body of work."
  },
  "start-here": {
    h2: "Start with orientation, then follow signal.",
    p: "AP works best when exploration begins with a clear mental model of what the system is trying to do."
  }
};

function repoBasePath() {
  const path = window.location.pathname;
  const markers = CANONICAL_NAV.map(([, href]) => href.split("/")[0]).concat(["projects"]);
  for (const marker of markers) {
    const token = `/${marker}/`;
    const index = path.indexOf(token);
    if (index >= 0) return path.slice(0, index + 1);
  }
  return path.replace(/[^/]*$/, "");
}

function currentSection() {
  const path = window.location.pathname;
  const markers = CANONICAL_NAV.map(([, href]) => href.split("/")[0]);
  for (const marker of markers) {
    if (path.includes(`/${marker}/`)) return marker;
  }
  return "";
}

function normalize(pathname) {
  return pathname.replace(/\/index\.html$/, "/").replace(/\/+$/, "") || "/";
}

function normalizeNavigation() {
  const nav = document.querySelector(".site-nav");
  if (!nav) return;

  const base = repoBasePath();
  nav.setAttribute("data-ap-nav", "canonical");
  nav.innerHTML = CANONICAL_NAV.map(([label, href]) => {
    const url = `${base}${href}`;
    return `<a href="${url}">${label}</a>`;
  }).join("");

  const current = normalize(window.location.pathname);
  nav.querySelectorAll("a[href]").forEach((link) => {
    const target = normalize(new URL(link.getAttribute("href"), window.location.href).pathname);
    if (target === current) {
      link.setAttribute("aria-current", "page");
      link.classList.add("is-active");
    }
  });
}

function refineConnectionSurfaces() {
  const section = currentSection();
  const copy = PAGE_COPY[section] || PAGE_COPY[""];
  document.querySelectorAll(".ap-connection-surface").forEach((surface) => {
    surface.classList.add("ap-connection-surface--refined");

    const label = surface.querySelector(".section-label");
    if (label) label.textContent = "Continue";

    const h2 = surface.querySelector("h2");
    if (h2) h2.textContent = copy.h2;

    const p = surface.querySelector("p:not(.section-label)");
    if (p) p.textContent = copy.p;

    if (section === "about" || section === "contact") {
      surface.classList.add("ap-connection-surface--supporting");
    }
  });
}

function normalizeFooter() {
  document.querySelectorAll(".site-footer .footer-description").forEach((node) => {
    node.textContent = "Asymmetric Precision™ is a school of applied systems thinking focused on helping people understand complex systems, make better decisions, and improve organizations with precision.";
  });
}

function repairProjectsLinks() {
  document.querySelectorAll('a[href*="/projects/"], a[href^="projects/"], a[href="../projects/index.html"]').forEach((link) => {
    const href = link.getAttribute("href") || "";
    link.setAttribute("href", href.replace("/projects/", "/laboratories/").replace("projects/", "laboratories/").replace("../projects/", "../laboratories/"));
    if (link.textContent.trim() === "Projects") link.textContent = "Laboratories";
  });
}

function markHydrationFailures() {
  document.querySelectorAll("[data-ap-essays], [data-ap-content], [data-ap-frameworks], [data-ap-journeys], [data-ap-laboratories], [data-ap-atlas]").forEach((surface) => {
    if (!surface.textContent.trim()) {
      surface.classList.add("ap-awaiting-hydration");
    }
  });

  document.addEventListener("ap:system-initialized", () => {
    setTimeout(() => {
      document.querySelectorAll(".ap-awaiting-hydration").forEach((surface) => {
        if (surface.textContent.trim()) {
          surface.classList.remove("ap-awaiting-hydration");
        }
      });
    }, 250);
  }, { once: true });
}

export function initializeAPCoherence() {
  normalizeNavigation();
  repairProjectsLinks();
  refineConnectionSurfaces();
  normalizeFooter();
  markHydrationFailures();
}
