# AP Contextual Surfaces

## Sprint Principle

**Context should travel with the learner.**

## Purpose

AP v2 cannot merely describe a connected system. It must behave like one.

This sprint adds page-level contextual intelligence so essays, books, frameworks, and other content surfaces can reveal the AP system around them while the learner is still reading.

## What Changed

### System Context Strip

A compact contextual surface appears near the top of content detail pages. It identifies:

- the current AP surface,
- the surface type,
- the domain/path,
- related principles,
- a focused Atlas link,
- and an available journey continuation.

### Read-Along Context

Readable content pages gain a right-side read-along panel when screen size allows. It surfaces:

- principles in play,
- connected ideas,
- focused Atlas projection,
- and journey signal.

On smaller screens, the panel collapses into the natural flow.

### Atlas Focus Refinement

Generic Atlas links from content pages are upgraded into focused Atlas links using the current surface ID.

### Contextual Continuation

Bottom connection surfaces are rewritten around the current context instead of showing generic continuation language.

## Design Constraint

This is not decoration. These surfaces must help a learner answer:

- What am I reading?
- Where does it sit in AP?
- What does it connect to?
- What should I examine next?

## Future Work

- richer inline principle markers
- mini SVG Atlas preview per page
- content-specific relationship diagrams
- journey-aware reading progress
- optional “why this connection matters” explanations
