# AP v2 Sprint 25 — Relationship Grammar Hardening

## Principle

Relationships should read like meaning, not metadata.

## Why This Sprint Exists

The Atlas had begun behaving like a system, but some relationship labels were still leaking implementation language into the visitor experience. Labels such as `is contains by`, `is connects to by`, and `undefined by` are signs that the system is rendering raw or auto-inverted edge metadata instead of meaningful relationship language.

AP cannot teach systems thinking while its own relationships read like database artifacts.

## What Changed

- Rebuilt the relationship grammar layer around intentional forward and inverse phrases.
- Added defensive relationship normalization so unknown, missing, or malformed edge types fall back to meaningful language.
- Updated Atlas relationship rows to show a phrase, target, metadata, and full sentence.
- Updated page intelligence surfaces to use the same grammar instead of their own local relationship wording.
- Updated System Weave signals to preserve relationship meaning when surfacing read-along cues.
- Added presentation rules for relationship rows so they remain readable and contained across breakpoints.

## Design Standard

Raw relationship values are internal metadata.

Visitor-facing relationship language must explain meaning.

A connection should answer:

1. What is related?
2. How is it related?
3. Why does that relationship matter to understanding the system?

## Sprint Outcome

Atlas and contextual relationship surfaces should now read like AP:

- `Belongs to — Essays`
- `Governed by — Intentional All the Way Down`
- `Proven by — KGB Studio`
- `Grounded in — Applied Systems Thinking`

Instead of generated phrases like:

- `is contains by`
- `is connects to by`
- `is undefined by`

