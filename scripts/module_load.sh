#!/usr/bin/env bash
set -euo pipefail

MODULE_NAME="${KERNEL_MODULE_NAME:-chat_driver}"
MODULE_PATH="${MODULE_PATH:-build/${MODULE_NAME}.ko}"
DEVICE_PATH_VALUE="${DEVICE_PATH:-/dev/device}"

if [[ ! -f "$MODULE_PATH" ]]; then
  FALLBACK_PATH="driver/module/${MODULE_NAME}.ko"
  if [[ -f "$FALLBACK_PATH" ]]; then
    MODULE_PATH="$FALLBACK_PATH"
  fi
fi

if [[ ! -f "$MODULE_PATH" ]]; then
  echo "Missing kernel module artifact: $MODULE_PATH" >&2
  echo "Build the module first with 'make driver'." >&2
  exit 1
fi

if [[ "$(id -u)" != "0" ]]; then
  echo "module_load.sh requires root privileges to run insmod." >&2
  exit 1
fi

insmod "$MODULE_PATH"
lsmod | grep "$MODULE_NAME" || true
if [[ -e "$DEVICE_PATH_VALUE" ]]; then
  ls -l "$DEVICE_PATH_VALUE"
fi
