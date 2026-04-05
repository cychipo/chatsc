# Quickstart — Remote Encryption Service

## Goal

Enable a developer on macOS to use Linux-backed password hashing, message encryption, and message decryption through a persistent VPS service.

## Preconditions

- Ubuntu VPS is reachable from the development machine.
- The Linux kernel device is installed and functional on the VPS.
- The feature branch code has been pulled onto the VPS.

## Operator flow on the VPS

1. Pull the latest code for the feature branch.
2. Rebuild the Linux-side binaries required for the processing daemon with `make -C app processor`.
3. Start or restart the persistent processing service.
4. Verify that the service is active.
5. Check logs if startup or processing verification fails.

## Developer flow on macOS

1. Configure the development environment to use the remote processing backend by setting `CHAT_PROCESSING_BACKEND=remote`.
2. Point the remote host setting to the VPS domain or IP with `CHAT_PROCESSOR_HOST` and `CHAT_PROCESSOR_PORT`.
3. Start the local development workflow.
4. Execute one password-processing check and one message encryption/decryption check.
5. Confirm that chat behavior matches the Linux-backed processing path.

## Verification checklist

- [x] Remote service stays available after SSH or Terminus disconnects.
- [x] A valid password-processing request returns a hash.
- [x] A valid message encryption request returns ciphertext.
- [x] A valid message decryption request returns plaintext.
- [x] Invalid or unsupported requests return clear failures.
- [x] A post-`git pull` rebuild and restart flow returns the service to active state.

## Validation results

Validated against the public processor endpoint at `sv.fayedark.com:9191` after public TCP access was opened.

- SHA1 parity check passed: password `hunter2` returned `f3bbbd66a63d4bf1747940578ec3d0103530e21d`, matching the expected SHA1 digest.
- Substitution encryption check passed: plaintext `hello remote processor` returned ciphertext `dsvvb nstbjs ynbzsuubn`.
- Substitution decryption check passed: decrypting `dsvvb nstbjs ynbzsuubn` returned `hello remote processor`.
- Unsupported mode validation passed: a request with mode `99` returned `STATUS_INVALID_REQUEST` with payload `unsupported-mode`.
- Connectivity check passed from the macOS development machine with `nc -vz sv.fayedark.com 9191`.

These checks satisfy the remote processing parity validation for hashing, encryption, decryption, and malformed-request handling.

## Service lifecycle commands on Ubuntu VPS

- Start service: `sudo systemctl start chat-processor`
- Stop service: `sudo systemctl stop chat-processor`
- Restart service: `sudo systemctl restart chat-processor`
- Service status: `sudo systemctl status chat-processor`
- Service logs: `sudo journalctl -u chat-processor -f`

## Post-pull deployment flow on the VPS

1. Pull the latest code for the active feature branch.
2. Run `scripts/deploy_processor_service.sh` from the repository root.
3. Confirm that the processor binary has been rebuilt.
4. Confirm that `chat-processor` is active after restart.
5. Run one remote hash check and one remote encrypt/decrypt check from the development machine.

## VPS persistence verification

1. Start or restart `chat-processor`.
2. Verify `sudo systemctl status chat-processor` reports the service as active.
3. Disconnect the SSH or Terminus session.
4. Reconnect later and verify the service is still active.
5. Execute a new remote processing request to confirm the daemon stayed available.

## Recovery flow

1. Inspect the service runtime status.
2. Inspect recent service logs.
3. Restart the service.
4. Re-run a single remote processing verification request.
5. If verification still fails, rebuild and redeploy the VPS binaries before retrying.

## Expected implementation touchpoints

- Client-side processing abstraction and runtime selection
- New Linux-side processing daemon
- Deployment/runtime management for the VPS service
- Shared compatibility with the existing chat protocol structs
