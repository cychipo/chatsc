#!/usr/bin/env bash
set -euo pipefail

grep -q "device_create" driver/module/chat_driver_main.c
grep -q "CHAT_DEVICE_NAME" driver/module/chat_driver_main.c

echo "device node exposure declared"
