# Implementation Plan: Remote Encryption Service

**Branch**: `007-remote-encryption-service` | **Date**: 2026-04-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-remote-encryption-service/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add a Linux-hosted remote processing daemon that reuses the existing `chat_request_t` / `chat_response_t` contract and forwards requests to the kernel device on the Ubuntu VPS. Refactor client-side processing calls so development environments can switch between the current local device path and the new remote path, and run the VPS daemon under `systemd` so it remains available after SSH/Terminus disconnects and can be redeployed with a single repeatable flow.

## Technical Context

**Language/Version**: C with GCC on Linux for the processing daemon and existing C client/server binaries  
**Primary Dependencies**: POSIX sockets, pthreads, the existing shared protocol structs, the existing device access flow, Linux kernel character device access  
**Storage**: N/A for the processing daemon; existing file-backed user database remains unchanged  
**Testing**: Existing Makefile-based native builds plus feature-specific manual/integration verification for local-vs-remote processing parity  
**Target Platform**: Ubuntu VPS for the daemon and kernel device; macOS and Linux development machines as callers  
**Project Type**: Native C client/server application with Linux kernel module integration and an added internal processing service  
**Performance Goals**: Match current processing results and return 95% of valid remote processing requests within 2 seconds under normal development load  
**Constraints**: Must preserve existing chat request/result shapes, must not require a persistent interactive VPS terminal session, must survive SSH disconnects, must keep Linux-only processing authoritative on the VPS  
**Scale/Scope**: Single developer-oriented VPS processing service supporting current chat processing modes for development and testing workflows

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution file at `.specify/memory/constitution.md` is still an unfilled template and does not define enforceable project principles or gates. No concrete constitutional violations are identifiable from the current repository state or this feature design.

### Pre-Phase-0 Gate Result

- No actionable constitution rules are defined.
- Planning may proceed.

### Post-Phase-1 Re-check

- Design artifacts remain consistent with the current repository structure and do not introduce any identifiable constitution conflicts.
- No gate failures found.

## Project Structure

### Documentation (this feature)

```text
specs/007-remote-encryption-service/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── remote-processing-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── Makefile
├── shared/
│   ├── protocol.h
│   └── protocol.c
├── client/
│   ├── client.c
│   ├── device_client.h
│   ├── device_client.c
│   └── Makefile
└── server/
    ├── server.c
    ├── server_protocol.h
    ├── server_protocol.c
    └── Makefile

driver/
└── module/
    ├── chat_driver.c
    ├── chat_driver_main.c
    ├── device_contract.h
    ├── sha1_digest.c
    └── substitution.c
```

**Structure Decision**: Keep the existing `app/` and `driver/module/` layout. Add the new remote processing daemon alongside the existing native application code under `app/`, extend the shared processing access layer used by the client, and keep the Linux kernel driver contract centralized in `driver/module/` and `app/shared/`.

## Phase 0: Research Summary

1. Use `systemd` on Ubuntu to run the remote processing daemon persistently.
2. Expose a small TCP daemon that reuses `chat_request_t` and `chat_response_t` as the remote processing contract.
3. Introduce a processing transport abstraction so the current client flow can choose local device access or remote VPS processing at runtime.
4. Reuse the existing device write/read flow inside the daemon to keep Linux-backed processing authoritative.
5. Standardize deployment as pull → build → restart service → verify.

## Phase 1: Design Plan

### 1. Processing access refactor

- Extract the current Linux-device processing path behind a shared processing interface.
- Keep the existing local device-backed implementation for Linux environments.
- Add a remote TCP-backed implementation that sends `chat_request_t` to the VPS daemon and receives `chat_response_t`.
- Update client call sites that currently use `device_process_message()` so they rely on runtime-selected processing instead of assuming `/dev/device` is local.

### 2. VPS processing daemon

- Add a new Linux-only daemon that listens on a configured host/port.
- For each incoming request, validate the shared request struct, forward it through the existing device processing flow, and return the shared response struct.
- Handle malformed requests, unsupported modes, device-open failures, and incomplete device reads/writes with explicit failure responses.
- Ensure the daemon can serve multiple development callers safely.

### 3. Deployment/runtime management

- Add a service unit definition and deployment instructions suitable for `systemd` on Ubuntu.
- Document the restart/status/log verification flow required after a new `git pull`.
- Ensure the daemon can be rebuilt and restarted without needing a live interactive shell session.

### 4. Verification coverage

- Verify parity for the three currently supported processing modes: SHA1 hashing, substitution encryption, and substitution decryption.
- Verify client behavior when the remote host is unreachable or returns processing failures.
- Verify the service remains available after SSH/Terminus disconnects and across manual restarts.

## Phase 2: Task Planning Preview

Expected implementation task groups for `/speckit.tasks`:

1. Add processing transport abstraction and runtime configuration.
2. Implement the remote processing client transport.
3. Implement the VPS processing daemon using the existing Linux device path.
4. Update client flows to use the new abstraction for auth hashing, outbound encryption, and inbound decryption.
5. Add deployment/runtime assets for persistent service management on Ubuntu.
6. Add verification steps for parity, failure handling, and service persistence.

## Complexity Tracking

No constitution violations or exceptional complexity justifications are currently required.
