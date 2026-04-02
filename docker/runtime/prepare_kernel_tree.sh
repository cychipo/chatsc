#!/usr/bin/env bash
set -euo pipefail

KERNEL_RELEASE="${KERNEL_RELEASE:-$(uname -r)}"
KERNEL_CACHE_ROOT="${KERNEL_CACHE_ROOT:-/workspace/.kernel-build}"
KERNEL_CACHE_DIR="${KERNEL_CACHE_ROOT}/${KERNEL_RELEASE}"
SOURCE_DIR="${KERNEL_CACHE_DIR}/source"
PATCH_DIR="/src/patches"
PROC_CONFIG_GZ="/proc/config.gz"
SRC_KERNEL_VERSION_FILE="/src/kernel-version"
SRC_KERNEL_URL_FILE="/src/kernel-url"
HEADERS_DIR="/usr/src/linux-headers-${KERNEL_RELEASE}"
REPORT_SCRIPT="/workspace/docker/runtime/docker_driver_env_report.sh"
SYNC_SCRIPT="/workspace/docker/runtime/sync_linuxkit_metadata.sh"
METADATA_DIR="${KERNEL_CACHE_ROOT}/${KERNEL_RELEASE}/linuxkit-metadata"

fail() {
  echo "$1" >&2
  exit 1
}

require_file() {
  local file_path="$1"
  local message="$2"
  [[ -e "$file_path" ]] || fail "$message"
}

if [[ ! -x "$REPORT_SCRIPT" ]]; then
  fail "Missing runtime report script: $REPORT_SCRIPT"
fi

if [[ ! -e "$SRC_KERNEL_VERSION_FILE" && -e "$METADATA_DIR/kernel-version" ]]; then
  SRC_KERNEL_VERSION_FILE="$METADATA_DIR/kernel-version"
fi
if [[ ! -e "$SRC_KERNEL_URL_FILE" && -e "$METADATA_DIR/kernel-url" ]]; then
  SRC_KERNEL_URL_FILE="$METADATA_DIR/kernel-url"
fi
if [[ ! -d "$PATCH_DIR" && -d "$METADATA_DIR/patches" ]]; then
  PATCH_DIR="$METADATA_DIR/patches"
fi

if [[ (! -e "$SRC_KERNEL_VERSION_FILE" || ! -e "$SRC_KERNEL_URL_FILE" || ! -d "$PATCH_DIR") && -x "$SYNC_SCRIPT" && -x "$(command -v docker || true)" ]]; then
  "$SYNC_SCRIPT" >/dev/null
fi

if [[ ! -e "$SRC_KERNEL_VERSION_FILE" && -e "$METADATA_DIR/kernel-version" ]]; then
  SRC_KERNEL_VERSION_FILE="$METADATA_DIR/kernel-version"
fi
if [[ ! -e "$SRC_KERNEL_URL_FILE" && -e "$METADATA_DIR/kernel-url" ]]; then
  SRC_KERNEL_URL_FILE="$METADATA_DIR/kernel-url"
fi
if [[ ! -d "$PATCH_DIR" && -d "$METADATA_DIR/patches" ]]; then
  PATCH_DIR="$METADATA_DIR/patches"
fi

require_file "$SRC_KERNEL_VERSION_FILE" "Missing kernel-version metadata from Docker Desktop VM metadata."
require_file "$SRC_KERNEL_URL_FILE" "Missing kernel-url metadata from Docker Desktop VM metadata."
require_file "$PROC_CONFIG_GZ" "Missing /proc/config.gz. Cannot recover exact kernel config."
require_file "$PATCH_DIR" "Missing LinuxKit patch set metadata. Cannot apply LinuxKit patches."

KERNEL_VERSION="$(cat "$SRC_KERNEL_VERSION_FILE")"
KERNEL_URL="$(cat "$SRC_KERNEL_URL_FILE")"
MODVERSIONS="$("$REPORT_SCRIPT" | awk -F= '/^kernel_config_modversions=/{print $2}')"
PATCH_COUNT="$(find "$PATCH_DIR" -maxdepth 1 -type f | wc -l | tr -d ' ')"

[[ -n "$KERNEL_VERSION" && "$KERNEL_VERSION" != "missing" ]] || fail "kernel-version metadata is empty."
[[ -n "$KERNEL_URL" && "$KERNEL_URL" != "missing" ]] || fail "kernel-url metadata is empty."
[[ "$PATCH_COUNT" != "0" ]] || fail "No LinuxKit patches found in metadata."

mkdir -p "$KERNEL_CACHE_ROOT"

if [[ ! -d "$SOURCE_DIR/.git" ]]; then
  rm -rf "$SOURCE_DIR"
  git clone --depth 1 --branch "$KERNEL_VERSION" "$KERNEL_URL" "$SOURCE_DIR"
fi

cd "$SOURCE_DIR"

git reset --hard >/dev/null

git clean -fd >/dev/null

while IFS= read -r patch; do
  patch_name="$(basename "$patch")"
  if git apply --check "$patch" >/dev/null 2>&1; then
    git apply "$patch"
    printf 'applied_patch=%s\n' "$patch_name"
  else
    printf 'skipped_patch=%s\n' "$patch_name"
  fi
done < <(find "$PATCH_DIR" -maxdepth 1 -type f | sort)

gzip -dc "$PROC_CONFIG_GZ" > .config
make olddefconfig
make modules_prepare

if [[ "$MODVERSIONS" == "y" && ! -f Module.symvers ]]; then
  if [[ -f "$HEADERS_DIR/Module.symvers" ]]; then
    cp "$HEADERS_DIR/Module.symvers" Module.symvers
  else
    fail "CONFIG_MODVERSIONS=y but Module.symvers is unavailable. A full matching kernel build is required."
  fi
fi

[[ -f Makefile ]] || fail "Prepared tree is invalid: missing top-level Makefile."
[[ -d scripts ]] || fail "Prepared tree is invalid: missing scripts/."
[[ -f .config ]] || fail "Prepared tree is invalid: missing .config."
[[ -d include/generated ]] || fail "Prepared tree is invalid: missing include/generated/."

printf 'prepared_kernel_tree=%s\n' "$SOURCE_DIR"
printf 'prepared_kernel_release=%s\n' "$KERNEL_RELEASE"
printf 'prepared_kernel_modversions=%s\n' "$MODVERSIONS"
printf 'prepared_kernel_module_symvers=%s\n' "$( [[ -f Module.symvers ]] && echo "$SOURCE_DIR/Module.symvers" || echo missing )"
