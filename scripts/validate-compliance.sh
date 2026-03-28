#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[compliance] starting repository hygiene checks"

FAILURES=0

# High-risk secret patterns (basic baseline)
SECRET_PATTERNS='(AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH|DSA) PRIVATE KEY-----|xox[baprs]-[A-Za-z0-9-]{10,}|ghp_[A-Za-z0-9]{36})'

if rg -n --hidden --glob '!node_modules/**' --glob '!.git/**' -e "$SECRET_PATTERNS" . >/tmp/omega_secret_scan.txt; then
  echo "[compliance][error] potential secret material found"
  cat /tmp/omega_secret_scan.txt
  FAILURES=$((FAILURES+1))
else
  echo "[compliance] secret pattern scan passed"
fi

if [[ -f .env ]]; then
  echo "[compliance][error] .env file exists in repo root; keep secrets out of VCS"
  FAILURES=$((FAILURES+1))
else
  echo "[compliance] no tracked root .env file"
fi

if [[ ! -f pnpm-lock.yaml ]]; then
  echo "[compliance][error] pnpm-lock.yaml missing"
  FAILURES=$((FAILURES+1))
else
  echo "[compliance] lockfile present"
fi

if [[ $FAILURES -gt 0 ]]; then
  echo "[compliance] failed with $FAILURES finding(s)"
  exit 1
fi

echo "[compliance] all checks passed"
