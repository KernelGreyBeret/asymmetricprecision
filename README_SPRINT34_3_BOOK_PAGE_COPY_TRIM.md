# AP v2 Sprint 34.3 — Book Page Copy Trim

## Principle
A status message should appear once where it creates clarity.

## What changed

This is a browser-only repair for the **Turning Code into Cash** book page.

It removes the duplicate **Available Now** panel from the page and retunes the **Applied Systems Guide** callout so it explains why the book belongs in AP instead of repeating the curriculum-status message.

The page now has a cleaner division of labor:

- hero: title, summary, and primary purchase action
- curriculum status: companion AP path is still in development
- metadata: type/status/domain/signal
- applied guide callout: why this published guide belongs in AP
- body: what the guide does

No terminal. No Node. Browser-only drop-in.

## Updated files

```text
books/turning-code-into-cash.html
assets/system/ap-applied-guides.js
assets/system/ap-applied-guides.css
```
