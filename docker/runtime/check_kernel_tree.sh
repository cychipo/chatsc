#!/usr/bin/env bash
set -euo pipefail

KERNEL_RELEASE="$(uname -r)"
DEFAULT_KDIR="/lib/modules/${KERNEL_RELEASE}/build"
KDIR="${KERNEL_BUILD_DIR:-$DEFAULT_KDIR}"
REPORT_SCRIPT="$(dirname "$0")/docker_driver_env_report.sh"

if [[ -x "$REPORT_SCRIPT" ]]; then
  "$REPORT_SCRIPT"
else
  printf 'kernel_release=%s\n' "$KERNEL_RELEASE"
  printf 'kernel_build_dir=%s\n' "$KDIR"
fi

if [[ -d "$KDIR" && -f "$KDIR/Makefile" && -d "$KDIR/scripts" ]]; then
  echo "kernel_build_tree=available"
  exit 0
fi

echo "kernel_build_tree=missing"
echo "No prepared kernel build tree was found for Docker Desktop kernel ${KERNEL_RELEASE}." >&2
echo "Use make docker-driver-env-report to inspect VM metadata, then make docker-driver-prepare to assemble a prepared tree." >&2
echo "If CONFIG_MODVERSIONS=y and Module.symvers is unavailable, the flow will fail fast instead of attempting a blind build." >&2
exit 1
