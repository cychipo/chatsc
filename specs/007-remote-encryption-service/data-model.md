# Data Model — Remote Encryption Service

## 1. Remote Processing Request

Represents one developer-initiated processing operation sent to the VPS daemon.

### Fields

- `message_id`: Numeric request identifier used to correlate responses.
- `request_type`: Indicates the originating chat use case (login, register, chat message, logout, select peer).
- `mode`: Processing mode requested from the Linux-backed processor.
- `username`: Requesting user identity when applicable.
- `peer_username`: Target peer for chat-related requests when applicable.
- `auth_payload`: Credential-derived input for password-processing operations.
- `payload`: The value to encrypt or decrypt.
- `plaintext_payload`: Original plaintext retained for compatibility with current chat behavior when needed.

### Validation rules

- Must include a supported `mode`.
- Authentication requests require `username` and `auth_payload`.
- Peer-selection requests require `peer_username`.
- Chat-message requests require both `peer_username` and `payload`.
- String fields must fit within the shared chat protocol size limits.

### State transitions

- `received` → `validated` → `forwarded to Linux processor` → `completed`
- `received` → `rejected` if validation fails
- `forwarded to Linux processor` → `failed` if the Linux processor is unavailable or returns an error

## 2. Remote Processing Result

Represents the VPS daemon response returned to the development caller.

### Fields

- `message_id`: Mirrors the originating request identifier.
- `response_type`: Response category for the request.
- `status`: Processing outcome.
- `from_username`: Originating user identifier when relevant.
- `peer_username`: Peer identifier when relevant.
- `payload`: Processed result or error payload.

### Validation rules

- Must preserve the originating `message_id`.
- Must include a status for every request.
- Successful responses for supported processing modes must contain the processed payload.
- Failure responses must contain a machine-usable status and human-readable failure payload.

### State transitions

- `pending` → `success`
- `pending` → `failure`

## 3. Processing Runtime Configuration

Represents the caller-visible configuration used to select local or remote processing.

### Fields

- `processing_backend`: Selects local device processing or remote VPS processing.
- `device_path`: Local Linux device path when local processing is used.
- `remote_host`: VPS host or domain for remote processing.
- `remote_port`: Listening port for the remote daemon.
- `connect_timeout`: Maximum wait time when opening a remote connection.

### Validation rules

- Local processing requires a non-empty device path.
- Remote processing requires a host and port.
- Timeout values must be positive and bounded.

## 4. Service Runtime State

Represents the observable status of the daemon on the VPS.

### Fields

- `service_name`: Stable identifier used for operational commands.
- `run_state`: Current status such as active, inactive, failed, or restarting.
- `last_start_time`: Most recent successful start time.
- `last_error`: Most recent recoverable or fatal runtime error when present.

### State transitions

- `inactive` → `starting` → `active`
- `active` → `restarting`
- `active` → `failed`
- `failed` → `restarting` → `active`

## 5. Deployment Run

Represents one operator attempt to refresh the VPS service after pulling code changes.

### Fields

- `revision_ref`: Code revision deployed to the VPS.
- `build_result`: Whether the Linux binaries were rebuilt successfully.
- `restart_result`: Whether the daemon was returned to service.
- `verification_result`: Whether a post-deploy processing check succeeded.

### Validation rules

- A deployment run is only successful if build, restart, and verification all succeed.
- A failed deployment run must leave enough observable status for the operator to diagnose the issue.
