# AP Content Page Migration

Sprint 16

## Principle

**Legacy content must be brought into the system it helped create.**

The AP v2 system was already visible on the major section pages, but individual essay and book pages still carried the older site structure. Sprint 16 migrates those detail pages into AP v2 without changing their public URLs.

## What Changed

- Individual essay pages now use the AP Essay Lens structure.
- Individual book pages now use the AP Book Curriculum structure.
- Legacy `../assets/css/styles.css` references were replaced with `../assets/system/ap-system.css`.
- Legacy `Projects` navigation was replaced with `Laboratories`.
- Footer language now reflects AP v2 as a school of applied systems thinking.
- Detail pages now include metadata, central question/lens surfaces, connection panels, and learning checkpoints.
- Existing URLs are preserved.

## Migrated Content

- Essays migrated: 27
- Books migrated: 7

## Launch Check

After committing, spot-check:

1. `essays/the-checkbox-fallacy.html`
2. `books/zero-trust-actually-explained.html`
3. One essay from each conceptual layer
4. One book besides Zero Trust Actually Explained
5. Mobile nav on a detail page
6. Reflection checkpoint on a detail page

## AP Standard

A detail page is not a dead end.

Every content page should answer:

- What is this?
- What does it help me see?
- How does it connect?
- Where do I go next?
