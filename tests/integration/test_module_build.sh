#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

grep -q "obj-m := chat_driver.o" driver/module/Makefile
grep -q "chat_driver_main.o" driver/module/Makefile
grep -q "check-kdir:" driver/module/Makefile
grep -q "Missing kernel build tree" driver/module/Makefile
grep -q "KDIR ?= /lib/modules/\$(shell uname -r)/build" Makefile
grep -q "^driver:" Makefile
grep -q "^load:" Makefile
grep -q "^unload:" Makefile
grep -q "missing scripts/" driver/module/Makefile
grep -q "missing .config" driver/module/Makefile
grep -q "missing include/generated/" driver/module/Makefile

echo "module build definition OK"
