#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

grep -q 'docker-driver-env-report' README.md
grep -q 'docker-driver-check' README.md
grep -q 'docker-driver-prepare' README.md
grep -q 'KERNEL_BUILD_DIR' README.md
grep -q 'Docker Desktop/macOS' README.md
grep -q 'docker-driver-env-report' docs/demo-runbook.md
grep -q 'docker-driver-prepare' docs/demo-runbook.md
grep -q 'LinuxKit' docs/demo-runbook.md
grep -q 'Module.symvers' docs/troubleshooting.md
grep -q 'Module build failed' docs/troubleshooting.md

echo "demo flow docs OK"
