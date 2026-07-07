/* AP Launch Readiness Runtime Audit
   Sprint 30 — Launch Readiness 2
   Principle: A system is ready when it can explain its own readiness.
*/

const REQUIRED_NAV_TARGETS = [
  'start-here/index.html',
  'philosophy/index.html',
  'atlas/index.html',
  'journeys/index.html',
  'learning/index.html',
  'essays/index.html',
  'frameworks/index.html',
  'books/index.html',
  'laboratories/index.html'
];

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function isVisible(element) {
  if (!element || !element.getBoundingClientRect) return false;
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
}

function collectHorizontalOverflow() {
  const viewport = document.documentElement.clientWidth;
  return Array.from(document.body.querySelectorAll('*'))
    .filter((element) => isVisible(element))
    .map((element) => ({ element, rect: element.getBoundingClientRect() }))
    .filter(({ rect }) => rect.right > viewport + 2 || rect.left < -2)
    .slice(0, 25)
    .map(({ element, rect }) => ({
      tag: element.tagName.toLowerCase(),
      className: element.className || '',
      id: element.id || '',
      width: Math.round(rect.width),
      left: Math.round(rect.left),
      right: Math.round(rect.right),
      text: normalizeText(element.textContent).slice(0, 80)
    }));
}

function collectUnresolvedPlaceholders() {
  const patterns = [/Loading\s/i, /undefined/i, /is undefined/i, /is .* by by/i];
  return Array.from(document.body.querySelectorAll('main *'))
    .filter((element) => element.children.length === 0)
    .map((element) => ({ element, text: normalizeText(element.textContent) }))
    .filter(({ text }) => text && patterns.some((pattern) => pattern.test(text)))
    .slice(0, 25)
    .map(({ element, text }) => ({
      tag: element.tagName.toLowerCase(),
      className: element.className || '',
      id: element.id || '',
      text: text.slice(0, 120)
    }));
}

function collectExternalizedInternalLinks() {
  const basePath = window.AP?.paths?.basePath || new URL('.', document.querySelector('script[src$="ap-system.js"]')?.src || location.href).pathname.replace(/assets\/system\/?$/, '');
  const host = location.host;
  return Array.from(document.querySelectorAll('a[href]'))
    .map((anchor) => ({ anchor, href: anchor.getAttribute('href') || '', resolved: new URL(anchor.href, location.href) }))
    .filter(({ href }) => href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:'))
    .filter(({ resolved }) => resolved.host === host)
    .filter(({ resolved }) => basePath !== '/' && !resolved.pathname.startsWith(basePath))
    .slice(0, 25)
    .map(({ anchor, href, resolved }) => ({
      href,
      resolved: resolved.pathname + resolved.search,
      text: normalizeText(anchor.textContent).slice(0, 80)
    }));
}

function collectNavCoverage() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return { missingNav: ['site-nav'], present: [] };
  const hrefs = Array.from(nav.querySelectorAll('a[href]')).map((a) => a.getAttribute('href') || '');
  const missingNav = REQUIRED_NAV_TARGETS.filter((target) => !hrefs.some((href) => href.endsWith(target) || href === target || href === `../${target}`));
  return { missingNav, present: hrefs };
}

function collectButtonContrastRisks() {
  return Array.from(document.querySelectorAll('button, .button, .button-primary, .ap-action'))
    .filter((element) => isVisible(element))
    .map((element) => {
      const style = getComputedStyle(element);
      return { element, color: style.color, background: style.backgroundColor, text: normalizeText(element.textContent) };
    })
    .filter((item) => item.color === item.background || item.background === 'rgba(0, 0, 0, 0)')
    .slice(0, 25)
    .map(({ element, color, background, text }) => ({
      tag: element.tagName.toLowerCase(),
      className: element.className || '',
      color,
      background,
      text: text.slice(0, 80)
    }));
}

function runLaunchReadinessAudit() {
  const nav = collectNavCoverage();
  const report = {
    page: location.pathname + location.search,
    timestamp: new Date().toISOString(),
    horizontalOverflow: collectHorizontalOverflow(),
    unresolvedPlaceholders: collectUnresolvedPlaceholders(),
    externalizedInternalLinks: collectExternalizedInternalLinks(),
    buttonContrastRisks: collectButtonContrastRisks(),
    missingNav: nav.missingNav,
    status: 'ready'
  };
  const issueCount = report.horizontalOverflow.length + report.unresolvedPlaceholders.length + report.externalizedInternalLinks.length + report.buttonContrastRisks.length + report.missingNav.length;
  report.issueCount = issueCount;
  report.status = issueCount ? 'review' : 'ready';
  document.documentElement.dataset.apLaunchReadiness = report.status;
  window.APSystem = window.APSystem || {};
  window.APSystem.launchReadiness = {
    report,
    rerun: runLaunchReadinessAudit
  };
  if (issueCount) {
    console.groupCollapsed(`[AP Launch Readiness] ${issueCount} item(s) to review on ${report.page}`);
    console.table({
      horizontalOverflow: report.horizontalOverflow.length,
      unresolvedPlaceholders: report.unresolvedPlaceholders.length,
      externalizedInternalLinks: report.externalizedInternalLinks.length,
      buttonContrastRisks: report.buttonContrastRisks.length,
      missingNav: report.missingNav.length
    });
    console.log(report);
    console.groupEnd();
  } else {
    console.info(`[AP Launch Readiness] Ready: ${report.page}`);
  }
  return report;
}

export function initializeLaunchReadiness() {
  window.setTimeout(runLaunchReadinessAudit, 1200);
  document.addEventListener('ap:system-initialized', () => window.setTimeout(runLaunchReadinessAudit, 800), { once: true });
}

export const initializeAPLaunchReadiness = initializeLaunchReadiness;
