# AP Applied Guides Browser-Only Repair

## Principle

A system should not require a terminal to become whole.

## Reason

Sprint 34 introduced Applied Systems Guides and added **The Ultimate Guide for Turning Code into Cash** as the first published applied guide. The package also included an optional Node merge script to make the guide a first-class data node.

The site workflow is often GitHub browser editing from a phone. That workflow does not provide a terminal unless the user opens a Codespace. Requiring a Node merge step creates an unnecessary operational dependency.

## Design decision

This repair adds a small runtime data bridge loaded before the AP data consumers. It intercepts AP data JSON responses in memory and upserts the applied guide into:

- `ap-books.json`
- `ap-content.json`
- `ap-atlas.json`
- `ap-availability.json`

This preserves browser-only installation while avoiding destructive overwrites of unknown current data files.

## Behavior

The bridge is idempotent. If the guide is already statically merged into a data file, it updates the existing item instead of duplicating it.

The bridge exposes a runtime signal at:

```js
window.APSystem.appliedGuidesBridge
```

Expected mode:

```text
browser-only-runtime-merge
```

## Outcome

Applied Guides now behave as AP resources without needing local tooling, Codespaces, Node, or a terminal.
