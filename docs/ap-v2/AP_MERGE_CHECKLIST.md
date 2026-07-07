# AP v2 Merge Checklist

Use this before merging `ap-v2` into `main`.

## Before Merge

- [ ] Pull latest `main`.
- [ ] Pull latest `ap-v2`.
- [ ] Confirm preview repo/page reflects current `ap-v2`.
- [ ] Run manual browser pass.
- [ ] Run mobile pass.
- [ ] Run `node tools/ap-preflight.js` from repo root.
- [ ] Review reported warnings.
- [ ] Confirm no unexpected legacy files are being removed.

## Merge Options

### Option A — GitHub Pull Request

1. Open PR from `ap-v2` into `main`.
2. Review changed files.
3. Confirm no preview-only files are included unless intended.
4. Merge.
5. Verify `asymmetricprecision.com` after Pages rebuild.

### Option B — Local Merge

```bash
git checkout main
git pull origin main
git merge ap-v2
git push origin main
```

## After Merge

- [ ] Visit homepage.
- [ ] Visit About.
- [ ] Visit Philosophy.
- [ ] Visit Start Here.
- [ ] Visit Atlas.
- [ ] Visit Journeys.
- [ ] Visit Essays.
- [ ] Visit Frameworks.
- [ ] Visit Books.
- [ ] Visit Field Notes.
- [ ] Visit Laboratories.
- [ ] Visit Contact.
- [ ] Confirm Cloudflare / custom domain still works.
- [ ] Confirm no console errors on primary pages.

## Rollback

If something goes wrong, revert the merge commit or reset `main` to the previous known-good commit.

Do not debug in panic mode.

AP rule: reduce uncertainty first.
