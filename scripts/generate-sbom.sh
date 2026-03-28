#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p artifacts

if command -v cyclonedx-npm >/dev/null 2>&1; then
  cyclonedx-npm --output-file artifacts/sbom.cdx.json
  echo "[sbom] generated artifacts/sbom.cdx.json"
else
  echo "[sbom][warning] cyclonedx-npm is not installed; creating placeholder metadata"
  cat > artifacts/sbom.cdx.json <<'JSON'
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "version": 1,
  "metadata": {
    "component": {
      "name": "zeazdev-omega",
      "type": "application"
    },
    "note": "Placeholder SBOM. Install cyclonedx-npm for full dependency graph."
  },
  "components": []
}
JSON
fi
