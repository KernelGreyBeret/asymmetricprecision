# AP Mobile Reality Pass

## Sprint 29 Principle

Mobile is not a smaller desktop. Mobile is a different operating environment.

## Purpose

Sprint 29 hardens AP for actual handheld use. The earlier mobile and accessibility work made AP responsive. This sprint focuses on reality: dense navigation, Atlas controls, contextual rails, relationship cards, reading surfaces, and generated content must behave clearly on small touch screens.

## What Changed

- Added `ap-mobile-reality.css` as a late-stage mobile stabilization layer.
- Added `ap-mobile-reality.js` to mark mobile/touch state, close mobile navigation after selection, stabilize Atlas reading order, and expose an overflow audit object.
- Updated `ap-system.css` to import the mobile reality layer.
- Updated `ap-system.js` to initialize the mobile reality layer.

## Design Intent

The mobile version of AP should not hide the system. It should sequence the system.

On desktop, AP can show a map, context rail, connection surfaces, and companion panels side by side.

On mobile, AP should present those same ideas as a deliberate reading path:

1. Orientation
2. Controls
3. Content or map
4. Context
5. Continuation

## Validation

After applying this sprint, spot-check:

- Home
- Start Here
- Journeys
- Atlas
- Learning
- Essays index
- An individual essay page
- Books index
- An individual book page
- Frameworks
- Laboratories
- Contact

Use DevTools device emulation and one real phone if available.

In the browser console, inspect:

```js
window.APSystem.mobileReality
```

The `overflowCount` should trend toward zero. If a page still has overflow, the listed nodes identify the first surfaces to inspect.
