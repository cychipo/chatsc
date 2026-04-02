#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

grep -q 'kernel_sha1_transform' driver/module/sha1_digest.c
grep -q 'REQUEST_AUTH_REGISTER' app/client/client.c
grep -q 'PROCESS_SHA1' app/client/client.c
grep -q 'server_validate_login' app/server/server_protocol.c
grep -q 'server_register_user' app/server/server_protocol.c

echo "sha1 flow contract OK"
