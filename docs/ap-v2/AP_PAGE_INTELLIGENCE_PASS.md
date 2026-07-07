# AP Page Intelligence Pass

## Sprint 26 — Page Intelligence Pass

**Every page should know what it is, where it sits, and what becomes clearer next.**

Sprint 26 hardens the AP intelligence layer so each page behaves less like an isolated document and more like a surface inside a larger system.

## What Changed

- Added a compact System Context strip near the top of AP surfaces.
- Added page-aware companion groups for principles, operating models, related lenses, proof surfaces, and journeys.
- Added clearer book availability behavior for unpublished or in-development curriculum paths.
- Added focused Atlas links that preserve the current page and active journey context.
- Hardened AP System initialization so renamed/evolving module initializers still run.
- Added boundary rules for context surfaces, companion cards, and long titles.

## Why It Matters

AP should not force a learner to infer the surrounding system from unrelated navigation links. The page itself should answer:

- What am I?
- Where do I sit?
- What domains do I touch?
- What principles or resources connect to me?
- What journey includes me?
- What becomes clearer next?

That is the difference between a website with connected pages and a system that helps people understand the system around the idea.

## Files

```text
assets/system/ap-page-intelligence.js
assets/system/ap-page-intelligence.css
assets/system/ap-system.js
assets/system/ap-system.css
```

## Principle

Every page should know what it is, where it sits, and what becomes clearer next.
