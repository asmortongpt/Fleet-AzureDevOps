# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | Yes                |
| < 1.0   | No                 |

Only the latest release on the `main` branch receives security updates. Older versions are not patched retroactively.

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Please report vulnerabilities by emailing **security@ctafleet.com** with the following information:

- A clear description of the vulnerability
- Steps to reproduce or a proof-of-concept
- Affected components (frontend, API, database, infrastructure)
- Potential impact assessment
- Any suggested remediation (optional)

### Response Timeline

| Stage                  | Timeframe         |
| ---------------------- | ----------------- |
| Initial acknowledgment | Within 48 hours   |
| Triage and assessment  | Within 5 business days |
| Status update          | Every 7 days until resolved |
| Fix released           | Varies by severity (critical: ASAP, high: 30 days, medium/low: 90 days) |

## Disclosure Policy

- We follow coordinated disclosure. Please allow us reasonable time to address the issue before any public disclosure.
- Once a fix is released, we will publish a security advisory crediting the reporter (unless anonymity is requested).
- We will not pursue legal action against researchers who report vulnerabilities responsibly and in good faith.

## Security Best Practices for Contributors

### Authentication and Authorization
- Never bypass authentication checks outside of the gated dev-auth mechanism (`SKIP_AUTH=true` requires `NODE_ENV !== 'production'`).
- All new endpoints must enforce RBAC middleware. Verify the user has the appropriate permission before processing requests.

### Data Handling
- Use parameterized queries exclusively (`$1`, `$2`, etc.). Never use string concatenation for SQL.
- Validate all user input with Zod schemas before processing.
- Never log sensitive data (passwords, tokens, PII). Use the field masking utilities in `api/src/utils/fieldMasking.ts`.

### Secrets and Configuration
- Never commit secrets, API keys, or credentials to the repository.
- All sensitive values must be stored in environment variables or Azure Key Vault.
- Frontend environment variables prefixed with `VITE_` are publicly visible in the browser bundle -- never put secrets there.

### Dependencies
- Run `npm audit` regularly and address critical/high vulnerabilities promptly.
- Pin dependency versions and review changelogs before upgrading.

### Code Review
- All changes touching authentication, authorization, or data access layers require review from at least one maintainer.
- CSRF protection, Helmet CSP headers, and rate limiting must not be weakened without documented justification.

## Scope

This policy applies to the CTAFleet application, including the React frontend, Express API backend, database migrations, Docker configurations, and CI/CD pipelines hosted in this repository.

## Contact

For security matters: **security@ctafleet.com**

For general questions: Open a GitHub issue or discussion.
