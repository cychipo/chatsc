# Tasks: Hệ thống chat Socket với Docker và Kernel Module

**Input**: Design documents from `/specs/001-socket-chat-kmod/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Có bao gồm test tasks vì spec yêu cầu smoke tests, kiểm thử tích hợp và demo end-to-end.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- User-space application: `app/client/`, `app/server/`
- Kernel module: `driver/module/`
- Host-native runtime helpers: `scripts/`
- Test assets: `tests/integration/`, `tests/e2e/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Khởi tạo cấu trúc dự án và tài liệu build/runtime dùng chung

- [x] T001 Create source directory structure in app/client/, app/server/, driver/module/, scripts/, tests/integration/, and tests/e2e/
- [x] T002 Create top-level build orchestration in Makefile

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Nền tảng bắt buộc cho tất cả user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create shared protocol definitions for message and processing modes in app/shared/protocol.h
- [x] T007 [P] Create common build rules for client, server, and driver in app/Makefile and driver/module/Makefile
- [x] T008 [P] Create driver interface header for device interactions in driver/module/device_contract.h
- [x] T009 Create module lifecycle helper script in scripts/module_load.sh
- [x] T010 [P] Create module unload helper script in scripts/module_unload.sh
- [x] T011 [P] Create Linux host privilege guidance in README.md and driver/module/README.md
- [x] T012 Create shared smoke test harness for build and runtime checks in tests/integration/test_smoke_setup.sh

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Chuẩn bị môi trường phát triển thống nhất (Priority: P1) 🎯 MVP

**Goal**: Cung cấp môi trường Ubuntu/Linux host có đủ công cụ build để developer build và chạy ứng dụng user-space thống nhất.

**Independent Test**: Xác nhận host có đủ công cụ build và build được client/server hoàn toàn từ source trên host.

### Tests for User Story 1 ⚠️

- [x] T013 [P] [US1] Create host prerequisite verification test in tests/integration/test_dev_container_tools.sh
- [x] T014 [P] [US1] Create user-space build verification test in tests/integration/test_user_space_build.sh

### Implementation for User Story 1

- [x] T015 [P] [US1] Document required Ubuntu build tools in README.md
- [x] T017 [P] [US1] Create client build target in app/client/Makefile
- [x] T018 [P] [US1] Create server build target in app/server/Makefile
- [x] T019 [US1] Create client application skeleton in app/client/client.c
- [x] T020 [US1] Create server application skeleton in app/server/server.c
- [x] T021 [US1] Document developer startup and build flow in README.md and app/server/README.md

**Checkpoint**: User Story 1 should let a developer build the user-space application entirely on the Ubuntu/Linux host environment.

---

## Phase 4: User Story 2 - Nạp driver và cung cấp điểm truy cập thiết bị (Priority: P1)

**Goal**: Cho phép build, load, verify và unload kernel module an toàn từ context container phù hợp, đồng thời expose device node cho ứng dụng.

**Independent Test**: Build được module `.ko`, nạp được module vào kernel đích, xác nhận device node xuất hiện, và unload an toàn khi device không còn được dùng.

### Tests for User Story 2 ⚠️

- [x] T022 [P] [US2] Create kernel module build verification test in tests/integration/test_module_build.sh
- [x] T023 [P] [US2] Create module lifecycle verification test in tests/integration/test_module_lifecycle.sh
- [x] T024 [P] [US2] Create device node availability test in tests/integration/test_device_node.sh

### Implementation for User Story 2

- [x] T025 [P] [US2] Create kernel module source skeleton in driver/module/chat_driver.c
- [x] T026 [US2] Implement module init and exit lifecycle handlers in driver/module/chat_driver.c
- [x] T027 [US2] Implement character device registration and device node exposure in driver/module/chat_driver.c
- [x] T028 [US2] Configure kernel module build artifact target in driver/module/Makefile
- [x] T029 [US2] Configure host-native module operation targets in Makefile
- [x] T030 [US2] Implement module load workflow in scripts/module_load.sh
- [x] T031 [US2] Implement safe module unload workflow in scripts/module_unload.sh
- [x] T032 [US2] Document module load, verify, and unload steps in driver/module/README.md

**Checkpoint**: User Story 2 should let the team manage the full module lifecycle and verify device node readiness independently of socket chat.

