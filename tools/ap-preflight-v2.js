#!/usr/bin/env node
/* AP v2 Launch Readiness 2 Static Preflight
   Run from repo root:
     node tools/ap-preflight-v2.js

   Optional:
     node tools/ap-preflight-v2.js path/to/site-root
*/

const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || process.cwd());
const issues = [];
const warnings = [];

function walk(dir, predicate = () => true, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, predicate, acc);
    else if (predicate(full)) acc.push(full);
  }
  return acc;
}

function rel(file) { return path.relative(root, file).replace(/\\/g, '/'); }
function existsAsPage(target) {
  if (fs.existsSync(target) && fs.statSync(target).isFile()) return true;
  if (fs.existsSync(target) && fs.statSync(target).isDirectory() && fs.existsSync(path.join(target, 'index.html'))) return true;
  if (!path.extname(target) && fs.existsSync(`${target}.html`)) return true;
  return false;
}
function cleanLink(value) {
  return String(value || '').split('#')[0].split('?')[0].trim();
}
function resolveInternal(fromFile, link) {
  const clean = cleanLink(link);
  if (!clean || clean.startsWith('mailto:') || clean.startsWith('tel:') || clean.startsWith('javascript:')) return null;
  if (/^[a-z]+:\/\//i.test(clean)) return null;
  if (clean.startsWith('/')) return path.join(root, clean.replace(/^\/+/, ''));
  return path.resolve(path.dirname(fromFile), clean);
}

const htmlFiles = walk(root, (f) => f.endsWith('.html'));
const cssFiles = walk(path.join(root, 'assets'), (f) => f.endsWith('.css'));
const jsFiles = walk(path.join(root, 'assets'), (f) => f.endsWith('.js'));
const jsonFiles = walk(path.join(root, 'assets', 'data'), (f) => f.endsWith('.json'));

for (const file of jsonFiles) {
  try { JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { issues.push({ type: 'invalid-json', file: rel(file), detail: error.message }); }
}

for (const file of htmlFiles) {
  const text = fs.readFileSync(file, 'utf8');
  if (text.includes('assets/css/styles.css')) issues.push({ type: 'legacy-css-reference', file: rel(file), detail: 'References assets/css/styles.css instead of assets/system/ap-system.css.' });
  if (!text.includes('ap-system.css')) warnings.push({ type: 'missing-ap-system-css', file: rel(file), detail: 'Page may not load the AP System stylesheet.' });
  if (!text.includes('ap-system.js')) warnings.push({ type: 'missing-ap-system-js', file: rel(file), detail: 'Page may not load the AP System behavior layer.' });
  if (/href=["']\/[^/]/.test(text) || /src=["']\/[^/]/.test(text)) warnings.push({ type: 'root-absolute-path', file: rel(file), detail: 'Root absolute path may fail in GitHub Pages project preview.' });
  if (/\bProjects\b/.test(text) && !/compatibility/i.test(text)) warnings.push({ type: 'legacy-projects-language', file: rel(file), detail: 'Check whether Projects should now read Laboratories.' });
  if (/is undefined|undefined by|is .* by by/i.test(text)) issues.push({ type: 'relationship-grammar-leak', file: rel(file), detail: 'Visitor-facing relationship grammar leak detected.' });
  const links = [...text.matchAll(/(?:href|src)=["']([^"']+)["']/g)].map(m => m[1]);
  for (const link of links) {
    if (/^(https?:)?\/\//.test(link) || link.startsWith('mailto:') || link.startsWith('tel:') || link.startsWith('#')) continue;
    const target = resolveInternal(file, link);
    if (target && !existsAsPage(target)) issues.push({ type: 'missing-linked-file', file: rel(file), link, target: rel(target) });
  }
}

for (const file of cssFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const imports = [...text.matchAll(/@import\s+url\(["']?([^"')]+)["']?\)/g)].map(m => m[1]);
  for (const imported of imports) {
    const target = resolveInternal(file, imported);
    if (target && !fs.existsSync(target)) issues.push({ type: 'missing-css-import', file: rel(file), import: imported, target: rel(target) });
  }
}

for (const file of jsFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const imports = [...text.matchAll(/import\s*(?:\([^)]*["']([^"']+)["']\)|[^"']*["']([^"']+)["'])/g)].map(m => m[1] || m[2]).filter(Boolean);
  for (const imported of imports) {
    if (/^(https?:)?\/\//.test(imported)) continue;
    const target = resolveInternal(file, imported);
    if (target && !fs.existsSync(target)) issues.push({ type: 'missing-js-import', file: rel(file), import: imported, target: rel(target) });
  }
}

const report = {
  root,
  checkedAt: new Date().toISOString(),
  totals: {
    html: htmlFiles.length,
    css: cssFiles.length,
    js: jsFiles.length,
    json: jsonFiles.length,
    issues: issues.length,
    warnings: warnings.length
  },
  issues,
  warnings
};

const outDir = path.join(root, 'launch');
try { fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(path.join(outDir, 'ap-preflight-report.json'), JSON.stringify(report, null, 2)); }
catch (_) {}

console.log('\nAP v2 Launch Readiness 2 — Static Preflight');
console.log('────────────────────────────────────────');
console.log(`HTML: ${report.totals.html} | CSS: ${report.totals.css} | JS: ${report.totals.js} | JSON: ${report.totals.json}`);
console.log(`Issues: ${issues.length} | Warnings: ${warnings.length}`);
if (issues.length) {
  console.log('\nIssues:');
  for (const issue of issues.slice(0, 50)) console.log(`- [${issue.type}] ${issue.file}${issue.link ? ` -> ${issue.link}` : ''} ${issue.detail || ''}`);
}
if (warnings.length) {
  console.log('\nWarnings:');
  for (const warning of warnings.slice(0, 50)) console.log(`- [${warning.type}] ${warning.file} ${warning.detail || ''}`);
}
console.log('\nReport: launch/ap-preflight-report.json');
process.exit(issues.length ? 1 : 0);
