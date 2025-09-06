# Tasks: Remote Encryption Service

**Input**: Design documents from `/specs/007-remote-encryption-service/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No automated test tasks were generated because the specification did not explicitly require TDD or new automated tests. Validation tasks below focus on executable build and manual/integration verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare source layout and build targets for the new remote processing capability.

- [X] T001 Create the remote processing service directory and source scaffolding in `app/processor/`
- [X] T002 Update the top-level native build orchestration in `app/Makefile` to build the new processor target
- [X] T003 [P] Add a dedicated build target for the processor daemon in `app/processor/Makefile`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core processing abstractions and shared runtime configuration that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create a processing transport interface and runtime config declarations in `app/client/processing_client.h`
- [X] T005 Implement shared runtime config parsing and transport selection in `app/client/processing_client.c`
- [X] T006 [P] Refactor the existing local device path behind the new processing interface in `app/client/device_client.c`
- [X] T007 [P] Update client build inputs to include the new processing abstraction in `app/client/Makefile`
- [X] T008 Define processor service configuration constants shared by the daemon in `app/processor/processor_config.h`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Dùng mã hoá từ xa từ máy dev (Priority: P1) 🎯 MVP

**Goal**: Cho phép máy dev trên macOS gọi tới VPS để hash mật khẩu, mã hoá tin nhắn và giải mã tin nhắn bằng Linux-backed processing.

**Independent Test**: Build client và processor daemon, chạy daemon trên VPS, cấu hình client dùng backend remote, rồi xác minh login/register hash, outbound encryption và inbound decryption đều trả kết quả tương đương flow Linux local.

### Implementation for User Story 1

- [X] T009 [P] [US1] Implement remote TCP transport declarations in `app/client/remote_processing_client.h`
- [X] T010 [US1] Implement remote TCP request/response exchange in `app/client/remote_processing_client.c`
- [X] T011 [US1] Update client processing call sites for auth hashing, outbound encryption, and inbound decryption in `app/client/client.c`
- [X] T012 [P] [US1] Implement processor daemon request validation helpers in `app/processor/processor_validation.c`
- [X] T013 [P] [US1] Define processor daemon validation APIs in `app/processor/processor_validation.h`
- [X] T014 [US1] Implement the Linux-side processor daemon main loop and request handling in `app/processor/processor_server.c`
- [X] T015 [US1] Reuse the existing Linux device processing flow inside the daemon by extracting shared helpers into `app/client/device_client.c` and `app/client/device_client.h`
- [X] T016 [US1] Add processor daemon source files to the build target in `app/processor/Makefile`
- [X] T017 [US1] Document the remote backend environment/configuration expected by developers in `specs/007-remote-encryption-service/quickstart.md`
- [X] T018 [US1] Validate remote processing parity for SHA1, substitution encryption, and substitution decryption in `specs/007-remote-encryption-service/quickstart.md`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Giữ khả năng xử lý trên VPS tiếp tục chạy sau khi ngắt kết nối (Priority: P2)

**Goal**: Đảm bảo processor daemon trên VPS tiếp tục chạy sau khi đóng Terminus/SSH và có thể được kiểm tra/triển khai lại rõ ràng.

**Independent Test**: Cài service trên Ubuntu VPS, start service, đóng SSH/Terminus, reconnect, rồi xác minh service vẫn active và vẫn xử lý được request mới.

### Implementation for User Story 2

- [X] T019 [P] [US2] Create the `systemd` unit definition for the processor daemon in `deploy/systemd/chat-processor.service`
- [X] T020 [US2] Add daemon runtime flags or config loading needed by the service unit in `app/processor/processor_server.c`
- [X] T021 [US2] Document service lifecycle commands for start, stop, restart, status, and logs in `specs/007-remote-encryption-service/quickstart.md`
- [X] T022 [US2] Add VPS persistence verification steps for disconnect/reconnect behavior in `specs/007-remote-encryption-service/quickstart.md`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Cập nhật khả năng xử lý từ xa sau khi pull code mới (Priority: P3)

**Goal**: Cho phép operator pull code mới trên VPS và chạy một flow lặp lại được để rebuild, restart, và verify dịch vụ.

**Independent Test**: Pull revision mới trên VPS, chạy đúng flow triển khai đã tài liệu hoá, rồi xác minh service quay lại active và request xử lý mới thành công.

### Implementation for User Story 3

- [X] T023 [P] [US3] Create a deployment helper script for build and restart flow in `scripts/deploy_processor_service.sh`
- [X] T024 [US3] Update the deployment helper to verify build output and service restart status in `scripts/deploy_processor_service.sh`
- [X] T025 [US3] Document the post-`git pull` deployment flow for the VPS in `specs/007-remote-encryption-service/quickstart.md`
- [X] T026 [US3] Add operator verification and recovery steps for failed deployment runs in `specs/007-remote-encryption-service/quickstart.md`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final compatibility, failure-path handling, and end-to-end validation across all stories

- [X] T027 [P] Harden remote processing error mapping for malformed requests, unsupported modes, and device failures in `app/processor/processor_server.c`
- [X] T028 [P] Harden client-facing remote error handling and fallback messaging in `app/client/remote_processing_client.c` and `app/client/client.c`
- [X] T029 Confirm build instructions and file references are consistent across `specs/007-remote-encryption-service/plan.md`, `specs/007-remote-encryption-service/contracts/remote-processing-contract.md`, and `specs/007-remote-encryption-service/quickstart.md`
- [X] T030 Run full quickstart validation for local build, remote service startup, remote processing parity, persistence, and redeploy flow using `specs/007-remote-encryption-service/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 producing a runnable processor daemon
- **User Story 3 (Phase 5)**: Depends on User Story 2 service lifecycle assets being in place
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational - establishes the remote processing daemon and client integration
- **User Story 2 (P2)**: Depends on US1 because persistence only matters once the daemon exists
- **User Story 3 (P3)**: Depends on US2 because the redeploy flow builds on the persistent service model

