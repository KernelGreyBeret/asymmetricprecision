# AP v2 Sprint 31 — Atlas Recovery Pass

**Sprint 31 — Atlas Recovery Pass**  
A map should fail soft before it fails silent.

## Purpose

Sprint 31 replaces the fragile Atlas renderer with a fail-soft renderer that preserves the Atlas as a usable system map even when one projection, relationship, URL state, or optional context layer misbehaves.

## What Changed

- Rebuilt `assets/system/ap-atlas.js` as a self-contained Atlas renderer.
- Preserved projection modes: System Map, Focused Neighborhood, Domain Cluster, Journey Path.
- Preserved density and label controls.
- Preserved relationship grammar integration.
- Added safer error handling around relationship descriptions and relationship buttons.
- Added safer URL state handling for focused Atlas links.
- Added explicit failure surfaces instead of silent blanks.

## Principle

The Atlas is AP's nervous system. If the map cannot fully render, it should still explain what failed and preserve as much orientation as possible.
