# AP Journey Continuity

## Sprint 24 — Journey Continuity

**A path should continue from wherever understanding begins.**

## Why this exists

AP is not a normal content site. If someone enters through a learning path, the
site should remember that intent as they move from page to page.

A learner should not arrive at a page through the Leader journey, finish reading,
and then be offered generic links as if AP has forgotten why they came.

## What this sprint adds

- Active journey context stored in the URL and local storage.
- Journey status surfaces near the top of pages.
- Journey-aware continuation surfaces near the bottom of pages.
- Atlas links that preserve journey intent.
- Internal links that carry journey parameters when they are part of the active path.

## Design rule

The system may offer detours, but it must not lose the path.

## Implementation notes

New files:

- `assets/system/ap-journey-continuity.js`
- `assets/system/ap-journey-continuity.css`
- `assets/data/ap-route-map.json`

Updated entrypoints:

- `assets/system/ap-system.js`
- `assets/system/ap-system.css`
