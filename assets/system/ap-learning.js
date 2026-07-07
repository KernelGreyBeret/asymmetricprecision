const STORAGE_KEY = "ap.learning.reflections.v1";

const responses = {
  yes: {
    label: "Yes",
    message: "Then this page did its job. Follow a connection and keep sharpening the model.",
    needsObservation: false
  },
  thinking: {
    label: "I'm still thinking",
    message: "Good. Complex systems are worth thinking about. Let the question stay alive for a while. Capture the part that still feels unsettled if you want to return to it later.",
    needsObservation: true
  },
  notYet: {
    label: "Not yet",
    message: "That is useful signal. AP should make hard systems clearer, not merely sound impressive. Capture what still feels unclear so the next connection can help.",
    needsObservation: true
  }
};

function readReflectionLog() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (error) {
    console.warn("AP reflection log could not be read.", error);
    return [];
  }
}

function writeReflectionLog(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function pageTitle() {
  const heading = document.querySelector("h1");
  return heading ? heading.textContent.trim() : document.title;
}

function pagePath() {
  return window.location.pathname.replace(/\/index\.html$/, "/");
}

function saveReflection(entry) {
  const log = readReflectionLog();
  log.unshift({
    id: `ap-reflection-${Date.now()}`,
    timestamp: new Date().toISOString(),
    pageTitle: pageTitle(),
    pagePath: pagePath(),
    ...entry
  });
  writeReflectionLog(log.slice(0, 100));
  document.dispatchEvent(new CustomEvent("ap:reflection-updated"));
}

function buildObservationSurface(checkpoint, key) {
  let surface = checkpoint.querySelector("[data-ap-observation-surface]");
  if (!surface) {
    surface = document.createElement("div");
    surface.className = "ap-observation-surface";
    surface.setAttribute("data-ap-observation-surface", "");
    const observationId = `ap-observation-${Math.random().toString(36).slice(2)}`;
    surface.innerHTML = `
      <label class="ap-observation-label" for="${observationId}">What still feels unclear?</label>
      <textarea id="${observationId}" data-ap-observation-text rows="4" placeholder="Capture the unresolved part, weak signal, or question this page surfaced."></textarea>
      <div class="ap-observation-actions">
        <button type="button" class="button secondary" data-ap-save-observation>Save observation locally</button>
        <a class="button secondary" data-ap-contact-observation href="../contact/index.html">Start a conversation</a>
      </div>
      <p class="ap-observation-note" data-ap-observation-note>Stored only in this browser.</p>
    `;
    checkpoint.appendChild(surface);
  }

  const textarea = surface.querySelector("[data-ap-observation-text]");
  const saveButton = surface.querySelector("[data-ap-save-observation]");
  const note = surface.querySelector("[data-ap-observation-note]");
  const contact = surface.querySelector("[data-ap-contact-observation]");

  if (contact) {
    const subject = encodeURIComponent(`AP observation: ${pageTitle()}`);
    contact.setAttribute("href", `mailto:tommy@asymmetricprecision.com?subject=${subject}`);
  }

  if (saveButton && textarea) {
    saveButton.onclick = () => {
      const observation = textarea.value.trim();
      saveReflection({
        response: key,
        responseLabel: responses[key]?.label || key,
        observation
      });
      if (note) note.textContent = observation ? "Observation saved locally." : "Reflection saved locally.";
      renderReflectionLog();
    };
  }

  surface.hidden = !responses[key]?.needsObservation;
}

export function initializeLearningCheckpoints() {
  document.querySelectorAll("[data-ap-learning-checkpoint]").forEach((checkpoint) => {
    const output = checkpoint.querySelector("[data-ap-learning-response]");
    const prompt = checkpoint.querySelector("[data-ap-learning-prompt]")?.textContent?.trim() || "Do you see the system more clearly?";

    checkpoint.querySelectorAll("button[data-ap-reflection]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.getAttribute("data-ap-reflection");
        const result = responses[key] || { label: key, message: "Reflection recorded locally.", needsObservation: false };

        checkpoint.querySelectorAll("button[data-ap-reflection]").forEach((candidate) => {
          candidate.setAttribute("aria-pressed", candidate === button ? "true" : "false");
        });

        if (output) output.textContent = result.message;

        saveReflection({
          prompt,
          response: key,
          responseLabel: result.label,
          observation: ""
        });

        buildObservationSurface(checkpoint, key);
        renderReflectionLog();
      });
    });
  });
}

function summarizeLog(log) {
  const total = log.length;
  const yes = log.filter((item) => item.response === "yes").length;
  const thinking = log.filter((item) => item.response === "thinking").length;
  const notYet = log.filter((item) => item.response === "notYet").length;
  return { total, yes, thinking, notYet };
}

function reflectionItemMarkup(item) {
  const date = new Date(item.timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  const observation = item.observation ? `<p class="ap-reflection-observation">${escapeHtml(item.observation)}</p>` : "";
  return `
    <article class="ap-reflection-item">
      <p class="card-label">${escapeHtml(date)} · ${escapeHtml(item.responseLabel || item.response)}</p>
      <h3>${escapeHtml(item.pageTitle || "AP page")}</h3>
      <p>${escapeHtml(item.prompt || "Do you see the system more clearly?")}</p>
      ${observation}
      <a href="${escapeAttribute(item.pagePath || "../index.html")}">Return to this surface</a>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[char]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

export function renderReflectionLog() {
  const surfaces = document.querySelectorAll("[data-ap-reflection-log]");
  if (!surfaces.length) return;

  const log = readReflectionLog();
  const summary = summarizeLog(log);

  surfaces.forEach((surface) => {
    const summaryTarget = surface.querySelector("[data-ap-reflection-summary]");
    const listTarget = surface.querySelector("[data-ap-reflection-items]");

    if (summaryTarget) {
      summaryTarget.innerHTML = `
        <div class="ap-learning-stat"><strong>${summary.total}</strong><span>Total reflections</span></div>
        <div class="ap-learning-stat"><strong>${summary.yes}</strong><span>Clearer</span></div>
        <div class="ap-learning-stat"><strong>${summary.thinking}</strong><span>Still thinking</span></div>
        <div class="ap-learning-stat"><strong>${summary.notYet}</strong><span>Not yet</span></div>
      `;
    }

    if (listTarget) {
      listTarget.innerHTML = log.length
        ? log.map(reflectionItemMarkup).join("")
        : `<article class="ap-reflection-item"><h3>No reflections yet.</h3><p>As you explore AP, Learning Checkpoints will build a local trail of what helped, what lingered, and what still needs clarity.</p></article>`;
    }
  });
}

export function initializeReflectionLogControls() {
  document.querySelectorAll("[data-ap-export-reflections]").forEach((button) => {
    button.addEventListener("click", () => {
      const log = readReflectionLog();
      const blob = new Blob([JSON.stringify(log, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ap-reflection-log.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  });

  document.querySelectorAll("[data-ap-clear-reflections]").forEach((button) => {
    button.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      renderReflectionLog();
    });
  });

  renderReflectionLog();
  document.addEventListener("ap:reflection-updated", renderReflectionLog);
}

export function initializeLearningSystem() {
  initializeLearningCheckpoints();
  initializeReflectionLogControls();
}
