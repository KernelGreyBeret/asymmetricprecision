# AP v2 Sprint 2 — The AP System

Sprint 2 converts the site from page-level styling into a reusable AP System layer.

## What changed

- `assets/system/ap-system.css` is now an intentional entrypoint, not a monolithic stylesheet.
- CSS is split into system layers:
  - `ap-tokens.css`
  - `ap-layout.css`
  - `ap-components.css`
  - `ap-hsvl.css`
  - `ap-atlas.css`
  - `ap-learning.css`
  - `ap-motion.css`
  - `ap-responsive.css`
- JavaScript moved into intentional system modules:
  - `ap-system.js`
  - `ap-navigation.js`
  - `ap-atlas.js`
  - `ap-learning.js`
  - `ap-reflection.js`
- Pages now reference `assets/system/ap-system.js` instead of the legacy `assets/js/main.js`.
- Added Atlas seed data under `assets/data/`.
- Added reusable patterns under `patterns/`.
- Added the first local-only Learning Checkpoint pattern.

## Sprint 2 principle

We do not build pages. We build systems that express ideas.

## Drop-in instructions

Copy the contents of this package into the root of the `ap-v2` branch. It assumes Sprint 1 system-path pages are already applied.
