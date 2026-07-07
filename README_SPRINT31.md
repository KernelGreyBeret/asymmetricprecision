# Sprint 31 — Atlas Recovery Pass

**Sprint 31 — Atlas Recovery Pass**  
A map should fail soft before it fails silent.

## Install

Copy this package into the repo root and overwrite the existing file:

```text
assets/system/ap-atlas.js
```

This sprint is intentionally narrow: it repairs the Atlas without changing the rest of the AP System entrypoint.

## Verification

Open:

```text
/atlas/index.html
/atlas/index.html?focus=essay-second-order
/atlas/index.html?focus=design-for-outcomes&projection=neighborhood
/atlas/index.html?journey=leaders
```

Confirm:

- nodes render
- relationship lines render
- detail panel renders
- Reset View works
- relationship buttons select connected nodes
- focused Atlas URLs no longer collapse the map
