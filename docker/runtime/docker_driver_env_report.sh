#!/usr/bin/env bash
set -euo pipefail

KERNEL_RELEASE="$(uname -r)"
DEFAULT_KDIR="/lib/modules/${KERNEL_RELEASE}/build"
KDIR="${KERNEL_BUILD_DIR:-$DEFAULT_KDIR}"
SRC_DIR="/src"
PATCH_DIR="${SRC_DIR}/patches"
KERNEL_HEADERS_LINK="/usr/src/linux-headers-${KERNEL_RELEASE}"
PROC_CONFIG_GZ="/proc/config.gz"
MODVERSIONS="unknown"
CONFIG_SOURCE="missing"
MODULE_SYMVERS="missing"
PATCH_COUNT=0
PATCH_LIST=""
BUILD_TARGET="missing"
SOURCE_TARGET="missing"

if [[ -L "$DEFAULT_KDIR" ]]; then
  BUILD_TARGET="$(readlink "$DEFAULT_KDIR")"
elif [[ -e "$DEFAULT_KDIR" ]]; then
  BUILD_TARGET="$DEFAULT_KDIR"
fi

SOURCE_LINK="/lib/modules/${KERNEL_RELEASE}/source"
if [[ -L "$SOURCE_LINK" ]]; then
  SOURCE_TARGET="$(readlink "$SOURCE_LINK")"
elif [[ -e "$SOURCE_LINK" ]]; then
  SOURCE_TARGET="$SOURCE_LINK"
fi

if [[ -r "$PROC_CONFIG_GZ" ]]; then
  CONFIG_SOURCE="$PROC_CONFIG_GZ"
  if gzip -dc "$PROC_CONFIG_GZ" | grep -q '^CONFIG_MODVERSIONS=y$'; then
    MODVERSIONS="y"
  elif gzip -dc "$PROC_CONFIG_GZ" | grep -q '^# CONFIG_MODVERSIONS is not set$'; then
    MODVERSIONS="n"
  fi
elif [[ -r "$KERNEL_HEADERS_LINK/.config" ]]; then
  CONFIG_SOURCE="$KERNEL_HEADERS_LINK/.config"
  if grep -q '^CONFIG_MODVERSIONS=y$' "$KERNEL_HEADERS_LINK/.config"; then
    MODVERSIONS="y"
  elif grep -q '^# CONFIG_MODVERSIONS is not set$' "$KERNEL_HEADERS_LINK/.config"; then
    MODVERSIONS="n"
  fi
fi

if [[ -f "$KDIR/Module.symvers" ]]; then
  MODULE_SYMVERS="$KDIR/Module.symvers"
elif [[ -f "$KERNEL_HEADERS_LINK/Module.symvers" ]]; then
  MODULE_SYMVERS="$KERNEL_HEADERS_LINK/Module.symvers"
fi

if [[ -d "$PATCH_DIR" ]]; then
  PATCH_COUNT="$(find "$PATCH_DIR" -maxdepth 1 -type f | wc -l | tr -d ' ')"
  PATCH_LIST="$(find "$PATCH_DIR" -maxdepth 1 -type f | sort | sed 's#^#patch=#')"
fi

printf 'kernel_release=%s\n' "$KERNEL_RELEASE"
printf 'kernel_build_dir=%s\n' "$KDIR"
printf 'kernel_build_link_target=%s\n' "$BUILD_TARGET"
printf 'kernel_source_link_target=%s\n' "$SOURCE_TARGET"
printf 'kernel_version_file=%s\n' "$( [[ -r "$SRC_DIR/kernel-version" ]] && cat "$SRC_DIR/kernel-version" || echo missing )"
printf 'kernel_url_file=%s\n' "$( [[ -r "$SRC_DIR/kernel-url" ]] && cat "$SRC_DIR/kernel-url" || echo missing )"
printf 'kernel_config_source=%s\n' "$CONFIG_SOURCE"
printf 'kernel_config_modversions=%s\n' "$MODVERSIONS"
printf 'kernel_patch_dir=%s\n' "$( [[ -d "$PATCH_DIR" ]] && echo "$PATCH_DIR" || echo missing )"
printf 'kernel_patch_count=%s\n' "$PATCH_COUNT"
printf 'kernel_kheaders=%s\n' "$( [[ -f "$SRC_DIR/kheaders.tar.xz" ]] && echo "$SRC_DIR/kheaders.tar.xz" || echo missing )"
printf 'kernel_headers_dir=%s\n' "$( [[ -d "$KERNEL_HEADERS_LINK" ]] && echo "$KERNEL_HEADERS_LINK" || echo missing )"
printf 'kernel_module_symvers=%s\n' "$MODULE_SYMVERS"
if [[ -n "$PATCH_LIST" ]]; then
  printf '%s\n' "$PATCH_LIST"
fi
