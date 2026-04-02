#!/usr/bin/env bash
set -euo pipefail

KERNEL_RELEASE="${KERNEL_RELEASE:-$(docker run --rm --privileged --pid=host justincormack/nsenter1 /bin/uname -r)}"
CACHE_ROOT="${KERNEL_CACHE_ROOT:-/workspace/.kernel-build}"
METADATA_DIR="${CACHE_ROOT}/${KERNEL_RELEASE}/linuxkit-metadata"
PATCH_DIR="$METADATA_DIR/patches"

mkdir -p "$PATCH_DIR"

copy_text_file() {
  local remote_path="$1"
  local local_path="$2"
  if docker run --rm --privileged --pid=host justincormack/nsenter1 /bin/sh -lc "test -f '$remote_path'" >/dev/null 2>&1; then
    docker run --rm --privileged --pid=host justincormack/nsenter1 /bin/cat "$remote_path" > "$local_path"
  fi
}

copy_binary_file() {
  local remote_path="$1"
  local local_path="$2"
  if docker run --rm --privileged --pid=host justincormack/nsenter1 /bin/sh -lc "test -f '$remote_path'" >/dev/null 2>&1; then
    docker run --rm --privileged --pid=host justincormack/nsenter1 /bin/sh -lc "cat '$remote_path'" > "$local_path"
  fi
}

copy_patch_dir() {
  if docker run --rm --privileged --pid=host justincormack/nsenter1 /bin/sh -lc "test -d /src/patches" >/dev/null 2>&1; then
    rm -rf "$PATCH_DIR"
    mkdir -p "$PATCH_DIR"
    docker run --rm --privileged --pid=host justincormack/nsenter1 /bin/sh -lc "tar -C /src -cf - patches" | tar -C "$METADATA_DIR" -xf -
  fi
}

copy_text_file "/src/kernel-version" "$METADATA_DIR/kernel-version"
copy_text_file "/src/kernel-url" "$METADATA_DIR/kernel-url"
copy_binary_file "/src/kheaders.tar.xz" "$METADATA_DIR/kheaders.tar.xz"
copy_patch_dir

printf 'linuxkit_metadata_dir=%s\n' "$METADATA_DIR"
printf 'linuxkit_kernel_version=%s\n' "$( [[ -f "$METADATA_DIR/kernel-version" ]] && cat "$METADATA_DIR/kernel-version" || echo missing )"
printf 'linuxkit_kernel_url=%s\n' "$( [[ -f "$METADATA_DIR/kernel-url" ]] && cat "$METADATA_DIR/kernel-url" || echo missing )"
printf 'linuxkit_patch_count=%s\n' "$(find "$PATCH_DIR" -maxdepth 1 -type f | wc -l | tr -d ' ')"
printf 'linuxkit_kheaders=%s\n' "$( [[ -f "$METADATA_DIR/kheaders.tar.xz" ]] && echo "$METADATA_DIR/kheaders.tar.xz" || echo missing )"
