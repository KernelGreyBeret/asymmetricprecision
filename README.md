# Asymmetric Precision Site

Static website for asymmetricprecision.com.

## What this is

A free GitHub Pages-ready site for:

- Books
- Essays
- Frameworks
- Field Notes
- Projects
- Bio/About
- Contact

No build step. No paid hosting. No dependencies.

## Folder structure

```text
/
├── index.html
├── assets/
│   ├── css/styles.css
│   └── js/main.js
├── books/index.html
├── essays/index.html
├── frameworks/index.html
├── field-notes/index.html
├── projects/index.html
├── about/index.html
└── contact/index.html
```

## GitHub Pages setup

1. Create a new GitHub repo named `asymmetricprecision` or `asymmetricprecision-site`.
2. Upload all files from this folder into the repo root.
3. Go to Settings → Pages.
4. Under “Build and deployment,” choose:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /root
5. Save.

## Custom domain setup

1. In GitHub repo Settings → Pages, add:

```text
asymmetricprecision.com
```

2. This creates or uses a `CNAME` file.
3. In your DNS provider, point the domain to GitHub Pages.

Recommended DNS records:

```text
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   your-github-username.github.io
```

4. Enable “Enforce HTTPS” in GitHub Pages once available.

## Editing content

Each section has its own `index.html`. Edit the text directly. The design is centralized in:

```text
assets/css/styles.css
```

The mobile navigation and copyright year are controlled by:

```text
assets/js/main.js
```
