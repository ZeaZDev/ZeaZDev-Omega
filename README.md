# ZeaZDev-Omega (2026 Modernization)

ZeaZDev-Omega is a monorepo for a multi-platform FiGaTect super-app combining DeFi, GameFi, FinTech, and compliance-ready DevSecOps workflows.

## 2026 Upgrade Focus

- Deterministic and reproducible engineering workflows
- Compliance-ready operations (SBOM, audit metadata, validation scripts)
- Security-first defaults for local development and CI/CD
- Cloud-native orchestration readiness (Docker + pipeline guardrails)
- Structured reporting for operational and compliance audits

## Repository Modules

- `apps/frontend-miniapp`: React Native/Expo MiniApp
- `apps/backend`: NestJS API and business logic modules
- `packages/contracts`: Solidity smart contracts and deployment scripts
- `docs`: architecture, roadmap, manuals, and compliance artifacts
- `scripts`: reproducibility, compliance, and SBOM helper scripts

## New 2026 Documentation

- `docs/MANUAL_2026.md`
- `docs/BLUEPRINT_2026.md`
- `docs/WORKFLOW_CICD_2026.md`
- `docs/SECURITY_CHECKLIST_2026.md`
- `docs/AUDIT_REPORT_2026.md`

## Quick Start

```bash
pnpm install
pnpm lint
pnpm test
pnpm compliance:check
```

## Security and Compliance Commands

```bash
pnpm compliance:check    # basic secret and env hygiene checks
pnpm sbom:generate       # generate CycloneDX-compatible SBOM (if tool exists)
pnpm reproducible:build  # deterministic packaging flow with hashing
```

## Pseudo-code Workflow (2026)

```text
init workspace
  -> verify node/pnpm versions
  -> validate .env hygiene and secret exposure risk
  -> run lint/test in monorepo
  -> build artifacts deterministically
  -> generate SBOM and metadata
  -> produce audit report for release gate
```

## Release Process

1. Run reproducibility and compliance scripts.
2. Update roadmap/changelog/manual as needed.
3. Tag release with semantic versioning.
4. Attach audit artifacts and SBOM to release assets.

## Notes

This repository now includes baseline 2026 modernization scaffolding for secure supply chain and compliance automation. Additional legal/regulatory controls (jurisdiction-specific KYC/AML/GDPR updates) should be validated by compliance counsel before production rollout.
