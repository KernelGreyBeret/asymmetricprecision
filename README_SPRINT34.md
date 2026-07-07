# AP v2 Sprint 34.1 — Browser-Only Applied Guides Repair

**A system should not require a terminal to become whole.**

## Install

Drop this package into the repo root and overwrite files when prompted.

That is it. No terminal. No Node command. No local repo required.

## What this fixes

Sprint 34 originally included an optional Node merge script:

```bash
node tools/ap-sprint34-merge-data.js
```

That works from a local repo or Codespaces, but not from normal GitHub-in-the-browser on a phone.

This repair replaces that requirement with a browser-only AP data bridge. The bridge runs before the AP content, book, Atlas, and availability modules load. When those modules fetch AP data, the bridge merges **The Ultimate Guide for Turning Code into Cash** into the response in memory.

## Result

The guide behaves like a first-class AP resource without requiring static JSON merge scripts:

- Books can see it.
- Atlas can see it.
- Content graph can see it.
- Availability surfaces can see it.
- The standalone page remains available.
- The Applied Systems Guides surface still renders on the Books page.

## New file

- `assets/system/ap-applied-guides-core.js`

## Updated files

- `assets/system/ap-system.js`
- `assets/system/ap-applied-guides.js`
- `assets/system/ap-applied-guides.css`
- `assets/system/ap-system.css`
- `assets/data/ap-applied-guides.json`
- `books/turning-code-into-cash.html`

## Removed requirement

No script needs to be run after installing this package.

The old merge tool is not included in this repair package because the browser-only bridge replaces the need for it.
