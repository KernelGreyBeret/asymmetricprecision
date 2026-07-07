# AP Prelaunch Audit

Use this checklist after Sprint 30 is applied.

## Static Audit

- [ ] `node tools/ap-preflight-v2.js` runs from repo root.
- [ ] No missing linked files.
- [ ] No missing CSS imports.
- [ ] No missing JavaScript imports.
- [ ] No invalid JSON data files.
- [ ] No `assets/css/styles.css` references.
- [ ] No root-absolute links that break project preview.
- [ ] No visitor-facing `undefined` relationship language.

## Runtime Audit

Check the following pages in browser:

- [ ] Home
- [ ] Start Here
- [ ] Philosophy
- [ ] Atlas
- [ ] Journeys
- [ ] Learning
- [ ] Essays index
- [ ] Representative essay
- [ ] Frameworks index
- [ ] Books index
- [ ] Representative book
- [ ] Laboratories
- [ ] Field Notes
- [ ] About
- [ ] Contact

On each page:

- [ ] No horizontal overflow.
- [ ] No invisible buttons.
- [ ] No unresolved loading placeholders after hydration.
- [ ] Navigation includes the canonical AP surfaces.
- [ ] Focused Atlas links stay inside the site base path.
- [ ] Journey context persists when expected.
- [ ] The page explains where it sits in the system.

## Final Question

Did the page help someone understand the system better than when they arrived?
