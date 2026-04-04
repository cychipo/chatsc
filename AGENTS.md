# AGENTS.md

## Purpose

This file is for coding agents operating in this repository.
It summarizes the build, test, and style conventions actually used here.
Prefer the repository's existing patterns over general best practices when they differ.

## Repository Overview

- Language: C for user-space client/server and a Linux kernel module.
- Build system: GNU Make.
- Runtime environment: Ubuntu/Linux host with kernel headers installed.
- Main areas:
- `app/client`: interactive socket chat client.
- `app/server`: multithreaded socket chat server.
- `app/shared`: protocol types and shared helpers.
- `driver/module`: kernel module implementing `/dev/device` processing.
- `scripts`: module load/unload helpers.
- `tests/integration` and `tests/e2e`: shell-based test scripts.

## Rule Files

- No `.cursorrules` file was found.
- No `.cursor/rules/` directory was found.
- No `.github/copilot-instructions.md` file was found.
- `CLAUDE.md` exists, but it is very lightweight and does not add repo-specific coding rules beyond standard C conventions.

## Host Requirements

Install the expected Ubuntu packages before building or loading the module:

```bash
sudo apt update
sudo apt install -y build-essential gcc make kmod linux-headers-$(uname -r) lsof
```

The kernel build tree must exist at `/lib/modules/$(uname -r)/build` unless `KDIR` is overridden.

## Important Paths

- Root Makefile: `Makefile`
- Client binary: `build/client`
- Server binary: `build/server`
- Kernel module artifact: `build/chat_driver.ko`
- Default device path: `/dev/device`
- Default user DB: `users.db`

## Build Commands

Use these commands from the repository root.

```bash
make app
make driver
make all
make clean
```

Behavior:

- `make app` builds both user-space binaries.
- `make driver` builds the kernel module via `driver/module/Makefile`.
- `make all` builds app plus driver.
- `make clean` removes built app artifacts and module outputs.

Useful subdirectory builds:

```bash
make -C app/client
make -C app/server
make -C driver/module KDIR=/lib/modules/$(uname -r)/build
```

## Run Commands

Server:

```bash
make server
# or
./build/server 9090 users.db
```

Client:

```bash
make client
# or
./build/client 127.0.0.1 9090 /dev/device
```

Kernel module lifecycle:

```bash
sudo make load
sudo make unload
```

With explicit overrides:

```bash
sudo MODULE_PATH=build/chat_driver.ko DEVICE_PATH=/dev/device make load
sudo DEVICE_PATH=/dev/device make unload
```

## Test Commands

Full top-level test command:

```bash
make test
```

Important: `make test` does not run every script in `tests/`; it runs only the sequence wired into the root `Makefile`.

There is no separate lint target and no formatter target in the current repo.

## Single-Test Commands

Tests are shell scripts. Run an individual test directly from the repo root:

```bash
bash tests/integration/test_smoke_setup.sh
bash tests/integration/test_user_space_build.sh
bash tests/integration/test_module_build.sh
bash tests/integration/test_module_lifecycle.sh
bash tests/integration/test_socket_connectivity.sh
bash tests/integration/test_device_request_response.sh
bash tests/integration/test_device_node.sh
bash tests/integration/test_sha1_flow.sh
bash tests/integration/test_substitution_flow.sh
bash tests/e2e/test_demo_flow.sh
bash tests/e2e/test_chat_driver_roundtrip.sh
bash tests/e2e/test_operational_logging.sh
```

When changing one area, prefer the smallest relevant test first:

- Client/server protocol change: run `test_socket_connectivity.sh`, `test_device_request_response.sh`, and `test_chat_driver_roundtrip.sh`.
- Module build or lifecycle change: run `test_module_build.sh`, `test_module_lifecycle.sh`, and `test_device_node.sh`.
- Crypto/transform logic change: run `test_sha1_flow.sh` and `test_substitution_flow.sh`.
- Broad behavior change: run `make test` after focused scripts pass.

## Lint and Formatting

- There is no dedicated lint command today.
- There is no `clang-format` or `clang-tidy` configuration in the repo.
- Compiler warnings are the main enforced quality gate for user-space code:

```bash
make -C app/client
make -C app/server
```

