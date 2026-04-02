#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

grep -q 'sudo apt install -y' README.md
grep -q 'make driver' README.md
grep -q 'sudo make load' README.md
grep -q './build/client 127.0.0.1 9090 /dev/device' README.md
grep -q 'make driver' docs/demo-runbook.md
grep -q 'sudo make load' docs/demo-runbook.md
grep -q 'linux-headers-\$(uname -r)' docs/troubleshooting.md
grep -q 'Module build failed' docs/troubleshooting.md

echo "demo flow docs OK"
