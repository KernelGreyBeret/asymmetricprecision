/* AP Field Notes System
   Observations capture signal from lived systems. */
(function () {
  const grid = document.querySelector('#field-note-grid');
  if (!grid) return;

  const domainFilter = document.querySelector('#field-domain-filter');
  const signalFilter = document.querySelector('#field-signal-filter');
  const searchInput = document.querySelector('#field-search');
  const form = document.querySelector('#field-observation-form');
  const localLog = document.querySelector('#field-observation-log');

  let notes = [];

  const normalize = (value) => String(value || '').toLowerCase().trim();

  function pill(text) {
    return `<span class="ap-field-pill">${text}</span>`;
  }

  function renderNote(note) {
    const domains = (note.domains || []).map(pill).join('');
    const connections = (note.connections || []).map(pill).join('');
    return `
      <article class="ap-field-note" data-note-id="${note.id}">
        <p class="ap-field-signal">${note.signalType || 'Observation'}</p>
        <h3>${note.title}</h3>
        <p>${note.summary}</p>
        <div class="ap-field-meta">
          ${note.status ? pill(note.status) : ''}
          ${note.difficulty ? pill(note.difficulty) : ''}
        </div>
        <div class="ap-field-domains" aria-label="Domains">${domains}</div>
        <div class="ap-field-connections" aria-label="Connections">${connections}</div>
        ${note.href ? `<p><a href="${note.href}">Read observation</a></p>` : ''}
      </article>
    `;
  }

  function hydrateFilters() {
    const domains = new Set();
    const signals = new Set();
    notes.forEach((note) => {
      (note.domains || []).forEach((domain) => domains.add(domain));
      if (note.signalType) signals.add(note.signalType);
    });

    [...domains].sort().forEach((domain) => {
      const option = document.createElement('option');
      option.value = domain;
      option.textContent = domain;
      domainFilter?.appendChild(option);
    });

    [...signals].sort().forEach((signal) => {
      const option = document.createElement('option');
      option.value = signal;
      option.textContent = signal;
      signalFilter?.appendChild(option);
    });
  }

  function render() {
    const selectedDomain = domainFilter?.value || 'all';
    const selectedSignal = signalFilter?.value || 'all';
    const query = normalize(searchInput?.value);

    const filtered = notes.filter((note) => {
      const domainMatch = selectedDomain === 'all' || (note.domains || []).includes(selectedDomain);
      const signalMatch = selectedSignal === 'all' || note.signalType === selectedSignal;
      const haystack = normalize([note.title, note.summary, note.signalType, ...(note.domains || []), ...(note.connections || [])].join(' '));
      const searchMatch = !query || haystack.includes(query);
      return domainMatch && signalMatch && searchMatch;
    });

    grid.innerHTML = filtered.length
      ? filtered.map(renderNote).join('')
      : '<article class="ap-field-empty">No observations match the current filters.</article>';
  }

  function getLocalObservations() {
    try {
      return JSON.parse(localStorage.getItem('ap-field-observations') || '[]');
    } catch {
      return [];
    }
  }

  function renderLocalObservations() {
    if (!localLog) return;
    const local = getLocalObservations();
    if (!local.length) {
      localLog.innerHTML = '';
      return;
    }
    localLog.innerHTML = local.map((item) => `
      <article class="ap-local-observation">
        <strong>${item.signal || 'Captured signal'}</strong>
        <p>${item.observation}</p>
      </article>
    `).join('');
  }

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const observation = String(data.get('observation') || '').trim();
    const signal = String(data.get('signal') || '').trim();
    if (!observation) return;
    const local = getLocalObservations();
    local.unshift({ observation, signal, capturedAt: new Date().toISOString() });
    localStorage.setItem('ap-field-observations', JSON.stringify(local.slice(0, 12)));
    form.reset();
    renderLocalObservations();
  });

  [domainFilter, signalFilter, searchInput].forEach((control) => {
    control?.addEventListener('input', render);
    control?.addEventListener('change', render);
  });

  fetch('../assets/data/ap-field-notes.json')
    .then((response) => response.json())
    .then((data) => {
      notes = data.fieldNotes || [];
      hydrateFilters();
      render();
      renderLocalObservations();
    })
    .catch(() => {
      grid.innerHTML = '<article class="ap-field-empty">Field Notes could not be loaded. Check the AP data path.</article>';
    });
})();
