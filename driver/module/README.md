# Kernel Module Workflow

## Responsibilities

The driver is responsible for:
- custom substitution cipher for chat messages
- SHA1 hashing for login credentials
- request/response processing through `/dev/device`

## Build on native Linux host

```bash
make -C driver/module
```

Hoặc từ repo root:

```bash
make driver
```

Điều này yêu cầu host có matching kernel build tree tại `/lib/modules/$(uname -r)/build`.

## Load

```bash
sudo make load
```

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
sudo make unload
```

If unload fails, confirm no client process is still using `/dev/device`.
