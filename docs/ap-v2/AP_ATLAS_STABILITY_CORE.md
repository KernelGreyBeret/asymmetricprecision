# AP Atlas Stability Core

## Sprint 32 — Atlas Stability Core

**Principle:** A map must remain usable before it becomes elaborate.

Sprint 31 still allowed the Atlas to lock the page. Sprint 32 replaces the accumulated Atlas renderer with a bounded stability core.

## What changed

- `ap-atlas.js` is now a standalone, fail-soft renderer.
- It does not depend on overlapping Atlas augmentation modules.
- It bounds visible nodes and edges before rendering.
- It preserves projection, density, label, focus, and journey behavior.
- It shows a failure surface instead of letting the page become unresponsive.

## Why

The Atlas is AP's nervous system. If it fails, it must fail in a way that preserves orientation and keeps the learner in the system.

## Launch standard

The Atlas should load at:

- `/atlas/index.html`
- `/atlas/index.html?focus=essay-second-order`
- `/atlas/index.html?focus=design-for-outcomes&projection=neighborhood`
- `/atlas/index.html?journey=leaders`

It should not freeze, even if data is incomplete or an individual relationship is malformed.
