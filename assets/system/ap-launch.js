/*
  AP Launch Candidate Layer
  Local-only helpers for launch status surfaces.
*/

const AP_LAUNCH_KEY = 'ap.launchCandidate.viewed';

function markLaunchViewed() {
  try {
    localStorage.setItem(AP_LAUNCH_KEY, new Date().toISOString());
  } catch (error) {
    // Local storage is optional. AP should remain usable without it.
  }
}

function hydrateLaunchStatus() {
  const nodes = document.querySelectorAll('[data-ap-launch-status]');
  if (!nodes.length) return;

  nodes.forEach((node) => {
    node.setAttribute('data-ap-launch-ready', 'true');
    const stamp = node.querySelector('[data-ap-launch-stamp]');
    if (stamp && !stamp.textContent.trim()) {
      stamp.textContent = 'AP v2 Launch Candidate';
    }
  });

  markLaunchViewed();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', hydrateLaunchStatus);
} else {
  hydrateLaunchStatus();
}
