(function () {
  const essays = window.AP_ESSAYS || [];

  function normalizePath(path) {
    return path
      .replace(/^https?:\/\/[^/]+/i, "")
      .replace(/\/index\.html$/i, "/")
      .replace(/\/+$/, "")
      .toLowerCase();
  }

  const currentPath = normalizePath(window.location.pathname);

  const currentIndex = essays.findIndex(essay => {
    return normalizePath(essay.url) === currentPath;
  });

  const nav = document.querySelector(".essay-nav");
  const prevLink = document.getElementById("essayPrev");
  const nextLink = document.getElementById("essayNext");
  const prevTitle = document.getElementById("essayPrevTitle");
  const nextTitle = document.getElementById("essayNextTitle");

  if (!nav || !prevLink || !nextLink || !prevTitle || !nextTitle) return;

  if (currentIndex === -1) {
    nav.style.display = "none";
    return;
  }

  const previousEssay = essays[currentIndex - 1];
  const nextEssay = essays[currentIndex + 1];

  if (previousEssay) {
    prevLink.href = previousEssay.url;
    prevTitle.textContent = previousEssay.title;
  } else {
    prevLink.removeAttribute("href");
    prevLink.classList.add("essay-nav-disabled");
    prevTitle.textContent = "Start of Essay Series";
  }

  if (nextEssay) {
    nextLink.href = nextEssay.url;
    nextTitle.textContent = nextEssay.title;
  } else {
    nextLink.removeAttribute("href");
    nextLink.classList.add("essay-nav-disabled");
    nextTitle.textContent = "End of Current Essays";
  }
})();
