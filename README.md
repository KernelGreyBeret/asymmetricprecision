# AP v2 Sprint 17 — Coherence / Intentionality Stabilization

## Principle

Intentionality is not a flourish. It is how the system protects clarity.

## What this fixes

- Dynamic AP modules were imported but exported initializers were not called.
  - This prevented surfaces like the Essay Lens cards from hydrating.
- Navigation drifted across pages.
  - Some pages had Learning; some did not.
  - Some pages ordered the AP surfaces differently.
- Generic connection surfaces appeared too large and too internal-facing.
  - "Do not leave the idea isolated" is a useful builder rule, but not the right visitor-facing language everywhere.
- Overflow and boundary issues were accumulating.
- Footer language drifted across generations of the site.

## Files

- `assets/system/ap-system.js`
- `assets/system/ap-system.css`
- `assets/system/ap-coherence.js`
- `assets/system/ap-coherence.css`
- `docs/ap-v2/AP_COHERENCE_STABILIZATION.md`

Drop into the repo root and overwrite.
