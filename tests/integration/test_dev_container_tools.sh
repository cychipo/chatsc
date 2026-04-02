#!/usr/bin/env bash
set -euo pipefail

grep -q "build-essential" docker/dev/Dockerfile
grep -q "gcc" docker/dev/Dockerfile
grep -q "make" docker/dev/Dockerfile

echo "dev container tools declared"
