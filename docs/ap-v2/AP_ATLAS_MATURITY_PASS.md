# AP Atlas Maturity Pass

## Sprint 27 — Atlas Maturity Pass

**The Atlas should orient the learner before it expands the map.**

## Purpose

The Atlas has moved from a list of nodes toward a blueprint of relationships. Sprint 27 makes that blueprint easier to read by adding orientation, map-reading cues, projection guidance, and safer visual boundaries.

## What Changed

- Added an Atlas Orientation surface above the Atlas interface.
- Added a map compass that explains selected, connected, and contextual nodes.
- Added a "You are here" marker to the active Atlas node.
- Added projection-specific reading guidance to the detail panel.
- Hardened node, label, legend, and map boundaries.
- Added a resilient Atlas maturity module that observes hydration and refreshes after the Atlas redraws.

## Design Notes

The Atlas should not overwhelm the learner with every possible connection at once. It should help them understand what kind of map they are looking at before asking them to interpret the relationships.

A mature Atlas does three things:

1. It orients the learner.
2. It explains the projection.
3. It distinguishes focus, relationship, and context.

## Files

```text
assets/system/ap-atlas-maturity.js
assets/system/ap-atlas-maturity.css
assets/system/ap-system.js
assets/system/ap-system.css
```
