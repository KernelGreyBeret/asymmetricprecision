# Repository Protection Checklist

**Repository:** [KGB Studio](https://github.com/KernelGreyBeret/KGBStudio)  
**Owner:** Tommy Burke / @KernelGreyBeret  
**Default posture:** Publicly viewable, proprietary, owner-controlled

Use this checklist after adding the protection package and review it after major releases or at least twice per year.

## 1. Rights and identity

- [ ] `LICENSE` is present at the repository root and states that the project is proprietary.
- [ ] `IP_NOTICE.md` is present and linked from the README.
- [ ] README contains a visible **License / Intellectual Property** section stating “All rights reserved; not open source.”
- [ ] Copyright year and owner name are correct.
- [ ] Third-party components and their licenses are inventoried.
- [ ] Rights notices remain embedded in distributed builds, downloadable packages, and substantial source files where practical.
- [ ] Original source files, design files, drafts, and dated release packages are retained as provenance evidence.
- [ ] Major releases are tagged in Git and accompanied by release notes.
- [ ] Consider formal copyright registration for commercially important releases and published works.
- [ ] Consider trademark counsel before relying on a name or logo as a major commercial brand.

## 2. Account protection

- [ ] GitHub account uses a unique password.
- [ ] Two-factor authentication is enabled.
- [ ] Recovery codes are stored securely offline.
- [ ] Passkey or hardware security key is configured where practical.
- [ ] Authorized OAuth apps, GitHub Apps, SSH keys, deploy keys, and personal access tokens are reviewed.
- [ ] Tokens use minimum necessary scopes and expiration dates.
- [ ] Email account controlling GitHub uses strong MFA.
- [ ] Domain registrar and Cloudflare accounts use strong MFA and protected recovery methods.

## 3. Default branch and changes

Configure a branch ruleset for `main`:

- [ ] Block deletion of the default branch.
- [ ] Block force pushes.
- [ ] Require pull requests before merge when collaborators are added.
- [ ] Require at least one approving review when collaborators are added.
- [ ] Require conversation resolution before merge.
- [ ] Require status checks after automated tests exist.
- [ ] Require branches to be up to date before merge when appropriate.
- [ ] Restrict bypass permissions to the owner.
- [ ] Consider requiring signed commits or verified signatures for releases.
- [ ] Keep `@KernelGreyBeret` in `.github/CODEOWNERS`.

**Solo-owner note:** GitHub plan and repository type can affect which rules enforce against administrators. Configure the strongest available rules without blocking your browser-only deployment workflow.

## 4. Security settings

In **Settings → Security / Code security**:

- [ ] Private vulnerability reporting is enabled.
- [ ] Dependency graph is enabled.
- [ ] Dependabot alerts are enabled.
- [ ] Dependabot security updates are enabled where dependencies exist.
- [ ] Secret scanning is enabled where available.
- [ ] Push protection is enabled where available.
- [ ] Code scanning / CodeQL is enabled if supported and useful for the repository languages.
- [ ] Actions are limited to trusted actions and minimum token permissions.
- [ ] Workflow permissions default to read-only unless write access is required.
- [ ] Fork pull-request workflows cannot access production secrets.
- [ ] Deployment environments protect sensitive production credentials.

## 5. Secrets and deployment

- [ ] No API keys, passwords, private keys, access tokens, or `.env` files are committed.
- [ ] Cloudflare, email, payment, analytics, and deployment credentials are stored only in approved secret stores.
- [ ] Client-side JavaScript contains no value that must remain secret.
- [ ] Repository history has been checked for accidental secrets.
- [ ] Exposed secrets are revoked or rotated, not merely deleted.
- [ ] GitHub Pages / custom-domain configuration points only to expected branches and folders.
- [ ] `CNAME`, DNS records, registrar locks, and Cloudflare access are reviewed.
- [ ] Production forms and email endpoints use validation, abuse controls, and least privilege.

## 6. Contributions and public interaction

- [ ] `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and `SECURITY.md` are visible.
- [ ] Issue templates direct security reports away from public issues.
- [ ] Pull-request template requires testing, provenance, third-party licensing, and AI-assistance disclosure.
- [ ] Unsolicited contributions are reviewed for copied or incompatibly licensed material.
- [ ] No contribution is merged merely because it was submitted.
- [ ] Suspected infringement is documented with URLs, timestamps, screenshots, commits, and original source evidence before escalation.

## 7. Funding and public presentation

- [ ] `.github/FUNDING.yml` displays the intended support link.
- [ ] Support language does not imply that payment grants ownership or license rights.
- [ ] Repository About text, website, and README use consistent official names and URLs.
- [ ] Public releases include the correct ownership and license notice.
- [ ] README clearly distinguishes official project material from third-party dependencies.

## 8. Backup and recovery

- [ ] A current local or offline backup of the full repository exists.
- [ ] Critical release ZIPs and source assets are stored in a second protected location.
- [ ] Domain, DNS, GitHub, and email recovery procedures are documented privately.
- [ ] Restore from backup has been tested.
- [ ] Repository transfer and successor-access considerations are documented privately.

## README notice to add

Add a visible section near the bottom of the README:

```md
## License and Intellectual Property

Copyright © 2026 Tommy Burke. All rights reserved.

This is a publicly viewable proprietary project, not an open-source project.
No permission is granted to copy, modify, redistribute, deploy, publish,
commercialize, or create derivative works from the code, content, assets,
designs, engines, frameworks, or other project material except as expressly
stated in [LICENSE](LICENSE).

See [IP_NOTICE.md](IP_NOTICE.md) for additional detail.
```
