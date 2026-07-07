/*
  AP Hidden Systems Visual Language Polish
  Adds non-invasive system annotations and HSVL page affordances.
*/
(function () {
  const root = document.documentElement;
  const body = document.body;

  function enableHSVL() {
    body.classList.add('ap-hsvl-active');
    root.dataset.apVisualLanguage = 'hsvl';
  }

  function annotateCards() {
    const candidates = document.querySelectorAll('.card, .list-item, .ap-panel, .ap-node');
    candidates.forEach((node, index) => {
      if (node.hasAttribute('data-ap-signal')) return;
      const label = node.querySelector('.card-label, .section-label, .eyebrow');
      if (!label) return;
      const signal = label.textContent.trim().replace(/\s+/g, '-').toUpperCase();
      if (signal) node.setAttribute('data-ap-signal', `SIGNAL-${String(index + 1).padStart(2, '0')} · ${signal}`);
    });
  }

  function markExternalEvidence() {
    document.querySelectorAll('a[href^="http"]').forEach((link) => {
      if (link.closest('.site-nav, .site-header, .site-footer')) return;
      link.dataset.apConnection = link.dataset.apConnection || 'external-evidence';
    });
  }

  function init() {
    enableHSVL();
    annotateCards();
    markExternalEvidence();
    document.dispatchEvent(new CustomEvent('ap:hsvl-ready', {
      detail: { layer: 'hidden-systems-visual-language', sprint: 13 }
    }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