### Within Each User Story

- Transport/config abstractions before client call-site migration
- Validation helpers before daemon request handling
- Runnable daemon before service persistence setup
- Service persistence setup before deployment automation
- Documentation updates should follow the implementation they describe

### Parallel Opportunities

- T003 can run in parallel with T002 after T001
- T006 and T007 can run in parallel after T004 and T005
- T009, T012, and T013 can run in parallel after Phase 2
- T019 can run in parallel with T020 once US1 daemon behavior is stable
- T023 can run in parallel with T025 after US2 service model is decided
- T027 and T028 can run in parallel during polish

---

## Parallel Example: User Story 1

```bash
# Launch remote transport and validation scaffolding together:
Task: "Implement remote TCP transport declarations in app/client/remote_processing_client.h"
Task: "Implement processor daemon request validation helpers in app/processor/processor_validation.c"
Task: "Define processor daemon validation APIs in app/processor/processor_validation.h"
```

---

## Parallel Example: User Story 2

```bash
# Prepare runtime persistence and documentation in parallel:
Task: "Create the systemd unit definition in deploy/systemd/chat-processor.service"
Task: "Document service lifecycle commands in specs/007-remote-encryption-service/quickstart.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop and validate remote processing from macOS against the VPS
5. Demo the remote encryption flow before adding persistence and redeploy automation

### Incremental Delivery

1. Finish Setup + Foundational to establish shared abstractions
2. Add User Story 1 to unlock remote Linux-backed processing for development
3. Add User Story 2 to keep the daemon alive after SSH/Terminus disconnects
4. Add User Story 3 to make pull/build/restart/verify repeatable on the VPS
5. Finish with polish and end-to-end verification

### Parallel Team Strategy

With multiple developers:

1. One developer handles client abstraction and remote transport
2. One developer handles processor daemon and Linux-device integration
3. One developer handles `systemd`, deploy automation, and quickstart updates once the daemon is runnable

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tasks use exact file paths and follow the required checklist format
- Suggested MVP scope: Phase 1 + Phase 2 + Phase 3 (User Story 1)
