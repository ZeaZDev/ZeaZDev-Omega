# ZeaZDev-Omega Manual (2026)

## Purpose
This manual describes operation of the 2026 baseline for deterministic development, compliance checks, and secure release workflows.

## Operator Workflow

1. Install dependencies: `pnpm install`
2. Validate code quality: `pnpm lint && pnpm test`
3. Run compliance checks: `pnpm compliance:check`
4. Generate SBOM: `pnpm sbom:generate`
5. Produce reproducible artifacts: `pnpm reproducible:build`

## Stepwise Diagnostics

- **Application diagnostics**: lint/test/build execution status
- **Security diagnostics**: secret pattern checks and `.env` hygiene
- **Supply chain diagnostics**: SBOM generation status
- **Release diagnostics**: artifact hash and archive reproducibility

## Error Handling Guidance

- Failing compliance checks should block release candidate tagging.
- Missing SBOM tooling should be treated as warning in development, fail in CI release gates.
- Store generated reports in release artifacts for audit trail retention.

## Data Protection Practices

- Never commit `.env` files with production secrets.
- Use environment-specific secret stores in deployment pipelines.
- Restrict runtime logs to non-sensitive metadata only.
