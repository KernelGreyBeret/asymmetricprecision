# AP Control Contrast Fix

## Issue

Some generated/plain controls rendered as white buttons with white text, especially reset controls on Atlas and Journeys.

## Cause

The AP System styles target intentional action classes such as `.button`, `.button-primary`, and `.ap-action`, but some JavaScript-generated controls use plain `<button>` elements. Browser defaults plus inherited AP text color can produce low-contrast controls.

## Fix

Add `assets/system/ap-controls.css` and import it last from `assets/system/ap-system.css` so it becomes the final control contrast layer.

## Principle

Controls should reduce uncertainty, not disappear into the surface.
