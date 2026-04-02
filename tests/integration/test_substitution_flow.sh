#!/usr/bin/env bash
set -euo pipefail

grep -q 'qazwsxedcrfvtgbyhnujmikolp' driver/module/substitution.c
grep -q 'failed to open device' app/client/device_client.c

echo "substitution flow contract OK"
