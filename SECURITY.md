# Security Policy

## Supported versions

Security fixes are generally applied only to the current deployed version and the current default branch. Archived builds, experiments, retired prototypes, old releases, and user-modified copies may not receive fixes.

## Reporting a vulnerability

Please report suspected vulnerabilities privately through GitHub’s **Report a vulnerability** / private security advisory workflow for this repository:

`https://github.com/KernelGreyBeret/asymmetricprecision/security/advisories/new`

Do **not** open a public issue, discussion, or pull request containing exploit details, secrets, personal information, or a working proof of concept.

Include, when available:

- affected file, page, feature, or version;
- clear reproduction steps;
- security impact;
- browser, device, and operating system;
- proof of concept with the minimum detail needed to verify the issue;
- suggested remediation; and
- whether the issue has been disclosed elsewhere.

## Scope

Good-faith reports may cover the public website, downloadable files, forms, client-side tools, deployment configuration, and any code that could affect visitor privacy, content integrity, or site availability.

The following are normally out of scope unless they create a concrete security impact:

- cosmetic defects;
- missing best-practice headers without a demonstrated exploit path;
- vulnerabilities only in unsupported or modified copies;
- denial-of-service or high-volume automated testing;
- social engineering, phishing, or physical attacks;
- reports generated solely by an automated scanner without validation; and
- issues in third-party services that should be reported to that provider.

## Responsible research rules

Researchers must:

- avoid accessing, changing, destroying, or retaining data that is not their own;
- avoid privacy violations, service disruption, persistence, lateral movement, and destructive testing;
- use the least invasive method necessary;
- stop testing and report promptly if sensitive information is encountered;
- not demand payment or threaten disclosure; and
- allow reasonable time for validation and remediation before any public discussion.

This policy does not authorize activity that would otherwise be unlawful, violate GitHub’s terms, affect third parties, or exceed the limited repository rights in `LICENSE`.

## Response

The maintainer will make a reasonable effort to acknowledge actionable reports, assess severity, coordinate remediation, and communicate when disclosure is appropriate. No bounty, payment, credit, or response deadline is promised unless agreed in writing.

## Secrets accidentally committed

If a secret appears in repository history, treat it as compromised: revoke or rotate it immediately, assess access logs and downstream exposure, then remove it from current files and history where appropriate.
