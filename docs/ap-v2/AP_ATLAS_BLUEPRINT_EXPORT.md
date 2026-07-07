# AP Atlas Blueprint Export

## Sprint 35 Goal
Move the Atlas from an exploration-only surface into a publishable blueprint surface.

## Added capabilities
- Full-system blueprint export
- PNG export
- Protected masthead/title band
- Copyright footer
- Connection appendix below every generated diagram
- Clustered whole-system export layout

## Design intent
The interactive Atlas helps a person explore the system.
The blueprint export helps a person publish, present, archive, and share the system.
These are related but distinct surfaces.

## Export behavior
### Open Map Image
Exports the current visible projection as a blueprint-style SVG image.

### Download SVG
Downloads the current visible projection as a blueprint-style SVG sheet.

### Download PNG
Downloads the current visible projection as a PNG for easier day-to-day use.

### Open Full Blueprint
Opens a publication-style blueprint sheet showing the entire Atlas with cluster-based layout and lower overlap.

## Layout model
The full-system export groups nodes by type into bounded regions:
- Core
- Concepts
- Principles
- Philosophy
- Oath
- Visual Language
- Systems
- Applications
- Media Layers
- Books
- Essays
- Frameworks
- Laboratories
- Field Notes
- Pages

This is not intended to replace future force-directed or manually-authored cartography.
It is intended to create a readable first full-system sheet now.
