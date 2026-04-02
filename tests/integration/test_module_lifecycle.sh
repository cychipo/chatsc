#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

grep -q 'MODULE_PATH' docker/runtime/load_module.sh
grep -q 'id -u' docker/runtime/load_module.sh
grep -q 'insmod' docker/runtime/load_module.sh
grep -q 'id -u' docker/runtime/unload_module.sh
grep -q 'rmmod' docker/runtime/unload_module.sh
grep -q 'docker_driver_env_report.sh' docker/runtime/check_kernel_tree.sh
grep -q 'prepare_kernel_tree.sh' Makefile
grep -q 'module loaded' driver/module/chat_driver_main.c
grep -q 'module unloaded' driver/module/chat_driver_main.c

echo "module lifecycle workflow declared"
