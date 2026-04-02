APP_DIR := app
CLIENT_DIR := $(APP_DIR)/client
SERVER_DIR := $(APP_DIR)/server
DRIVER_DIR := driver/module
BUILD_DIR := build

COMPOSE := docker compose -f docker/runtime/docker-compose.yml
LINUX_BUILD_DIR := build-linux
MSG ?= hello
USER ?= alice
PASS ?= abc
KERNEL_BUILD_DIR ?=
KERNEL_CACHE_DIR ?= $(CURDIR)/.kernel-build
MODULE_PATH ?=

.PHONY: all app driver clean test help docker-build docker-app docker-server docker-client docker-chat docker-send docker-dev docker-down docker-driver-env-report docker-driver-check docker-driver-sync-metadata docker-driver-prepare docker-driver docker-load docker-unload

all: app driver

app:
	$(MAKE) -C $(CLIENT_DIR)
	$(MAKE) -C $(SERVER_DIR)

driver:
	$(MAKE) -C $(DRIVER_DIR)

test:
	bash tests/integration/test_smoke_setup.sh

docker-build:
	$(COMPOSE) build

docker-app:
	$(COMPOSE) run --rm dev bash -lc 'mkdir -p $(LINUX_BUILD_DIR) && make -C app/client BUILD_DIR=../../$(LINUX_BUILD_DIR) && make -C app/server BUILD_DIR=../../$(LINUX_BUILD_DIR)'

docker-driver-env-report:
	$(COMPOSE) run --rm -e KERNEL_BUILD_DIR="$(KERNEL_BUILD_DIR)" -e KERNEL_CACHE_ROOT="/workspace/.kernel-build" module-ops bash docker/runtime/docker_driver_env_report.sh

docker-driver-check:
	$(COMPOSE) run --rm -e KERNEL_BUILD_DIR="$(KERNEL_BUILD_DIR)" -e KERNEL_CACHE_ROOT="/workspace/.kernel-build" module-ops bash docker/runtime/check_kernel_tree.sh

docker-driver-sync-metadata:
	chmod +x docker/runtime/sync_linuxkit_metadata.sh && KERNEL_CACHE_ROOT="$(KERNEL_CACHE_DIR)" bash docker/runtime/sync_linuxkit_metadata.sh

docker-driver-prepare:
	chmod +x docker/runtime/sync_linuxkit_metadata.sh && KERNEL_CACHE_ROOT="$(KERNEL_CACHE_DIR)" bash docker/runtime/sync_linuxkit_metadata.sh && $(COMPOSE) run --rm -e KERNEL_BUILD_DIR="$(KERNEL_BUILD_DIR)" -e KERNEL_CACHE_ROOT="/workspace/.kernel-build" module-ops bash docker/runtime/prepare_kernel_tree.sh

docker-driver:
	$(COMPOSE) run --rm -e KERNEL_BUILD_DIR="$(KERNEL_BUILD_DIR)" -e KERNEL_CACHE_ROOT="/workspace/.kernel-build" module-ops bash -lc 'if [[ -n "$${KERNEL_BUILD_DIR}" ]]; then KDIR="$${KERNEL_BUILD_DIR}"; elif [[ -d "/workspace/.kernel-build/$$(uname -r)/source" ]]; then KDIR="/workspace/.kernel-build/$$(uname -r)/source"; else KDIR="/lib/modules/$$(uname -r)/build"; fi; make -C driver/module KDIR="$$KDIR" MODULE_OUT=../../build'

docker-load:
	$(COMPOSE) run --rm -e MODULE_PATH="$(MODULE_PATH)" module-ops bash docker/runtime/load_module.sh

docker-unload:
	$(COMPOSE) run --rm module-ops bash docker/runtime/unload_module.sh

docker-server:
	$(COMPOSE) up server

docker-client:
	$(COMPOSE) run --rm client

docker-chat:
	$(COMPOSE) run --rm client

docker-send:
	printf "$(USER)\n$(PASS)\n$(MSG)\n/quit\n" | $(COMPOSE) run --rm -T client

docker-dev:
	$(COMPOSE) run --rm dev bash

docker-down:
	$(COMPOSE) down

clean:
	$(MAKE) -C $(CLIENT_DIR) clean
	$(MAKE) -C $(SERVER_DIR) clean
	$(MAKE) -C $(DRIVER_DIR) clean
	rm -rf $(BUILD_DIR) $(LINUX_BUILD_DIR)

help:
	@printf "Targets: all app driver test clean docker-build docker-app docker-driver-env-report docker-driver-check docker-driver-prepare docker-driver docker-load docker-unload docker-server docker-client docker-chat docker-send docker-dev docker-down\n"
