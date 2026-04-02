# Kernel Module Workflow

## Responsibilities

The driver is responsible for:
- custom substitution cipher for chat messages
- SHA1 hashing for login credentials
- request/response processing through `/dev/device`

## Build

### Native Linux host

```bash
make -C driver/module
```

This expects a matching kernel build tree at `/lib/modules/$(uname -r)/build`.

### Docker Desktop / LinuxKit

Inspect LinuxKit metadata first:

```bash
make docker-driver-env-report
```

Then run the Docker preflight:

```bash
make docker-driver-check
```

If no prepared tree is already available, try assembling one from exact source, LinuxKit patches, and `/proc/config.gz`:

```bash
make docker-driver-prepare
```

Then build the module:

```bash
make docker-driver
```

You can still override with an explicit prepared tree:

```bash
make docker-driver KERNEL_BUILD_DIR=/path/to/prepared/kernel/tree
```

`kheaders.tar.xz` is only a supplemental header bundle. It is not treated as a valid `KDIR` unless a full tree also has top-level `Makefile`, `scripts/`, `.config`, and `include/generated/`.
If `CONFIG_MODVERSIONS=y` and a matching `Module.symvers` cannot be recovered, module build fails fast with an explanatory error.

## Load

```bash
make docker-load
```

The load script now requires a root/privileged context directly; it does not rely on `sudo`.

## Verify

- `lsmod | grep chat_driver`
- `dmesg | tail`
- `ls -l /dev/device`

## Expected behavior

- login credentials are hashed in the driver using SHA1
- chat messages are transformed in the driver using the custom substitution mapping
- if `/dev/device` is unavailable, client-side processing should fail rather than silently fallback

## Unload

```bash
make docker-unload
```

If unload fails, confirm no client process is still using `/dev/device`.
