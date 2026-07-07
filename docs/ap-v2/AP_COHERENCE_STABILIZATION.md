# AP Coherence Stabilization

## Why This Sprint Exists

AP v2 had the right philosophy and the right visual direction, but the launch review revealed several forms of system drift.

That matters because AP is not just a site. It is a public expression of a philosophy.

If the system feels accidental, the philosophy feels weaker.

## Findings

### 1. Dynamic surfaces were not consistently hydrating

The AP System entrypoint imported modules, but modules that exported initializer functions were not being invoked.

That left surfaces like Essays empty.

### 2. Navigation drifted

Some pages had Learning in the nav. Others did not.

Some pages used older ordering.

A visitor should not have to infer the system from inconsistent navigation.

### 3. Connection surfaces were too generic

"Do not leave the idea isolated" is a good internal rule, but on pages like About and Contact it felt like implementation language leaking into the visitor experience.

The visitor-facing concept is "Continue."

### 4. The system needed a boundary pass

Overflow, wide surfaces, footer drift, and dynamic controls needed a stabilizing layer.

## Principle

Coherence is a form of trust.

When the system behaves consistently, visitors can spend their attention on the ideas instead of the interface.

## Standard

Every page should now preserve:

- Canonical AP navigation.
- Consistent footer language.
- Context-aware continuation surfaces.
- Hydrated dynamic surfaces.
- No horizontal overflow.
- Visitor-facing language over builder-facing language.

## Sprint Rule

Do not let implementation language leak into the learning experience.
