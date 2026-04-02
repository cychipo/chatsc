#!/usr/bin/env bash
set -euo pipefail

test -f docker/dev/Dockerfile
test -f docker/runtime/docker-compose.yml
test -f app/shared/protocol.h
test -f driver/module/device_contract.h
test -f docker/runtime/load_module.sh
test -f docker/runtime/unload_module.sh

echo "smoke setup OK"
