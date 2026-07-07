#!/usr/bin/env node
/*
AP v2 Sprint 34 data merge
Safely appends The Ultimate Guide for Turning Code into Cash to AP data files.
Run from repo root:
  node tools/ap-sprint34-merge-data.js
*/
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const guideId = 'book-turning-code-into-cash';

function readJson(file) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function writeJson(file, data) {
  const p = path.join(root, file);
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
  console.log(`updated ${file}`);
}
function upsert(list, item) {
  if (!Array.isArray(list)) return [item];
  const idx = list.findIndex((x) => x && x.id === item.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...item };
  else list.push(item);
  return list;
}
function upsertEdge(edges, edge) {
  if (!Array.isArray(edges)) return [edge];
  const idx = edges.findIndex((x) => x.source === edge.source && x.target === edge.target && x.type === edge.type);
  if (idx < 0) edges.push(edge);
  return edges;
}

const bookItem = {
  id: guideId,
  title: 'The Ultimate Guide for Turning Code into Cash',
  status: 'Published',
  stage: 'Applied Systems Guides',
  domain: 'Software Commercialization',
  difficulty: 2,
  url: '../books/turning-code-into-cash.html',
  summary: 'A practical commercialization guide for builders who have created software but need to understand the system around selling, licensing, packaging, distributing, supporting, and sustaining it.',
  readerOutcome: 'The reader sees software commercialization as an operating system around the product, not a single sales action.',
  connections: ['principle-practical', 'principle-outcomes', 'principle-evidence', 'laboratories', 'lab-kgb-studio', 'lab-code-shield']
};

const books = readJson('assets/data/ap-books.json');
if (books) {
  books.curriculumStages = upsert(books.curriculumStages || [], {
    id: 'stage-applied-guides',
    label: 'Applied Systems Guides',
    summary: 'Published practical guides that apply AP-style systems thinking to builder, productization, and commercialization problems.'
  });
  books.books = upsert(books.books || [], bookItem);
  writeJson('assets/data/ap-books.json', books);
}

const content = readJson('assets/data/ap-content.json');
if (content) {
  content.items = upsert(content.items || [], {
    ...bookItem,
    type: 'book',
    path: 'Learn',
    domains: ['Software Commercialization', 'Productization', 'Operational Design', 'Builders']
  });
  writeJson('assets/data/ap-content.json', content);
}

const atlas = readJson('assets/data/ap-atlas.json');
if (atlas) {
  atlas.nodes = upsert(atlas.nodes || [], {
    id: guideId,
    label: 'Turning Code into Cash',
    type: 'book',
    domain: 'Software Commercialization',
    summary: 'A published applied systems guide for turning software from an isolated creation into a commercially viable, licensed, packaged, distributed, supported product.',
    url: '../books/turning-code-into-cash.html'
  });
  const edges = atlas.edges || [];
  [
    { source: guideId, target: 'principle-practical', type: 'proves' },
    { source: guideId, target: 'principle-outcomes', type: 'applies' },
    { source: guideId, target: 'principle-evidence', type: 'uses' },
    { source: guideId, target: 'laboratories', type: 'connects-to' },
    { source: guideId, target: 'lab-kgb-studio', type: 'informs' },
    { source: guideId, target: 'lab-code-shield', type: 'informs' },
    { source: 'books', target: guideId, type: 'contains' }
  ].forEach((edge) => upsertEdge(edges, edge));
  atlas.edges = edges;
  writeJson('assets/data/ap-atlas.json', atlas);
}

const availability = readJson('assets/data/ap-availability.json');
if (availability) {
  availability.resources = upsert(availability.resources || [], {
    id: guideId,
    status: 'Published',
    statusLabel: 'Published',
    actionLabel: 'Ask about the book',
    actionUrl: 'mailto:tommy@asymmetricprecision.com?subject=The%20Ultimate%20Guide%20for%20Turning%20Code%20into%20Cash',
    currentPath: 'This applied guide is available as a published builder resource and sits beside the AP curriculum.'
  });
  writeJson('assets/data/ap-availability.json', availability);
}

console.log('Sprint 34 data merge complete.');
