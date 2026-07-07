# AP System Entrypoint Fix

## Problem

The live preview was rendering mostly unstyled HTML because `assets/system/ap-system.css` had been overwritten by a sprint patch and only imported the mobile/accessibility layers.

The same issue existed in `assets/system/ap-system.js`, which only imported the mobile/accessibility behavior layers.

## Fix

This patch restores `ap-system.css` and `ap-system.js` as true AP System entrypoints.

## Files

- `assets/system/ap-system.css`
- `assets/system/ap-system.js`

## Principle

The system entrypoint should express the system.

No patch file should replace the entrypoint with a partial import list.
