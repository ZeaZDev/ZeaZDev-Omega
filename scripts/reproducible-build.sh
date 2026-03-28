#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p artifacts

ARCHIVE="artifacts/source-$(date -u +%Y%m%d).tar.gz"
HASH_FILE="${ARCHIVE}.sha256"

# deterministic-ish archive settings for repository packaging
# shellcheck disable=SC2016
tar --sort=name --mtime='UTC 2026-01-01' --owner=0 --group=0 --numeric-owner \
  --exclude='./.git' --exclude='./node_modules' --exclude='./artifacts' \
  -cf - . | gzip -n > "$ARCHIVE"

sha256sum "$ARCHIVE" > "$HASH_FILE"

echo "[reproducible] archive: $ARCHIVE"
echo "[reproducible] hash:    $HASH_FILE"