---

## Phase 5: User Story 3 - Xử lý dữ liệu qua driver và trả kết quả về client (Priority: P1)

**Goal**: Cho phép client ghi message vào device, để driver xử lý theo chế độ substitution hoặc SHA1, rồi đọc lại kết quả tương ứng.

**Independent Test**: Gửi message mẫu từ client đến device, xác nhận driver trả về kết quả đúng và lặp lại nhất quán cho cùng input ở cả hai chế độ xử lý.

### Tests for User Story 3 ⚠️

- [x] T033 [P] [US3] Create substitution processing integration test in tests/integration/test_substitution_flow.sh
- [x] T034 [P] [US3] Create SHA1 processing integration test in tests/integration/test_sha1_flow.sh
- [x] T035 [P] [US3] Create request-response consistency test in tests/integration/test_device_request_response.sh

### Implementation for User Story 3

- [x] T036 [P] [US3] Implement device open, read, write, and release handlers in driver/module/chat_driver.c
- [x] T037 [P] [US3] Implement substitution processing logic in driver/module/substitution.c
- [x] T038 [P] [US3] Implement SHA1 processing logic in driver/module/sha1_digest.c
- [x] T039 [US3] Wire processing mode dispatch into driver request handling in driver/module/chat_driver.c
- [x] T040 [US3] Implement user-space device client wrapper in app/client/device_client.c
- [x] T041 [US3] Implement message request formatting and result parsing in app/client/device_client.c
- [x] T042 [US3] Update interactive client flow to send requests to /dev/device in app/client/client.c
- [x] T043 [US3] Document supported processing modes and sample inputs in app/client/README.md

**Checkpoint**: User Story 3 should prove the core loop `Client -> /dev/device -> Driver -> Client` without requiring socket chat.

---

## Phase 6: User Story 4 - Truyền message chat giữa client và server qua mạng host (Priority: P2)

**Goal**: Tích hợp socket chat giữa client và server trên Ubuntu/Linux host, với dữ liệu hiển thị phản ánh kết quả sau bước xử lý bởi driver.

**Independent Test**: Khởi động server, kết nối client, gửi message chat, và xác nhận phản hồi hiển thị ở client khớp với dữ liệu đã đi qua driver.

### Tests for User Story 4 ⚠️

- [x] T044 [P] [US4] Create socket connection integration test in tests/integration/test_socket_connectivity.sh
- [x] T045 [P] [US4] Create processed chat message end-to-end test in tests/e2e/test_chat_driver_roundtrip.sh

### Implementation for User Story 4

- [x] T046 [P] [US4] Implement server socket accept and message loop in app/server/server.c
- [x] T047 [P] [US4] Implement client socket session flow in app/client/client.c
- [x] T048 [US4] Implement server-side response handling contract in app/server/server_protocol.c
- [x] T049 [US4] Integrate device processing into client chat send flow in app/client/client.c
- [x] T050 [US4] Configure client and server startup flow on the host network in Makefile and README.md
- [x] T051 [US4] Document chat startup and connectivity flow in app/server/README.md

**Checkpoint**: User Story 4 should deliver an end-to-end chat session over sockets with driver-mediated processing visible to the user.

---

## Phase 7: User Story 5 - Quan sát, kiểm thử và bàn giao hệ thống (Priority: P3)

**Goal**: Cung cấp log vận hành, smoke/e2e validation và tài liệu để tester hoặc thành viên mới có thể tự dựng và demo hệ thống.

**Independent Test**: Một thành viên mới làm theo tài liệu để dựng môi trường, chạy smoke tests, thực hiện demo đầu-cuối và dùng log để chẩn đoán lỗi tích hợp phổ biến.

### Tests for User Story 5 ⚠️

- [x] T052 [P] [US5] Create end-to-end demo validation script in tests/e2e/test_demo_flow.sh
- [x] T053 [P] [US5] Create troubleshooting validation checklist script in tests/e2e/test_operational_logging.sh

### Implementation for User Story 5

- [x] T054 [P] [US5] Add lifecycle and device operation logging in driver/module/chat_driver.c
- [x] T055 [US5] Add startup and connection logging in app/server/server.c and app/client/client.c
- [x] T056 [US5] Create demo runbook in docs/demo-runbook.md
- [x] T057 [US5] Create troubleshooting guide for common integration failures in docs/troubleshooting.md
- [x] T058 [US5] Update project quickstart instructions in README.md

