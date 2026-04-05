# Tasks: Gửi tin nhắn qua Socket

**Input**: Design documents from `/specs/006-socket-chat/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Không tạo task test riêng vì spec không yêu cầu TDD hoặc test-first; xác minh bằng quickstart, build và các test chat liên quan ở pha cuối.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3])
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `backend/test/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Chuẩn bị bề mặt thay đổi cho realtime chat ở cả backend và frontend

- [X] T001 Review current REST chat send flow and socket bootstrap in `backend/src/main.ts`, `backend/src/modules/chat/chat.controller.ts`, `frontend/src/services/chat.service.ts`, and `frontend/src/features/chat/chat.page.tsx`
- [X] T002 [P] Define shared realtime event/state types in `frontend/src/types/chat.ts` for connection status, socket events, and message dedupe metadata
- [X] T003 [P] Register required realtime dependencies and module wiring in `backend/src/modules/chat/chat.module.ts` and related backend package configuration if missing

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Hạ tầng realtime dùng chung phải xong trước khi làm theo user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Implement authenticated chat gateway connection lifecycle in `backend/src/modules/chat/chat.gateway.ts`
- [X] T005 [P] Add reusable socket authentication and client user extraction helpers in `backend/src/modules/chat/utils/socket-auth.util.ts` and related chat module providers
- [X] T006 [P] Add reusable conversation subscription and membership guard helpers in `backend/src/modules/chat/utils/socket-conversation.util.ts`
- [X] T007 Create frontend socket client service for connect/reconnect/disconnect lifecycle in `frontend/src/services/chat-socket.service.ts`
- [X] T008 Integrate connection status state into chat page/store flow in `frontend/src/features/chat/chat.page.tsx`

**Checkpoint**: Foundation ready - realtime send/receive stories can now begin

---

## Phase 3: User Story 1 - Gửi tin nhắn tức thời trong cuộc trò chuyện đang mở (Priority: P1) 🎯 MVP

**Goal**: Cho phép người dùng gửi message qua socket trong conversation đang mở thay cho REST per-message

**Independent Test**: Mở một conversation có sẵn, gửi một tin nhắn từ composer bằng Enter hoặc nút gửi, và xác nhận tin nhắn xuất hiện ngay trong thread mà không reload trang.

### Implementation for User Story 1

- [X] T009 [US1] Implement socket `join_conversation`, `leave_conversation`, and `send_message` handlers in `backend/src/modules/chat/chat.gateway.ts`
- [X] T010 [US1] Reuse `ChatService` persistence and participant checks for socket send flow in `backend/src/modules/chat/chat.service.ts`
- [X] T011 [US1] Normalize realtime message payload and conversation preview payload in `backend/src/modules/chat/chat.gateway.ts` and `backend/src/modules/chat/chat.service.ts`
- [X] T012 [US1] Refactor frontend send action to use socket service instead of REST per-message in `frontend/src/services/chat.service.ts` and `frontend/src/features/chat/chat.page.tsx`
- [X] T013 [P] [US1] Update composer keyboard behavior for Enter send and Shift+Enter newline in `frontend/src/features/chat/components/chat-composer.tsx`
- [X] T014 [US1] Add client-side empty-message blocking and send failure feedback in `frontend/src/features/chat/chat.page.tsx`
- [X] T015 [US1] Add message dedupe by server message id when local sender receives echo/delivery event in `frontend/src/features/chat/chat.page.tsx`

**Checkpoint**: User Story 1 should allow realtime sending in the active conversation and keep single-message rendering per send

---

## Phase 4: User Story 2 - Nhận tin nhắn thời gian thực từ người tham gia khác (Priority: P2)

**Goal**: Đưa message mới và conversation preview tới đúng người tham gia đang kết nối mà không cần refresh

**Independent Test**: Mở cùng một conversation trên hai phiên, gửi từ phiên A, và xác nhận phiên B nhận message mới ngay; sidebar preview/order cập nhật mà không reload.

### Implementation for User Story 2

- [X] T016 [US2] Emit message delivery events to subscribed conversation participants in `backend/src/modules/chat/chat.gateway.ts`
- [X] T017 [US2] Emit conversation preview updates for affected participants in `backend/src/modules/chat/chat.gateway.ts`
- [X] T018 [US2] Join the selected conversation and leave the previous one from the frontend socket lifecycle in `frontend/src/features/chat/chat.page.tsx`
- [X] T019 [P] [US2] Consume incoming realtime message events and merge them into the active thread in `frontend/src/features/chat/chat.page.tsx`
- [X] T020 [P] [US2] Consume preview update events and refresh conversation list ordering/preview in `frontend/src/features/chat/chat.page.tsx` and `frontend/src/features/chat/components/conversation-list.tsx`
- [X] T021 [US2] Preserve existing REST history loading while combining it safely with live socket delivery in `frontend/src/services/chat.service.ts` and `frontend/src/features/chat/chat.page.tsx`

