#!/usr/bin/env bash
set -euo pipefail

MODULE_NAME="${KERNEL_MODULE_NAME:-chat_driver}"
DEVICE_PATH_VALUE="${DEVICE_PATH:-/dev/device}"

if [[ "$(id -u)" != "0" ]]; then
  echo "module_unload.sh requires root privileges to run rmmod." >&2
  exit 1
fi

if command -v lsof >/dev/null 2>&1 && lsof "$DEVICE_PATH_VALUE" >/dev/null 2>&1; then
  echo "Device is still in use: $DEVICE_PATH_VALUE" >&2
  exit 1
fi

rmmod "$MODULE_NAME"
lsmod | grep "$MODULE_NAME" && {
  echo "Module still loaded" >&2
  exit 1
} || true
