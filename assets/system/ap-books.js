/* AP Books System
   Principle: A book is not a product. A book is a curriculum path. */
(function () {
  const DATA_PATH = '../assets/data/ap-books.json';

  function escapeHTML(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function difficulty(value) {
    const count = Number(value || 0);
    return '■'.repeat(Math.max(0, Math.min(count, 5))) + '□'.repeat(Math.max(0, 5 - Math.min(count, 5)));
  }

  async function loadBooks() {
    const response = await fetch(DATA_PATH, { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to load AP book curriculum data.');
    return response.json();
  }

  function populateFilters(data) {
    const stageFilter = document.getElementById('book-stage-filter');
    const domainFilter = document.getElementById('book-domain-filter');
    if (!stageFilter || !domainFilter) return;

    const stages = [...new Set((data.books || []).map(book => book.stage).filter(Boolean))];
    const domains = [...new Set((data.books || []).map(book => book.domain).filter(Boolean))];

    stages.forEach(stage => {
      const option = document.createElement('option');
      option.value = stage;
      option.textContent = stage;
      stageFilter.appendChild(option);
    });

    domains.forEach(domain => {
      const option = document.createElement('option');
      option.value = domain;
      option.textContent = domain;
      domainFilter.appendChild(option);
    });
  }

  function renderPath(data) {
    const target = document.getElementById('book-curriculum-path');
    if (!target) return;

    const books = data.books || [];
    const stages = data.curriculumStages || [];

    target.innerHTML = stages.map((stage, index) => {
      const stageBooks = books.filter(book => book.stage === stage.label);
      const pills = stageBooks.length
        ? stageBooks.map(book => `<span class="ap-book-pill">${escapeHTML(book.title)}</span>`).join('')
        : '<span class="ap-book-pill">Curriculum node pending</span>';

      return `
        <article class="ap-curriculum-stage" data-stage-index="${String(index + 1).padStart(2, '0')}">
          <h3>${escapeHTML(stage.label)}</h3>
          <p>${escapeHTML(stage.summary)}</p>
          <div class="ap-curriculum-stage-books">${pills}</div>
        </article>
      `;
    }).join('');
  }

  function bookCard(book) {
    const connections = (book.connections || []).map(connection => `<span class="ap-book-connection">${escapeHTML(connection)}</span>`).join('');
    return `
      <article class="ap-book-card" data-book-id="${escapeHTML(book.id)}" data-domain="${escapeHTML(book.domain)}" data-stage="${escapeHTML(book.stage)}">
        <header>
          <div>
            <span class="ap-book-stage">${escapeHTML(book.stage)}</span>
            <h3>${escapeHTML(book.title)}</h3>
          </div>
          <span class="ap-book-status">${escapeHTML(book.status)}</span>
        </header>
        <p>${escapeHTML(book.summary)}</p>
        <p class="ap-book-outcome"><strong>Reader outcome:</strong> ${escapeHTML(book.readerOutcome)}</p>
        <div class="ap-book-meta-row">
          <span class="ap-book-domain">${escapeHTML(book.domain)}</span>
          <span class="ap-book-domain" aria-label="Difficulty">${difficulty(book.difficulty)}</span>
        </div>
        <div class="ap-book-connections" aria-label="Connected Atlas nodes">${connections}</div>
        <a class="button secondary" href="${escapeHTML(book.url)}">Open curriculum path</a>
      </article>
    `;
  }

  function renderGrid(data) {
    const target = document.getElementById('book-grid');
    const stageFilter = document.getElementById('book-stage-filter');
    const domainFilter = document.getElementById('book-domain-filter');
    const search = document.getElementById('book-search');
    if (!target) return;

    const query = (search && search.value || '').toLowerCase().trim();
    const stage = stageFilter && stageFilter.value || 'all';
    const domain = domainFilter && domainFilter.value || 'all';

    const filtered = (data.books || []).filter(book => {
      const haystack = [book.title, book.summary, book.readerOutcome, book.domain, book.stage, ...(book.connections || [])].join(' ').toLowerCase();
      return (stage === 'all' || book.stage === stage)
        && (domain === 'all' || book.domain === domain)
        && (!query || haystack.includes(query));
    });

    target.innerHTML = filtered.length
      ? filtered.map(bookCard).join('')
      : '<article class="ap-book-empty">No curriculum paths match that filter.</article>';
  }

  async function init() {
    const grid = document.getElementById('book-grid');
    const path = document.getElementById('book-curriculum-path');
    if (!grid && !path) return;

    try {
      const data = await loadBooks();
      populateFilters(data);
      renderPath(data);
      renderGrid(data);

      ['book-stage-filter', 'book-domain-filter', 'book-search'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => renderGrid(data));
        if (el) el.addEventListener('change', () => renderGrid(data));
      });
    } catch (error) {
      const message = `<article class="ap-book-empty">${escapeHTML(error.message)}</article>`;
      if (grid) grid.innerHTML = message;
      if (path) path.innerHTML = message;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