**Checkpoint**: User Story 5 should let a new team member build, run, validate, and troubleshoot the system with project documentation and logs only.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Hoàn thiện các hạng mục ảnh hưởng nhiều user stories

- [x] T059 [P] Validate full quickstart flow against specs/001-socket-chat-kmod/quickstart.md
- [x] T060 [P] Run full integration and e2e test suite from tests/integration/ and tests/e2e/
- [x] T061 Review build, runtime, and test commands for consistency in Makefile, scripts/, and docs
- [x] T062 Perform cross-story cleanup for shared protocol and driver interfaces in app/shared/protocol.h and driver/module/device_contract.h
- [x] T063 Refactor the project from Docker-first workflow to Ubuntu/Linux host workflow in Makefile, README.md, docs/, tests/, and specs/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion; independent of US1 deliverable after shared setup exists
- **User Story 3 (Phase 5)**: Depends on User Story 2 because device lifecycle and node exposure must exist first
- **User Story 4 (Phase 6)**: Depends on User Story 1 and User Story 3 because chat integration relies on built client/server and device processing loop
- **User Story 5 (Phase 7)**: Depends on User Stories 1-4 because observability and handoff validate the whole system
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1**: Can start after Foundational - independent MVP slice for containerized build environment
- **US2**: Can start after Foundational - independent module lifecycle slice
- **US3**: Depends on US2 - core processing slice for `/dev/device` loop
- **US4**: Depends on US1 and US3 - chat transport layered on top of working processing loop
- **US5**: Depends on US1-US4 - validation, observability, and handoff slice

### Within Each User Story

- Tests for the story should be written before implementation and used as completion checks
- Build/runtime configuration before story-specific integration
- Driver lifecycle before device processing
- Device processing before chat transport integration
- Logging and documentation after story behavior is functional

### Parallel Opportunities

- **Setup**: T003, T004, T005 can run in parallel after T001-T002 planning starts
- **Foundational**: T007, T008, T010, T011 can run in parallel after T006 is defined
- **US1**: T013 and T014 can run in parallel; T017 and T018 can run in parallel; T015 and T021 can proceed independently
- **US2**: T022, T023, T024 can run in parallel; T025 and T029 can run in parallel before workflow wiring
- **US3**: T033, T034, T035 can run in parallel; T037 and T038 can run in parallel; T040 and T041 can run in parallel
- **US4**: T044 and T045 can run in parallel; T046 and T047 can run in parallel
- **US5**: T052 and T053 can run in parallel; T054 and T056 can run in parallel

---

## Parallel Example: User Story 3

```bash
# Launch processing tests together:
Task: "Create substitution processing integration test in tests/integration/test_substitution_flow.sh"
Task: "Create SHA1 processing integration test in tests/integration/test_sha1_flow.sh"
Task: "Create request-response consistency test in tests/integration/test_device_request_response.sh"

# Launch processing implementations together:
Task: "Implement substitution processing logic in driver/module/substitution.c"
Task: "Implement SHA1 processing logic in driver/module/sha1_digest.c"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 2
5. Complete Phase 5: User Story 3
6. **STOP and VALIDATE**: Demo the core loop `Client -> /dev/device -> Driver -> Client`

### Incremental Delivery

1. Setup + Foundational → project skeleton ready
2. US1 → developer environment ready
3. US2 → module lifecycle ready
4. US3 → kernel processing loop ready (core MVP)
5. US4 → socket chat integration ready
6. US5 → onboarding, observability, and handoff ready

### Parallel Team Strategy

1. One developer owns Docker/build setup and shared protocol work
2. One developer owns kernel module lifecycle and processing tasks
3. One developer owns client/server user-space integration tasks once shared contracts stabilize
4. Final pass aligns logging, quickstart validation, and cross-story cleanup

---

## Notes

- [P] tasks = different files, no blocking dependency on unfinished parallel work
- [Story] label maps each task to its user story for traceability
- Every task includes an exact target file path
- Tasks are ordered so each user story can be validated as an independent increment
- Suggested MVP scope: complete through **US3** to prove the core driver-processing loop before socket integration
