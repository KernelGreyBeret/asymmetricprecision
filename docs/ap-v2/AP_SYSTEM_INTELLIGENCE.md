# AP System Intelligence

Sprint 18

## Principle

A system should remember why you are there.

## Purpose

Sprint 18 moves AP from connected pages toward a context-aware applied systems thinking environment.

The site should not merely link to the Atlas, Journeys, Learning, essays, books, frameworks, and laboratories. It should carry context across those surfaces so a visitor can follow a thought without losing the path that brought them there.

## What Changed

### Relationship Grammar

Atlas relationships are no longer rendered as raw edge labels. Relationship types are translated through a grammar layer so connections read like meaningful language instead of database fields.

Examples:

- `contains` becomes `contains` or `belongs to` depending on direction.
- `applies` becomes `applies` or `is applied by` depending on direction.
- Unknown relationships degrade to intentional generic language rather than malformed phrases.

### Journey Context

Journey clicks now carry journey and step state through URL parameters and session storage.

Example:

```text
/philosophy/index.html?journey=journey-leader&step=1
```

Pages can now understand when a visitor arrived as part of a guided path and show the next step instead of generic continuation links.

### Atlas Focus

Atlas links can now carry focus state.

Example:

```text
/atlas/index.html?focus=essay-checkbox-fallacy
```

The Atlas opens around the idea the visitor came to see instead of forcing them to re-find it manually.

### Page Intelligence

Content pages now expose their surrounding system context:

- current Atlas node
- related principles
- related frameworks
- related journeys
- related content surfaces
- focused Atlas link

Book pages with unpublished/planned status now show a status surface and offer useful next actions instead of becoming dead ends.

### Boundary Stabilization

Dynamic AP cards and framework surfaces now better contain long headings, tags, and relationship text. Cards should hold their own signal without bleeding into neighboring surfaces.

## New Files

- `assets/system/ap-relationship-grammar.js`
- `assets/system/ap-context-engine.js`
- `assets/system/ap-page-intelligence.js`
- `assets/system/ap-boundaries.css`
- `assets/system/ap-context-engine.css`

## Updated Files

- `assets/system/ap-system.js`
- `assets/system/ap-system.css`
- `assets/system/ap-atlas.js`
- `assets/system/ap-journeys.js`
- `assets/data/ap-journeys.json`

## Design Law

AP should not merely describe systems.

AP should behave like one.
