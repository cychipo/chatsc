#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

grep -q 'REQUEST_AUTH_REGISTER' app/shared/protocol.h
grep -q 'REQUEST_CHAT_SELECT_PEER' app/shared/protocol.h
grep -q 'PROCESS_SUBSTITUTION_DECRYPT' app/shared/protocol.h
grep -q 'RESPONSE_CHAT_DELIVERY' app/shared/protocol.h
grep -q 'plaintext_payload' app/shared/protocol.h
grep -q 'peer_username' app/shared/protocol.h
grep -q 'REQUEST_CHAT_MESSAGE' app/client/client.c
grep -q 'RESPONSE_CHAT_DELIVERY' app/client/client.c
grep -q 'server_fill_response' app/server/server_protocol.c

echo "chat driver roundtrip declared"
