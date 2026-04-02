#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

grep -q "socket connected" app/client/client.c
grep -q "server listening" app/server/server.c
grep -q "HOST ?= 127.0.0.1" Makefile
grep -q "PORT ?= 9090" Makefile
grep -q "^server:" Makefile
grep -q "^client:" Makefile

echo "socket connectivity hooks declared"
