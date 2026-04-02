#!/usr/bin/env bash
set -euo pipefail

make app

test -x build/client
test -x build/server

echo "user-space build OK"
