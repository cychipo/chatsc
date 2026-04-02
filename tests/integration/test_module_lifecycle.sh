#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

grep -q 'MODULE_PATH' scripts/module_load.sh
grep -q 'id -u' scripts/module_load.sh
grep -q 'insmod' scripts/module_load.sh
grep -q 'id -u' scripts/module_unload.sh
grep -q 'rmmod' scripts/module_unload.sh
grep -q 'module loaded' driver/module/chat_driver_main.c
grep -q 'module unloaded' driver/module/chat_driver_main.c

echo "module lifecycle workflow declared"
