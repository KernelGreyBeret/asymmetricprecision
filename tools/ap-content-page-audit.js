#!/usr/bin/env node
/* AP Content Page Audit
   Scans HTML detail pages for legacy AP v1 references. */
const fs = require('fs');
const path = require('path');

const roots = ['essays', 'books', 'frameworks', 'field-notes'];
const checks = [
  { label: 'legacy stylesheet', pattern: /assets\/css\/styles\.css/ },
  { label: 'legacy Projects nav', pattern: />Projects</ },
  { label: 'legacy footer wording', pattern: /systems-thinking and operational architecture platform/i },
  { label: 'root-relative asset path', pattern: /href="\/assets|src="\/assets/ }
];

let failures = 0;
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const file of fs.readdirSync(root)) {
    if (!file.endsWith('.html') || file === 'index.html') continue;
    const full = path.join(root, file);
    const text = fs.readFileSync(full, 'utf8');
    for (const check of checks) {
      if (check.pattern.test(text)) {
        failures++;
        console.log(`[AP Audit] ${check.label}: ${full}`);
      }
    }
  }
}

if (failures) {
  console.error(`\nAP content page audit found ${failures} issue(s).`);
  process.exit(1);
}
console.log('AP content page audit passed.');
