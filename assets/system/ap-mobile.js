// AP Mobile Hardening
// Principle: navigation should reduce cognitive load on constrained screens.
(function () {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');

  if (!toggle || !nav) return;

  const closeNav = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  const openNav = () => {
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
  };

  toggle.setAttribute('aria-expanded', nav.classList.contains('is-open') ? 'true' : 'false');
  toggle.setAttribute('aria-controls', nav.id || 'ap-site-nav');
  if (!nav.id) nav.id = 'ap-site-nav';

  toggle.addEventListener('click', () => {
    nav.classList.contains('is-open') ? closeNav() : openNav();
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeNav();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNav();
  });
})();
