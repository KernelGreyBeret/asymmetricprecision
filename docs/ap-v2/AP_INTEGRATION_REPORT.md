# AP v2 Integration Sprint

## Principle

The system must feel like one system.

## Why This Sprint Exists

Sprints 1–8 created the foundations, pages, AP System layer, Atlas, Content Graph, Learning System, Journeys, and Laboratories. The Integration Sprint connects those pieces so AP behaves less like a set of independently delivered updates and more like a coherent applied systems thinking environment.

## What Changed

- Added an AP Integration layer: `assets/system/ap-integration.css` and `assets/system/ap-integration.js`.
- Added `assets/data/ap-site.json` as the first site-level map of AP surfaces and checks.
- Added active navigation states through `aria-current="page"` and `.is-active`.
- Added `data-ap-page` and `data-ap-layer` to major pages.
- Added connection surfaces to major pages so every page points toward related AP surfaces.
- Kept `projects/index.html` as a compatibility redirect to `laboratories/index.html`.
- Preserved the AP rule: nothing exists merely because websites usually have it.

## Integration Rule

Every major surface should answer four questions:

1. What is this?
2. Why does it matter?
3. How does it connect?
4. Where should the explorer go next?

## Sprint Principle Locked In

**Coherence is a feature.**
