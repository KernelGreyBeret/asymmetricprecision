# AP Launch Readiness 2

## Sprint 30 — Launch Readiness 2

**A system is ready when it can explain its own readiness.**

AP v2 is no longer a set of pages waiting to be merged. It is a system with identity, surfaces, relationships, journeys, learning context, visual language, and launch standards.

Sprint 30 exists to make readiness inspectable.

## What this sprint checks

- missing internal links
- root-absolute links that break GitHub Pages project previews
- missing CSS imports
- missing JavaScript imports
- invalid JSON data
- legacy `styles.css` references
- legacy Projects language
- relationship grammar leaks
- unresolved loading states at runtime
- horizontal overflow at runtime
- button/control contrast risks at runtime
- inconsistent primary navigation at runtime

## How to use it

Run the static audit:

```bash
node tools/ap-preflight-v2.js
```

Then perform the runtime audit by opening representative pages and checking:

```js
window.APSystem.launchReadiness.report
```

## Launch gate meaning

A clean preflight does not prove the system is perfect.

It proves the system has met the declared standard for launch readiness.

That distinction matters.

AP does not launch because nothing can be improved.
AP launches when the system is coherent enough to become the standard that future improvements refine.
