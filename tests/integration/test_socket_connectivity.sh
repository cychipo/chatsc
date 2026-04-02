#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

grep -q "socket connected" app/client/client.c
grep -q "server listening" app/server/server.c
grep -q "KERNEL_BUILD_DIR" docker/runtime/docker-compose.yml
grep -q "KERNEL_CACHE_ROOT" docker/runtime/docker-compose.yml

echo "socket connectivity hooks declared"
