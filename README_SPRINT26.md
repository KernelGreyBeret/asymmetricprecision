# AP v2 Sprint 26 — Page Intelligence Pass

**Every page should know what it is, where it sits, and what becomes clearer next.**

This sprint upgrades AP's page intelligence layer so surfaces can identify themselves, understand their local context, expose meaningful companion resources, preserve journey context, and point into focused Atlas views.

## Drop-in Files

```text
assets/system/ap-page-intelligence.js
assets/system/ap-page-intelligence.css
assets/system/ap-system.js
assets/system/ap-system.css
docs/ap-v2/AP_PAGE_INTELLIGENCE_PASS.md
```

## Notes

- This sprint intentionally keeps page intelligence compact.
- About/Contact-style utility pages get context without heavy continuation blocks.
- Detail surfaces such as essays, books, frameworks, field notes, and laboratories get richer companion surfaces.
- The AP System entrypoint now supports initializer aliases so prior naming drift does not stop modules from running.
