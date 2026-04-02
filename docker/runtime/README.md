# Runtime and Privilege Guidance

## Module operations

Use the `module-ops` service when checking, reporting, preparing, building, loading, and unloading the kernel module.

- `module-ops` runs privileged so it can access the Docker Desktop VM kernel context.
- Mount `/dev` so `/dev/device` can be inspected from the container.
- Mount `/lib/modules` for best-effort Linux host compatibility.
- Cache prepared trees under `.kernel-build/<kernel-release>/` in the repo workspace.
- Mount `KERNEL_BUILD_DIR` into `/kernel-build` only when you want to override the repo-local prepared tree.

## Docker Desktop note

On native Linux, `/lib/modules/$(uname -r)/build` may already be enough.
On Docker Desktop/macOS, this is conditional: the repo first inspects LinuxKit metadata, then tries to prepare a full tree from exact source, patches, and kernel config.
Use `make docker-driver-env-report` first, then `make docker-driver-check`.
If `CONFIG_MODVERSIONS=y` and a matching `Module.symvers` cannot be recovered, the repo stops with a clear error instead of pretending the module can be built.

## Typical flow

1. `make docker-build`
2. `make docker-app`
3. `make docker-driver-env-report`
4. `make docker-driver-check`
5. `make docker-driver-prepare`
6. `make docker-driver`
7. Load the module with `make docker-load`
8. Verify `lsmod`, `dmesg`, and `ls -l /dev/device`
9. Run client/server workflow
   - the `client` service mounts host `/dev`, so `/dev/device` is visible inside `make docker-chat` once the module is loaded
10. Unload with `make docker-unload`
