#!/usr/bin/env bash
set -euo pipefail
echo "🔍 Running ZeaZDev Omega Health Check..."
curl -s http://localhost:8000/health || {
  echo "❌ Healthcheck failed"
  exit 1
}
echo "✅ API responded successfully."
