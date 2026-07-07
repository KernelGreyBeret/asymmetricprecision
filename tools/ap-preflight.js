#!/usr/bin/env node
/*
  AP Static Preflight
  No dependencies. Run from repo root:
  node tools/ap-preflight.js
*/

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const required = [
  'index.html',
  'about/index.html',
  'contact/index.html',
  'philosophy/index.html',
  'start-here/index.html',
  'atlas/index.html',
  'journeys/index.html',
  'learning/index.html',
  'laboratories/index.html',
  'books/index.html',
  'essays/index.html',
  'frameworks/index.html',
  'field-notes/index.html',
  'assets/system/ap-system.css',
  'assets/system/ap-system.js',
  'assets/data/ap-atlas.json',
  'assets/data/ap-content.json'
];

let failed = false;

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

console.log('AP Static Preflight');
console.log('───────────────────');

for (const rel of required) {
  if (exists(rel)) {
    console.log(`✓ ${rel}`);
  } else {
    console.log(`✗ ${rel}`);
    failed = true;
  }
}

function scanHtmlLinks(file) {
  const abs = path.join(root, file);
  if (!fs.existsSync(abs)) return [];
  const html = fs.readFileSync(abs, 'utf8');
  const refs = [];
  const re = /(?:href|src)=["']([^"']+)["']/g;
  let match;
  while ((match = re.exec(html))) {
    const ref = match[1];
    if (
      ref.startsWith('http') ||
      ref.startsWith('mailto:') ||
      ref.startsWith('#') ||
      ref.startsWith('data:')
    ) continue;
    refs.push(ref.split('#')[0].split('?')[0]);
  }
  return refs;
}

const htmlFiles = required.filter((x) => x.endsWith('.html')).filter(exists);
let warnings = 0;

console.log('\nReference scan');
console.log('──────────────');

for (const file of htmlFiles) {
  const dir = path.dirname(file);
  for (const ref of scanHtmlLinks(file)) {
    const target = path.normalize(path.join(root, dir, ref));
    const asIndex = path.join(target, 'index.html');
    if (!fs.existsSync(target) && !fs.existsSync(asIndex)) {
      console.log(`! ${file} -> ${ref}`);
      warnings++;
    }
  }
}

if (!warnings) console.log('✓ No missing local references found in primary pages.');

console.log('\nResult');
console.log('──────');

if (failed) {
  console.log('Preflight failed. Required launch files are missing.');
  process.exit(1);
}

if (warnings) {
  console.log(`Preflight passed with ${warnings} warning(s). Review before launch.`);
  process.exit(0);
}

console.log('Preflight passed. AP v2 launch candidate structure looks coherent.');
