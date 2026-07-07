# AP Path Resolution

## Principle

A system must know where it is before it can guide anyone else.

## Problem

The AP preview site is served from a GitHub Pages project path:

```text
/kernelgreyberet.github.io/asymmetricprecision-preview/
```

The production site is served from the domain root:

```text
/asymmetricprecision.com/
```

Some dynamic links were generated as if the site always lived at `/`. That caused Atlas focus links to resolve like:

```text
https://kernelgreyberet.github.io/atlas/index.html?focus=essay-second-order
```

instead of:

```text
https://kernelgreyberet.github.io/asymmetricprecision-preview/atlas/index.html?focus=essay-second-order
```

## Fix

`assets/system/ap-paths.js` derives the site base path from the AP System module URL and exposes canonical path helpers through `window.AP.paths`.

It also rewrites internal links that accidentally resolve outside the site base path, including dynamically generated links.

## Standard

New AP modules should use path helpers instead of hard-coded root paths:

```js
window.AP.paths.atlasHref({ focus: "example-node" })
window.AP.paths.siteHref("journeys/index.html")
```

No AP feature should assume the site lives at domain root.
