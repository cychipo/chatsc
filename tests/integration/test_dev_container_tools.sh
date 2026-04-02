#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

grep -q 'sudo apt install -y' README.md
grep -q 'build-essential' README.md
grep -q 'linux-headers-\$(uname -r)' README.md

echo "host prerequisites declared"
