# Sprint 21 — Path Resolution

## Principle

A system must know where it is before it can guide anyone else.

## Why this sprint exists

Focused Atlas links were resolving against the domain root on the GitHub Pages preview repo, which produced 404s by dropping the repository path.

## Files

- `assets/system/ap-paths.js`
- `assets/system/ap-system.js`
- `docs/ap-v2/AP_PATH_RESOLUTION.md`

## Result

AP internal links now work on both:

- GitHub Pages project previews
- production custom-domain deployments
