/* AP Framework Experience
   Principle: A framework is not a document. A framework is an operating model. */

(function () {
  const grid = document.querySelector('#framework-grid');
  if (!grid) return;

  const domainFilter = document.querySelector('#framework-domain-filter');
  const searchInput = document.querySelector('#framework-search');

  const basePath = window.location.pathname.includes('/frameworks/') ? '../' : '';

  async function loadFrameworks() {
    try {
      const response = await fetch(`${basePath}assets/data/ap-frameworks.json`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Framework data failed: ${response.status}`);
      const data = await response.json();
      return data.frameworks || [];
    } catch (error) {
      grid.innerHTML = `<article class="ap-framework-loading"><strong>Framework data unavailable.</strong><p>${error.message}</p></article>`;
      return [];
    }
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function collectDomains(frameworks) {
    const domains = new Set();
    frameworks.forEach(framework => (framework.domains || []).forEach(domain => domains.add(domain)));
    return Array.from(domains).sort();
  }

  function renderDomainOptions(frameworks) {
    if (!domainFilter) return;
    const domains = collectDomains(frameworks);
    domainFilter.innerHTML = '<option value="all">All domains</option>' + domains.map(domain => `<option value="${domain}">${domain}</option>`).join('');
  }

  function frameworkMatches(framework) {
    const selectedDomain = domainFilter ? domainFilter.value : 'all';
    const query = searchInput ? normalize(searchInput.value) : '';

    const domainMatch = selectedDomain === 'all' || (framework.domains || []).includes(selectedDomain);
    const haystack = normalize([
      framework.title,
      framework.summary,
      framework.problem,
      framework.model,
      ...(framework.domains || []),
      ...(framework.application || []),
      ...(framework.evidenceQuestions || [])
    ].join(' '));

    return domainMatch && (!query || haystack.includes(query));
  }

  function renderFramework(framework) {
    const domains = (framework.domains || []).map(domain => `<span>${domain}</span>`).join('');
    const steps = (framework.application || []).map(step => `<li>${step}</li>`).join('');
    const evidence = (framework.evidenceQuestions || []).map(question => `<li>${question}</li>`).join('');
    const connections = (framework.connections || []).map(connection => `<span>${connection}</span>`).join('');

    return `
      <article class="ap-framework-card" data-framework-id="${framework.id}">
        <span class="ap-framework-status">${framework.status || 'draft'} · ${framework.type || 'model'}</span>
        <h2>${framework.title}</h2>
        <p>${framework.summary}</p>
        <div class="ap-framework-domains">${domains}</div>
        <div class="ap-framework-problem">
          <h3>Problem</h3>
          <p>${framework.problem}</p>
        </div>
        <div class="ap-framework-model">
          <h3>Model</h3>
          <p>${framework.model}</p>
        </div>
        <div>
          <h3>Apply It</h3>
          <ol>${steps}</ol>
        </div>
        <div>
          <h3>Evidence Questions</h3>
          <ul>${evidence}</ul>
        </div>
        <div>
          <h3>Connections</h3>
          <div class="ap-framework-connections">${connections}</div>
        </div>
      </article>
    `;
  }

  function render(frameworks) {
    const filtered = frameworks.filter(frameworkMatches);
    if (!filtered.length) {
      grid.innerHTML = '<article class="ap-framework-loading">No frameworks matched that view.</article>';
      return;
    }
    grid.innerHTML = filtered.map(renderFramework).join('');
  }

  loadFrameworks().then(frameworks => {
    renderDomainOptions(frameworks);
    render(frameworks);
    domainFilter && domainFilter.addEventListener('change', () => render(frameworks));
    searchInput && searchInput.addEventListener('input', () => render(frameworks));
  });
})();
