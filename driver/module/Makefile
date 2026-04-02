ifneq ($(KERNELRELEASE),)
obj-m := chat_driver.o
chat_driver-objs := chat_driver_main.o substitution.o sha1_digest.o
else
KERNEL_RELEASE ?= $(shell uname -r)
KDIR ?= /lib/modules/$(KERNEL_RELEASE)/build
PWD := $(shell pwd)
MODULE_OUT ?= ../../build

.PHONY: all clean check-kdir

all: check-kdir
	$(MAKE) -C $(KDIR) M=$(PWD) modules
	@mkdir -p $(MODULE_OUT)
	@cp -f *.ko $(MODULE_OUT)/ 2>/dev/null || true
	@cp -f *.ko . 2>/dev/null || true

check-kdir:
	@if [ ! -d "$(KDIR)" ]; then \
		echo "Missing kernel build tree: $(KDIR)" >&2; \
		echo "Set KDIR or KERNEL_BUILD_DIR to a prepared kernel build tree matching $(KERNEL_RELEASE)." >&2; \
		exit 1; \
	fi
	@if [ ! -f "$(KDIR)/Makefile" ]; then \
		echo "Invalid kernel build tree: $(KDIR) (missing Makefile)" >&2; \
		exit 1; \
	fi
	@if [ ! -d "$(KDIR)/scripts" ]; then \
		echo "Invalid kernel build tree: $(KDIR) (missing scripts/)" >&2; \
		exit 1; \
	fi
	@if [ ! -f "$(KDIR)/.config" ]; then \
		echo "Invalid kernel build tree: $(KDIR) (missing .config)" >&2; \
		exit 1; \
	fi
	@if [ ! -d "$(KDIR)/include/generated" ]; then \
		echo "Invalid kernel build tree: $(KDIR) (missing include/generated/)" >&2; \
		exit 1; \
	fi

clean:
	@if [ -d "$(KDIR)" ] && [ -f "$(KDIR)/Makefile" ]; then \
		$(MAKE) -C $(KDIR) M=$(PWD) clean || true; \
	fi
	rm -f ../../build/chat_driver.ko
	rm -f ./chat_driver.ko
endif
