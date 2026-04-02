#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

test -f Makefile
test -f app/shared/protocol.h
test -f driver/module/device_contract.h
test -f scripts/module_load.sh
test -f scripts/module_unload.sh

echo "smoke setup OK"
