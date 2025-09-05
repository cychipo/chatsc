#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="${CHAT_PROCESSOR_SERVICE_NAME:-chat-processor}"
SYSTEMD_UNIT_SOURCE="${REPO_ROOT}/deploy/systemd/${SERVICE_NAME}.service"
SYSTEMD_UNIT_TARGET="/etc/systemd/system/${SERVICE_NAME}.service"

printf 'Building processor daemon...\n'
make -C "${REPO_ROOT}/app" processor

if [[ ! -f "${SYSTEMD_UNIT_SOURCE}" ]]; then
  printf 'Missing systemd unit: %s\n' "${SYSTEMD_UNIT_SOURCE}" >&2
  exit 1
fi

printf 'Installing systemd unit...\n'
sudo cp "${SYSTEMD_UNIT_SOURCE}" "${SYSTEMD_UNIT_TARGET}"
sudo systemctl daemon-reload
sudo systemctl enable "${SERVICE_NAME}"

printf 'Restarting service...\n'
sudo systemctl restart "${SERVICE_NAME}"

printf 'Checking service status...\n'
sudo systemctl --no-pager --full status "${SERVICE_NAME}"
