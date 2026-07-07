/*
  AP Polish Layer
  Coherence behaviors that make AP feel like one system without adding backend dependency.
*/

export function initializePolishLayer() {
  document.body.classList.add("ap-js-ready");
  normalizeNavToggle();
  closeMobileNavAfterSelection();
  markLoadingSurfaces();
}

function normalizeNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (!toggle || !nav) return;
  toggle.setAttribute("aria-expanded", nav.classList.contains("is-open") ? "true" : "false");
  toggle.setAttribute("aria-controls", "ap-primary-navigation");
  nav.id = nav.id || "ap-primary-navigation";
}

function closeMobileNavAfterSelection() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (!toggle || !nav) return;

  nav.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  });
}

function markLoadingSurfaces() {
  document.querySelectorAll("[data-ap-loading]").forEach((surface) => {
    surface.classList.add("ap-loading-state");
  });
}
