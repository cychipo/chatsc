CLIENT_DIR := client
SERVER_DIR := server
PROCESSOR_DIR := processor

.PHONY: all client server processor clean

all: client server processor

client:
	$(MAKE) -C $(CLIENT_DIR)

server:
	$(MAKE) -C $(SERVER_DIR)

processor:
	$(MAKE) -C $(PROCESSOR_DIR)

clean:
	$(MAKE) -C $(CLIENT_DIR) clean
	$(MAKE) -C $(SERVER_DIR) clean
	$(MAKE) -C $(PROCESSOR_DIR) clean
