/* AP Paths
   Principle: a system must know where it is before it can guide anyone else.

   GitHub Pages project previews live under /<repo>/ while the production domain
   lives at /. AP must generate internal links that work in both environments.
*/

const AP_PATHS_MARKER = "/assets/system/";
const modulePath = new URL(import.meta.url).pathname;
const basePath = deriveBasePath(modulePath);

export function initializeAPPathResolver() {
  exposePathHelpers();
  rewriteDocumentLinks();
  observeFutureLinks();
}

export function apBasePath() {
  return basePath;
}

export function apSitePath(path = "") {
  const clean = String(path || "").replace(/^\/+/, "");
  return joinPath(basePath, clean);
}

export function apSiteHref(path = "", params = {}) {
  const url = new URL(apSitePath(path), window.location.origin);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.pathname + url.search + url.hash;
}

export function apAtlasHref(options = {}) {
  return apSiteHref("atlas/index.html", options);
}

export function apNormalizeInternalHref(rawHref) {
  if (!shouldConsiderHref(rawHref)) return rawHref;

  let url;
  try {
    url = new URL(rawHref, window.location.href);
  } catch {
    return rawHref;
  }

  if (url.origin !== window.location.origin) return rawHref;
  if (basePath === "/") return url.pathname + url.search + url.hash;

  if (url.pathname === basePath.slice(0, -1) || url.pathname.startsWith(basePath)) {
    return url.pathname + url.search + url.hash;
  }

  const corrected = new URL(joinPath(basePath, url.pathname.replace(/^\/+/, "")), window.location.origin);
  corrected.search = url.search;
  corrected.hash = url.hash;
  return corrected.pathname + corrected.search + corrected.hash;
}

function rewriteDocumentLinks(root = document) {
  root.querySelectorAll?.("a[href]").forEach(rewriteLink);
}

function rewriteLink(link) {
  const href = link.getAttribute("href");
  const corrected = apNormalizeInternalHref(href);
  if (corrected && corrected !== href) {
    link.setAttribute("href", corrected);
    link.dataset.apPathResolved = "true";
  }
}

function observeFutureLinks() {
  if (!document.body || !window.MutationObserver) return;
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches?.("a[href]")) rewriteLink(node);
        rewriteDocumentLinks(node);
      });

      if (mutation.type === "attributes" && mutation.target?.matches?.("a[href]")) {
        rewriteLink(mutation.target);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href"]
  });

  window.AP.pathObserver = observer;
}

function exposePathHelpers() {
  window.AP = window.AP || {};
  window.AP.paths = {
    basePath,
    sitePath: apSitePath,
    siteHref: apSiteHref,
    atlasHref: apAtlasHref,
    normalizeInternalHref: apNormalizeInternalHref,
    rewriteDocumentLinks
  };
  document.documentElement.dataset.apBasePath = basePath;
}

function deriveBasePath(pathname) {
  const index = pathname.indexOf(AP_PATHS_MARKER);
  if (index < 0) return "/";
  const base = pathname.slice(0, index);
  return base ? `${base.replace(/\/+$/, "")}/` : "/";
}

function joinPath(base, path) {
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = String(path || "").replace(/^\/+/, "");
  return `${normalizedBase}${normalizedPath}`.replace(/\/+/g, "/");
}

function shouldConsiderHref(href) {
  if (!href) return false;
  const value = String(href).trim();
  if (!value || value.startsWith("#")) return false;
  if (/^(mailto:|tel:|sms:|javascript:|data:|blob:)/i.test(value)) return false;
  return true;
}
