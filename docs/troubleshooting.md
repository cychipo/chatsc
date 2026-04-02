# Troubleshooting Guide

## Device not found
- Confirm the module is loaded
- Confirm `/dev/device` exists
- Confirm the container has `/dev` mounted
- The client no longer falls back to user-space processing; if the device is missing, auth/chat processing must fail

## Register failed
- Confirm username only uses letters, numbers, `_`, `-`, or `.`
- Confirm `users.db` is writable by the server process
- If username already exists, choose `login` instead

## Login failed
- Confirm the username already exists in `users.db`
- Confirm the driver SHA1 path is working because password hashing goes through `/dev/device`
- If the same user is already logged in elsewhere, logout first

## Peer selection failed
- Confirm the target username exists in `users.db`
- Confirm the other user is already logged in and online
- Open a second client terminal before selecting peer

## Module build failed
- Run `make docker-driver-env-report` first
- Then run `make docker-driver-check`
- Confirm the kernel release printed by the preflight matches the build tree you plan to use
- If `/lib/modules/<release>/build` is missing or incomplete on Docker Desktop, run `make docker-driver-prepare`
- `kheaders.tar.xz` alone is not a usable build tree; the repo requires top-level `Makefile`, `scripts/`, `.config`, and `include/generated/`
- If `CONFIG_MODVERSIONS=y` and `Module.symvers` cannot be recovered, a full matching kernel build is required and the repo will fail fast instead of building blindly
- If you already have a valid prepared tree, provide it with `KERNEL_BUILD_DIR=/path/to/tree`

## Module load failed
- Confirm `build/chat_driver.ko` exists or pass `MODULE_PATH=/path/to/chat_driver.ko`
- Confirm you are using a root/privileged context for `make docker-load`
- Inspect `dmesg` for vermagic or compatibility errors

## Socket connection failed
- Confirm server is listening on the expected port
- Confirm client and server share the same Docker network
- Confirm the server started with a writable `users.db` path

## Unload blocked
- Confirm no process is still using `/dev/device`
