# AP Applied Guides Integration

## Sprint 34 — Applied Guides Integration

**Applied guides turn builder knowledge into repeatable operating paths.**

This sprint creates a place for previously published practical guides that fit AP but are not part of the core Asymmetric Precision curriculum series.

The first guide in this layer is *The Ultimate Guide for Turning Code into Cash*.

It belongs in AP because it treats software commercialization as a system around a product:

- licensing,
- packaging,
- terms and policies,
- intellectual property,
- distribution,
- payment processing,
- support,
- updates,
- marketing,
- promotion.

This is not merely a business book. It is an applied operating path for builders.

## Design decision

The book should not be forced into the main AP curriculum sequence. It should appear in a second book layer: **Applied Systems Guides**.

That distinction lets AP preserve the integrity of the core school-of-thought books while still surfacing practical published guides that apply the philosophy.

## Browser-only integration note

The original Sprint 34 package included an optional Node data merge step. Sprint 34.1 removes that requirement.

The applied guide is now merged into AP data at runtime by `ap-applied-guides-core.js`, which loads before the content, book, Atlas, and availability modules. This makes the guide visible to AP surfaces without requiring terminal access or a local development environment.
