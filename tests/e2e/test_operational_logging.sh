#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

grep -q "pr_info" driver/module/chat_driver_main.c
grep -q "1) login" app/client/client.c
grep -q "2) register" app/client/client.c
grep -q "chat with username>" app/client/client.c
grep -q 'chat from=%s to=%s plaintext=\\"%s\\" encrypted=\\"%s\\"' app/server/server.c
grep -q "server listening" app/server/server.c

echo "operational logging declared"
