# KGB Studio Repository Protection Package

Prepared for:

- Repository: https://github.com/KernelGreyBeret/KGBStudio
- Owner: Tommy Burke / @KernelGreyBeret
- Rights posture: Proprietary, all rights reserved
- Prepared: July 2026

## Installation

Upload the **contents of this folder** into the repository root, preserving the `.github` folder structure.

The package intentionally contains files that may overwrite existing governance files in the repository:

- `LICENSE`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `REPO_PROTECTION_CHECKLIST.md`

Review the diff before committing, particularly in KGB Studio where earlier versions already exist.

## Included files

- `LICENSE` — explicit proprietary repository terms
- `IP_NOTICE.md` — plain-language ownership and permissions notice
- `CONTRIBUTING.md` — controlled contribution process and contributor rights grant
- `SECURITY.md` — private vulnerability reporting policy
- `CODE_OF_CONDUCT.md` — participation expectations
- `REPO_PROTECTION_CHECKLIST.md` — settings and operational hardening guide
- `.github/CODEOWNERS` — assigns ownership review to @KernelGreyBeret
- `.github/FUNDING.yml` — enables GitHub’s Sponsor button using Buy Me a Coffee
- `.github/PULL_REQUEST_TEMPLATE.md` — rights, testing, and AI-assistance checks
- `.github/ISSUE_TEMPLATE/bug_report.yml` — structured public bug report
- `.github/ISSUE_TEMPLATE/config.yml` — disables blank issues and directs security reports privately
- `.editorconfig` — consistent text formatting
- `.gitignore` — common local, secret, and temporary files

## Required manual steps

1. Add the README rights notice from `REPO_PROTECTION_CHECKLIST.md`.
2. Commit the package to the default branch.
3. Enable private vulnerability reporting.
4. Configure branch rules and security settings using the checklist.
5. Confirm the **Sponsor** button appears and opens the intended support page.
6. Review existing third-party components and preserve their licenses.

## Important limitation

These files clarify ownership, permissions, contribution terms, and repository operations. They cannot physically prevent copying or replace tailored advice from an intellectual-property attorney. Formal copyright registration, trademark strategy, contracts, and enforcement decisions may provide additional protection for high-value commercial material.
