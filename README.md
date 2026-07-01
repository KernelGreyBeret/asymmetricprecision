# AP v2 Sprint 4 — Atlas Explorer

Sprint 4 turns the Atlas from a static relationship page into a working exploration surface.

## Principle

**Exploration beats navigation.**

Traditional sites ask visitors to browse folders. AP should help explorers follow relationships, compare domains, trace paths, and leave with clearer mental models.

## What changed

- Expanded `atlas/index.html` into an Atlas Explorer interface
- Upgraded `assets/system/ap-atlas.js` with:
  - search
  - type filters
  - domain filters
  - selected-node detail panels
  - highlighted connection neighborhoods
  - understanding trail
  - local-only reflection prompts
- Upgraded `assets/system/ap-atlas.css` with:
  - Atlas controls
  - relationship SVG layer
  - node states
  - detail panels
  - path/trail display
- Expanded `assets/data/ap-atlas.json` with more AP v2 nodes and relationships
- Added `patterns/atlas-explorer.html` as the reusable pattern reference

## Design intent

The Atlas is not a sitemap.

It is a relationship engine.

The point is not to show everything at once. The point is to help someone discover how ideas connect.

## Drop-in

Copy the contents of this package into the `ap-v2` branch root and commit.