**Checkpoint**: User Story 2 should deliver live incoming messages and sidebar updates across concurrent chat participants

---

## Phase 5: User Story 3 - Khôi phục ổn định khi kết nối bị gián đoạn (Priority: P3)

**Goal**: Hiển thị trạng thái kết nối rõ ràng và cho phép tiếp tục chat sau reconnect ngắn

**Independent Test**: Ngắt kết nối tạm thời khi đang chat, khôi phục mạng, và xác nhận UI báo trạng thái phù hợp rồi cho phép gửi tiếp message mà không cần reload app.

### Implementation for User Story 3

- [X] T022 [US3] Add backend handling for reconnect-safe rejoin and unauthorized socket error responses in `backend/src/modules/chat/chat.gateway.ts`
- [X] T023 [US3] Surface socket connection states `connecting`, `connected`, `reconnecting`, and `disconnected` from `frontend/src/services/chat-socket.service.ts`
- [X] T024 [US3] Render connection status and reconnect feedback in `frontend/src/features/chat/chat.page.tsx`
- [X] T025 [US3] Block or clearly fail send attempts while socket is unavailable in `frontend/src/features/chat/chat.page.tsx` and `frontend/src/features/chat/components/chat-composer.tsx`
- [X] T026 [US3] Rejoin the active conversation automatically after reconnect in `frontend/src/services/chat-socket.service.ts` and `frontend/src/features/chat/chat.page.tsx`
- [X] T027 [US3] Prevent duplicate message rendering during reconnect/replay scenarios in `frontend/src/features/chat/chat.page.tsx`

**Checkpoint**: User Story 3 should make connection loss visible and allow stable recovery without reloading the application

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hoàn thiện và xác minh toàn bộ feature socket chat

- [X] T028 [P] Remove obsolete REST per-message send plumbing and temporary debug code from `backend/src/modules/chat/chat.controller.ts`, `backend/src/main.ts`, and `frontend/src/services/chat.service.ts`
- [X] T029 [P] Align contract and quickstart docs with final event names/payloads in `specs/006-socket-chat/contracts/socket-chat-contract.md` and `specs/006-socket-chat/quickstart.md`
- [X] T030 Run backend chat tests and targeted frontend verification for realtime flow via project test commands
- [X] T031 Run manual validation from `specs/006-socket-chat/quickstart.md` and fix any final socket chat issues in affected backend/frontend files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion and reuses realtime primitives from Phase 2; can begin after US1 send path exists
- **User Story 3 (Phase 5)**: Depends on Foundational completion and should be done after core send/receive flow from US1 and US2 is stable
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: First deliverable and MVP; no dependency on other user stories after Foundational
- **US2 (P2)**: Depends on shared gateway/socket lifecycle and benefits from US1 event payload normalization
- **US3 (P3)**: Depends on shared gateway/socket lifecycle and final send/receive behavior from US1 + US2

### Within Each User Story

- Backend socket handlers before frontend integration for the same event path
- Event payload normalization before client-side merge/update logic
- Connection-state surfacing before reconnect UI and blocked-send behavior
- Deduplication before reconnect/replay validation

### Parallel Opportunities

- T002 and T003 can run in parallel after T001
- T005, T006, and T007 can run in parallel once realtime direction is confirmed from Setup
- In US1, T013 can run in parallel with T009-T012
- In US2, T019 and T020 can run in parallel after T016-T018 establish event flow
- In Polish, T028 and T029 can run in parallel before final verification

---

## Parallel Example: User Story 2

```bash
# After backend emitters and frontend join/leave flow are in place:
Task: "Consume incoming realtime message events in frontend/src/features/chat/chat.page.tsx"
Task: "Consume preview update events in frontend/src/features/chat/chat.page.tsx and frontend/src/features/chat/components/conversation-list.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate realtime send in the active conversation
5. Demo/send messages without REST per-message calls

### Incremental Delivery

1. Finish Setup + Foundational to establish authenticated socket lifecycle
2. Deliver US1 so active-conversation sending works over realtime
3. Deliver US2 so other participants and sidebar previews update live
4. Deliver US3 so reconnect/status behavior is production-safe
5. Finish Polish with quickstart validation and cleanup

### Suggested MVP Scope

- **MVP**: Phase 1 + Phase 2 + Phase 3 (US1)
- Đây là lát cắt nhỏ nhất chứng minh việc gửi message đã chuyển từ REST per-message sang socket

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to a specific user story for traceability
- Each user story remains independently testable using its stated independent test
- Prefer reusing existing `ChatService` membership and persistence logic instead of creating a second message flow
- Keep REST for history/pagination; socket scope is live delivery only
