#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

grep -q 'REQUEST_CHAT_MESSAGE' app/client/client.c
grep -q 'REQUEST_CHAT_SELECT_PEER' app/client/device_client.c
grep -q 'REQUEST_AUTH_REGISTER' app/client/device_client.c
grep -q 'STATUS_DRIVER_ERROR' app/client/device_client.c
grep -q 'len != sizeof(last_request)' driver/module/chat_driver_main.c
grep -q 'CHAT_PROC_SUBSTITUTION_DECRYPT' driver/module/chat_driver_main.c

echo "device request response contract OK"
