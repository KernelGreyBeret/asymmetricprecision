# AP v2 Sprint 5 — Content Graph

Sprint 5 turns AP content into a connected learning system.

## Principle

Content is not a list. Content is a learning surface.

## Adds

- `assets/data/ap-content.json`
- Expanded `assets/data/ap-atlas.json` with content nodes and content edges
- `assets/system/ap-content.css`
- `assets/system/ap-content.js`
- Updated `assets/system/ap-system.css`
- Updated `assets/system/ap-system.js`
- Updated index pages for:
  - `books/`
  - `essays/`
  - `frameworks/`
  - `projects/` as Laboratories
  - `field-notes/`
- New reusable patterns:
  - `patterns/content-card.html`
  - `patterns/metadata-surface.html`

## Intentional Design Decision

Books, essays, frameworks, laboratories, and field notes now share one metadata model:

- Type
- Domain
- Path
- Status
- Difficulty
- Summary
- Connections

That makes each item Atlas-ready. AP stops treating content as pages and starts treating content as nodes in a system.

## Sprint 5 Rule

Every piece of content should answer:

1. What is this?
2. What domain does it belong to?
3. What path does it serve?
4. What does it connect to?
5. How does it increase understanding?
