# CI/CD Workflow Design (2026)

## Pipeline Stages

1. **Validate**: install, lint, type-check, test
2. **Secure**: run compliance checks and vulnerability scan hooks
3. **Build**: produce deterministic artifacts
4. **Attest**: generate SBOM and hash metadata
5. **Gate**: enforce policy thresholds
6. **Release**: tag and publish artifacts

## Pseudo-code

```text
on push/pull_request:
  checkout
  install
  run lint/test
  run compliance checks
  build artifacts
  generate sbom
  hash artifacts
  if all checks pass -> allow merge/release
```

## Required Artifacts

- Build archive
- SHA256 hash report
- SBOM JSON
- Audit metadata report
