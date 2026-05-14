# zWallet Production-Safe Next Phase Plan (Repository Review)

Date: 2026-05-14

## Scope Reviewed
- Monorepo structure under `apps/*`, `packages/*`, and `docs/*`.
- Runtime/build orchestration (`package.json`, `pnpm-workspace.yaml`, `turbo.json`).
- Backend API module coverage for wallet-adjacent surfaces.

## Key Findings
1. **Repository/package mismatch vs. current runbook assumptions**
   - The workspace contains `apps/backend`, `apps/frontend-miniapp`, `packages/contracts`, `packages/game-unity`.
   - Packages referenced in the runbook (`@zwallet/shared-types`, `@zwallet/wallet-engine`, `@zwallet/admin-wallet`) do **not** exist in this repository.

2. **Current backend already exposes partial wallet-adjacent functionality**
   - Auth wallet connect flow exists (`/auth/wallet/connect`).
   - Bridge, DeFi, FinTech, Enterprise, Rewards, and related modules are present.
   - Documentation claims wallet create/get/balance endpoints, but no dedicated wallet module file set is present in `apps/backend/src/modules`.

3. **Phase artifacts and docs are broad, but execution guardrails are inconsistent**
   - Top-level scripts encourage recursive workflows (`turbo run build/test/lint`) that conflict with your current production-safe constraints.

## Next Incremental Phase to Implement (Single PR)

## Phase N+1: Minimal Wallet Module Hardening (Backend-only)

Implement a **small, isolated backend slice** that closes the gap between documented and actual wallet API behavior while avoiding infra/runtime churn:

1. Add `wallet` module to `apps/backend/src/modules/wallet/` with:
   - `POST /api/wallet/create`
   - `GET /api/wallet/:userId`
   - `GET /api/wallet/:userId/balance`
2. Back endpoints with existing Prisma `User.walletAddress` and a conservative placeholder balance provider (no chain writes).
3. Add DTO validation and strict response typing.
4. Register module in `app.module.ts`.
5. Add focused unit tests only for new wallet service/controller behavior.

### Why this is the correct next step
- Directly aligns with currently documented API surface and closes production confusion.
- Keeps blast radius limited to backend application code.
- Avoids Cloudflare/Terraform/Docker changes.
- Supports iterative rollout behind existing service runtime (`tsx`).

## Validation Plan for That Next PR
Use package-scoped commands only (no recursive monorepo build/lint/typecheck):

- `pnpm --filter ./apps/backend test -- wallet`
- `pnpm --filter ./apps/backend build`
- `pnpm --filter ./apps/backend exec tsx src/main.ts` (smoke run)

## Remaining Blockers (Before/While Implementing)
1. Runbook-to-repo naming drift (`@zwallet/*` package names absent) must be acknowledged in execution notes.
2. No explicit dedicated wallet persistence model beyond `User.walletAddress`; confirm whether multi-wallet per user is needed before schema expansion.
3. Clarify authoritative source for wallet balance (on-chain indexer vs. internal ledger) to avoid shipping misleading “real balance” semantics.

## Rollback Notes (for upcoming implementation PR)
- Revert only new `wallet` module files and `app.module.ts` import wiring.
- No DB migration in this phase, so rollback is code-only and low risk.
