# Remote Processing Contract

## Purpose

Define the contract between development callers and the VPS-hosted processing daemon.

## Transport

- Persistent or short-lived TCP connections are both acceptable as long as each request receives exactly one response.
- The daemon accepts one serialized `chat_request_t` per processing operation.
- The daemon returns one serialized `chat_response_t` for each accepted request.

## Request shape

The request payload reuses the existing shared structure from `app/shared/protocol.h`.

### Required behavior

- `message_id` must be echoed back in the response.
- `mode` determines which Linux-backed processing path is executed.
- `request_type` remains populated so existing validation and compatibility rules can be reused.
- Unsupported modes must return a failure response rather than closing the connection silently.

## Response shape

The response payload reuses the existing shared structure from `app/shared/protocol.h`.

### Required behavior

- Successful processing returns `STATUS_OK` with the processed result in `payload`.
- Validation or transport-safe failures return a non-success status and a human-readable error payload.
- Device access failures return a driver-related failure status.

## Supported operations

| Operation | Request expectations | Success response |
|-----------|----------------------|------------------|
| Password processing | Valid auth request with `auth_payload` populated and SHA1 mode selected | Hashed value returned in `payload` |
| Message encryption | Valid chat request with plaintext carried in `payload` and substitution mode selected | Ciphertext returned in `payload` |
| Message decryption | Valid chat request with encrypted text carried in `payload` and substitution-decrypt mode selected | Plaintext returned in `payload` |

## Compatibility rules

- The remote daemon must preserve the same result semantics currently produced by the Linux device path.
- Development callers must be able to switch between local and remote processing without changing higher-level chat behavior.
- The daemon is a processing service only; it does not own chat session management or peer routing.

## Error scenarios

- Invalid request shape or missing required fields
- Unsupported processing mode
- Linux device unavailable
- Linux device returned an error or incomplete response
- Remote host unreachable or connection interrupted before a response is returned

## Versioning rule

- Any future contract change must either preserve compatibility with the current shared structs or introduce an explicit versioning strategy before rollout.
