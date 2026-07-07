// AP Accessibility Hardening
// Principle: every interactive system should expose its state clearly.
(function () {
  document.documentElement.classList.add('ap-js-ready');

  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main-content';

  if (main && !document.querySelector('.skip-link')) {
    const skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#main-content';
    skip.textContent = 'Skip to main content';
    document.body.prepend(skip);
  }

  const currentPath = window.location.pathname.replace(/index\.html$/, '');
  document.querySelectorAll('.site-nav a[href]').forEach((link) => {
    const href = new URL(link.getAttribute('href'), window.location.href).pathname.replace(/index\.html$/, '');
    if (href === currentPath) {
      link.setAttribute('aria-current', 'page');
      link.classList.add('is-active');
    }
  });

  document.querySelectorAll('[data-ap-live]').forEach((node) => {
    if (!node.getAttribute('role')) node.setAttribute('role', 'status');
    if (!node.getAttribute('aria-live')) node.setAttribute('aria-live', 'polite');
  });

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    const label = link.getAttribute('aria-label') || link.textContent.trim();
    if (!/opens in a new tab/i.test(label)) {
      link.setAttribute('aria-label', `${label} — opens in a new tab`);
    }
    const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
    rel.add('noopener');
    rel.add('noreferrer');
    link.setAttribute('rel', Array.from(rel).join(' '));
  });
})();
