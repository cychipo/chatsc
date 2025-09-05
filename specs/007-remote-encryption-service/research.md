# Phase 0 Research — Remote Encryption Service

## Decision 1: Run the VPS processing service under systemd

- **Decision**: Use a native `systemd` service on the Ubuntu VPS to run the remote processing daemon.
- **Rationale**: This is the simplest reliable way to keep a small C service running after Terminus or SSH disconnects, restart it after code updates, and restore it automatically after a reboot. It also gives built-in status and logs, which aligns with the requirement to verify service health after deployment.
- **Alternatives considered**:
  - **tmux/screen/nohup**: acceptable for temporary manual runs, but too fragile for a long-lived developer dependency.
  - **Docker**: workable, but adds packaging and operational overhead for a single small service.
  - **Supervisor-like tools**: duplicate capabilities already available by default on Ubuntu.

## Decision 2: Preserve the existing processing contract over a small TCP daemon

- **Decision**: Add a standalone processing daemon on the Linux VPS that accepts `chat_request_t` over TCP and returns `chat_response_t`, then forwards each request to the existing kernel device.
- **Rationale**: The current processing boundary already exists in `device_process_message()` and shared request/response structs. Reusing those shapes avoids redesigning the chat protocol, keeps the Linux-only dependency outside the chat server, and minimizes code churn in the existing client and server.
- **Alternatives considered**:
  - **Move processing into the chat server**: centralizes Linux access, but mixes chat routing with crypto processing and changes trust boundaries.
  - **Backend proxy to VPS service**: adds an extra hop and additional server-side contract changes.
  - **HTTP/JSON wrapper**: easier to inspect manually, but unnecessary translation overhead for a fixed C-struct contract.

## Decision 3: Keep processing as a client-side concern with a pluggable transport

- **Decision**: Refactor the current device access behind a processing transport abstraction with two implementations: local device access for Linux and remote TCP access for development on macOS.
- **Rationale**: The current client calls the device directly for SHA1 hashing, outbound substitution encryption, and inbound substitution decryption. A transport abstraction preserves current behavior while allowing the same call sites to switch between local and remote processing based on runtime configuration.
- **Alternatives considered**:
  - **Fork the client into Linux and macOS variants**: duplicates behavior and increases maintenance burden.
  - **Always use remote processing**: would remove local Linux support unnecessarily.

## Decision 4: Reuse the kernel-device request flow inside the daemon

- **Decision**: The new daemon should use the same formatting and device write/read flow now implemented in `app/client/device_client.c`.
- **Rationale**: This keeps the driver contract authoritative in one place and ensures the remote daemon produces byte-for-byte equivalent results for supported modes.
- **Alternatives considered**:
  - **Reimplement the substitution and SHA1 algorithms in user space**: would weaken the requirement to exercise the real Linux-backed processing path.

## Decision 5: Deploy updates with a single documented VPS flow

- **Decision**: Standardize the operator flow as: pull code, rebuild the Linux binaries, restart the `systemd` unit, verify status, and perform a simple remote processing check.
- **Rationale**: This directly satisfies the spec requirement for a repeatable post-pull deployment flow and removes dependence on an interactive terminal session remaining open.
- **Alternatives considered**:
  - **Manual binary replacement without service management**: too error-prone.
  - **Ad hoc shell sessions**: hard to repeat consistently.

## Operational consequences

- The processing daemon must bind to a stable host/port on the VPS and handle concurrent developer requests safely.
- The daemon must surface clear failures when the device cannot be opened, a request is malformed, or an unsupported mode is requested.
- The macOS development environment will need configuration for remote host/port selection, while Linux can retain the current local device path.
- Deployment documentation must include status, restart, and log inspection commands so operators can recover the service without guesswork.
