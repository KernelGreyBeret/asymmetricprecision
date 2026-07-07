const AP_PAGE_MAP = {
  "start-here": "Start Here",
  "journeys": "Journeys",
  "philosophy": "Philosophy",
  "atlas": "Atlas",
  "learning": "Learning",
  "books": "Books",
  "essays": "Essays",
  "frameworks": "Frameworks",
  "field-notes": "Field Notes",
  "laboratories": "Laboratories",
  "about": "About",
  "contact": "Contact"
};

function normalizePath(pathname) {
  return pathname.replace(/\/index\.html$/, "/").replace(/\/+$|^\/+$/g, "");
}

export function initializeIntegrationLayer() {
  document.documentElement.dataset.apIntegrated = "true";

  const nav = document.querySelector("[data-ap-nav], .site-nav");
  if (nav) {
    const current = normalizePath(window.location.pathname);
    nav.querySelectorAll("a[href]").forEach((link) => {
      const target = normalizePath(new URL(link.getAttribute("href"), window.location.href).pathname);
      if (target === current) {
        link.setAttribute("aria-current", "page");
        link.classList.add("is-active");
      }
    });
  }

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    const rel = new Set((link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
    rel.add("noopener");
    rel.add("noreferrer");
    link.setAttribute("rel", Array.from(rel).join(" "));
  });

  const pageId = document.body?.dataset?.apPage;
  if (pageId && AP_PAGE_MAP[pageId]) {
    document.body.dataset.apPageName = AP_PAGE_MAP[pageId];
  }
}
