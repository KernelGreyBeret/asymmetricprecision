/* AP System JS
Principle: the system should initialize intentionally and fail in bounded ways.
Sprint 32 stabilizes the Atlas by using the Atlas Stability Core as the only Atlas renderer.
Supplemental Atlas ideas are now handled inside ap-atlas.js rather than by overlapping renderers.
*/

const AP_MODULES = [
  { path: './ap-paths.js', initializers: ['initializeAPPaths', 'initializePathResolution'] },
  { path: './ap-navigation.js', initializers: ['initializeNavigation'] },
  { path: './ap-applied-guides-core.js', initializers: ['initializeAppliedGuidesCore', 'initializeAppliedGuideDataBridge'] },
  { path: './ap-content.js', initializers: ['initializeContentSurfaces'] },
  { path: './ap-atlas.js', initializers: ['initializeAtlas', 'initializeAtlasPreview'] },
  { path: './ap-learning.js', initializers: ['initializeLearningSystem', 'initializeLearningCheckpoints', 'initializeReflectionLogControls'] },
  { path: './ap-journeys.js', initializers: ['initializeJourneySurfaces'] },
  { path: './ap-laboratories.js', initializers: ['initializeLaboratorySurfaces'] },
  { path: './ap-essays.js', initializers: ['initializeEssayExperience'] },
  { path: './ap-frameworks.js', initializers: ['initializeFrameworkExperience', 'initializeFrameworkSurfaces'] },
  { path: './ap-books.js', initializers: ['initializeBookExperience', 'initializeBookSurfaces'] },
  { path: './ap-applied-guides.js', initializers: ['initializeAppliedGuides', 'initializeAppliedGuideSurfaces'] },
  { path: './ap-field-notes.js', initializers: ['initializeFieldNoteExperience', 'initializeFieldNoteSurfaces'] },
  { path: './ap-hsvl-polish.js', initializers: ['initializeHSVLPolish'] },
  { path: './ap-integration.js', initializers: ['initializeIntegrationLayer'] },
  { path: './ap-polish.js', initializers: ['initializePolishLayer'] },
  { path: './ap-mobile.js', initializers: ['initializeMobileLayer'] },
  { path: './ap-accessibility.js', initializers: ['initializeAccessibilityLayer'] },
  { path: './ap-launch.js', initializers: ['initializeLaunchLayer'] },
  { path: './ap-coherence.js', initializers: ['initializeAPCoherence'] },
  { path: './ap-context-engine.js', initializers: ['initializeContextEngine', 'initializeAPContextEngine'] },
  { path: './ap-page-intelligence.js', initializers: ['initializePageIntelligence', 'initializeAPPageIntelligence'] },
  { path: './ap-contextual-surfaces.js', initializers: ['initializeContextualSurfaces'] },
  { path: './ap-system-weave.js', initializers: ['initializeSystemWeave'] },
  { path: './ap-journey-continuity.js', initializers: ['initializeJourneyContinuity'] },
  { path: './ap-availability.js', initializers: ['initializeAvailability', 'initializeAvailabilitySurfaces'] },
  { path: './ap-mobile-reality.js', initializers: ['initializeMobileReality'] },
  { path: './ap-launch-readiness.js', initializers: ['initializeLaunchReadiness'] }
];

function callInitializer(name, fn, path) {
  if (typeof fn !== 'function') return false;
  try {
    fn();
    return true;
  } catch (error) {
    console.warn(`[AP System] Initializer failed: ${name} from ${path}`, error);
    return false;
  }
}

async function importOptional(entry) {
  try {
    const module = await import(entry.path);
    return { ...entry, module };
  } catch (error) {
    console.warn(`[AP System] Optional module did not load: ${entry.path}`, error);
    return { ...entry, module: null, error };
  }
}

async function initializeAPSystem() {
  window.APSystem = window.APSystem || {};
  window.APSystem.startedAt = Date.now();

  for (const entry of AP_MODULES) {
    const loaded = await importOptional(entry);
    if (!loaded.module) continue;

    const called = new Set();
    for (const name of loaded.initializers) {
      if (called.has(name)) continue;
      const didCall = callInitializer(name, loaded.module[name], loaded.path);
      if (didCall) called.add(name);
      if (loaded.path === './ap-learning.js' && name === 'initializeLearningSystem' && didCall) break;
      if (loaded.path === './ap-atlas.js' && name === 'initializeAtlas' && didCall) break;
    }
  }

  document.documentElement.classList.add('ap-system-initialized');
  window.APSystem.readyAt = Date.now();
  document.dispatchEvent(new CustomEvent('ap:system-initialized'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAPSystem, { once: true });
} else {
  initializeAPSystem();
}