Both compile with `-Wall -Wextra -Werror`, so warning-free builds are required.

For kernel code, the module build itself is the practical validation step:

```bash
make driver
```

## Coding Style

### General

- Match the existing C style in neighboring files.
- Prefer small, direct functions over adding abstraction layers.
- Preserve the current split: shared protocol in `app/shared`, server-only helpers in `app/server`, device-only helpers in `app/client` or `driver/module`.
- Do not introduce C++-style patterns or heavy macro metaprogramming.

### Includes

- Put the local project header first, then system headers.
- Leave one blank line between the local include block and system include block.
- Shared structs/constants should come from `app/shared/protocol.h` instead of being duplicated.
- Kernel module code uses Linux headers first, then the local contract header.

### Formatting

- Use 4 spaces for indentation.
- Opening braces usually stay on the same line in user-space and kernel code.
- Keep function signatures readable; wrapping long parameter lists across lines is acceptable and already used.
- Use one blank line between logical blocks, not after every statement.
- Keep lines reasonably short, but prioritize readability over aggressive wrapping.

### Types and Data

- Use repo typedefs ending in `_t` for protocol structs and enums, e.g. `chat_request_t`.
- Use `size_t` for buffer sizes and byte counts where appropriate.
- Use fixed-width integer types in shared protocol structures, e.g. `uint32_t`.
- Prefer stack allocation for request/response structs unless lifetime requires heap allocation.
- Zero-init structs with `memset(&value, 0, sizeof(value))` before populating them when the surrounding code follows that pattern.

### Naming

- Use `snake_case` for functions, variables, and file names.
- Use `UPPER_SNAKE_CASE` for macros, constants, and enum values.
- Prefix shared chat constants with `CHAT_`.
- Use descriptive verb-based function names like `server_validate_login`, `device_process_message`, `write_full`.
- File-static globals use a repo-specific prefix pattern such as `g_online_users` or `k_user_db_lock`; keep the existing file's style consistent instead of renaming everything.

### String and Buffer Handling

- Prefer `snprintf` over `strcpy`/`sprintf`.
- Strip trailing newlines explicitly after `fgets` using `strcspn` when handling user input.
- Respect the protocol buffer limits from `protocol.h`.
- Do not enlarge protocol fields casually; shared structs affect client, server, and kernel module together.

### Error Handling

- Return `0` for success and `-1` or an enum status for failure, matching the local file's convention.
- Validate pointer inputs early.
- Check all system call and file I/O results.
- In user-space code, print actionable errors to `stderr` when the current code path already logs failures.
- In kernel code, return Linux error codes such as `-EINVAL` and `-EFAULT`.
- Clean up acquired resources before returning on failure.

### Concurrency

- Existing server/client code uses `pthread_mutex_t` and `pthread_cond_t`; extend those patterns instead of introducing new threading primitives.
- Keep lock hold times short.
- Avoid calling helpers that also acquire the same lock unless the current design clearly supports it.
- For shared server state, maintain the established global lock plus helper-function approach.

### Networking and I/O

- Preserve the `read_full` / `write_full` style for fixed-size message transfers.
- Socket protocol is struct-based, not text-based; keep request and response sizes exact.
- For connection setup, follow the `getaddrinfo` and iteration pattern used in the client.

### Kernel Module Conventions

- Keep module entry/exit paths symmetrical.
- Use kernel logging with `pr_info` for normal operational traces already present in the module.
- Protect shared module state with the existing mutex.
- Do not add user-space-only headers or APIs to kernel code.
- Keep `/dev/device` contract changes synchronized with `device_contract.h` and `app/shared/protocol.h`.

## Change Guidance for Agents

- Build the smallest affected target first.
- Run the narrowest relevant test script before broader tests.
- If you change shared protocol fields or enums, update client, server, module, and relevant tests in the same change.
- If you change build or lifecycle behavior, review both root `Makefile` and `scripts/module_*.sh`.
- Do not assume Docker-based workflows; the current repo is host-oriented.

## Known Gaps

- No automated formatter is configured.
- No standalone lint tool is configured.
- Tests are mostly grep/assertion shell scripts, so manual reasoning still matters for behavioral changes.
