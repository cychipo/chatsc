APP_DIR := app
CLIENT_DIR := $(APP_DIR)/client
SERVER_DIR := $(APP_DIR)/server
DRIVER_DIR := driver/module
BUILD_DIR := build

HOST ?= 127.0.0.1
PORT ?= 9090
USERS_DB ?= users.db
DEVICE_PATH ?= /dev/device
KDIR ?= /lib/modules/$(shell uname -r)/build
MODULE_PATH ?= $(BUILD_DIR)/chat_driver.ko

.PHONY: all app driver load unload server client test clean help

all: app driver

app:
	$(MAKE) -C $(CLIENT_DIR)
	$(MAKE) -C $(SERVER_DIR)

driver:
	$(MAKE) -C $(DRIVER_DIR) KDIR="$(KDIR)"

load:
	chmod +x scripts/module_load.sh && MODULE_PATH="$(MODULE_PATH)" DEVICE_PATH="$(DEVICE_PATH)" bash scripts/module_load.sh

unload:
	chmod +x scripts/module_unload.sh && DEVICE_PATH="$(DEVICE_PATH)" bash scripts/module_unload.sh

server:
	./build/server $(PORT) $(USERS_DB)

client:
	./build/client $(HOST) $(PORT) $(DEVICE_PATH)

test:
	bash tests/integration/test_smoke_setup.sh && bash tests/integration/test_module_build.sh && bash tests/integration/test_module_lifecycle.sh && bash tests/integration/test_socket_connectivity.sh && bash tests/e2e/test_demo_flow.sh

clean:
	$(MAKE) -C $(CLIENT_DIR) clean
	$(MAKE) -C $(SERVER_DIR) clean
	$(MAKE) -C $(DRIVER_DIR) clean KDIR="$(KDIR)"
	rm -rf $(BUILD_DIR)

help:
	@printf "Targets: all app driver load unload server client test clean\n"
