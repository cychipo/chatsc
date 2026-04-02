CC := gcc
CFLAGS := -Wall -Wextra -Werror -I../shared -I.
LDFLAGS := -pthread
BUILD_DIR ?= ../../build
TARGET := $(BUILD_DIR)/client
SRCS := client.c device_client.c ../shared/protocol.c

.PHONY: all clean

all: $(TARGET)

$(TARGET): $(SRCS)
	mkdir -p $(BUILD_DIR)
	$(CC) $(CFLAGS) -o $@ $(SRCS) $(LDFLAGS)

clean:
	rm -f $(TARGET)
