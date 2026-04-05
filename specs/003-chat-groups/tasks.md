# Tasks: Chat Groups

**Input**: Design documents from `/specs/003-chat-groups/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/chat-api.yaml, quickstart.md

**Tests**: Có bao gồm task test vì spec có User Scenarios & Testing và Success Criteria định lượng.

**Organization**: Tasks được nhóm theo user story để triển khai và kiểm thử độc lập.

## Format: `[ID] [P?] [Story?] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Chuẩn bị khung chat module và frontend wiring tối thiểu.

- [ ] T001 Tạo file schema conversation trong backend/src/modules/chat/schemas/conversation.schema.ts
- [ ] T002 [P] Tạo file schema participant trong backend/src/modules/chat/schemas/conversation-participant.schema.ts
- [ ] T003 [P] Tạo file schema message trong backend/src/modules/chat/schemas/message.schema.ts
- [ ] T004 [P] Tạo file schema membership event trong backend/src/modules/chat/schemas/membership-event.schema.ts
- [ ] T005 Tạo DTO chat cơ bản trong backend/src/modules/chat/dto/chat.dto.ts
- [ ] T006 Tạo chat service skeleton trong backend/src/modules/chat/chat.service.ts
- [ ] T007 Cập nhật module wiring cho chat schemas/service trong backend/src/modules/chat/chat.module.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Nền tảng dùng chung cho mọi user story.

- [ ] T008 Tạo helper decode binary UTF-8 fail-fast trong backend/src/modules/chat/utils/binary-message.util.ts
- [ ] T009 [P] Tạo guard/helper xác thực active membership trong backend/src/modules/chat/utils/participant-access.util.ts
- [ ] T010 [P] Tạo mapper lỗi nghiệp vụ chat trong backend/src/modules/chat/utils/chat-error.util.ts
- [ ] T011 Cập nhật chat controller route skeleton theo contract trong backend/src/modules/chat/chat.controller.ts
- [ ] T012 Tạo frontend chat API client cho conversations/messages/events trong frontend/src/services/chat.service.ts
- [ ] T013 Cập nhật chat types dùng chung cho UI trong frontend/src/types/chat.ts

**Checkpoint**: Foundation hoàn tất, có thể bắt đầu từng user story.

---

## Phase 3: User Story 1 - Gửi tin nhắn 1-1 (Priority: P1) 🎯 MVP

**Goal**: Chat 1-1 hoạt động end-to-end, FE gửi binary, BE decode và xử lý, có lịch sử 10 tin gần nhất + tải thêm.

**Independent Test**: Hai user chat trực tiếp, nhận đúng nội dung; mở lại thấy 10 tin mới nhất; kéo lên tải thêm mỗi lần 10 tin; payload FE->BE là binary.

### Tests for User Story 1

- [ ] T014 [P] [US1] Thêm e2e test gửi/nhận direct message trong backend/test/chat-direct-message.e2e-spec.ts
- [ ] T015 [P] [US1] Thêm e2e test decode lỗi binary trả lỗi rõ ràng trong backend/test/chat-binary-decode.e2e-spec.ts
- [ ] T016 [P] [US1] Thêm e2e test pagination mặc định 10 và load-more 10 trong backend/test/chat-history-pagination.e2e-spec.ts
- [ ] T017 [P] [US1] Thêm frontend test render direct thread và bubble phân biệt trong frontend/src/test/chat-direct-thread.test.tsx

### Implementation for User Story 1

- [ ] T018 [P] [US1] Implement create/list direct conversation trong backend/src/modules/chat/chat.service.ts
- [ ] T019 [US1] Implement GET /chat/conversations và POST /chat/conversations trong backend/src/modules/chat/chat.controller.ts
- [ ] T020 [US1] Implement POST /chat/conversations/:conversationId/messages nhận application/octet-stream trong backend/src/modules/chat/chat.controller.ts
- [ ] T021 [US1] Implement decode + validate membership + persist message trong backend/src/modules/chat/chat.service.ts
- [ ] T022 [US1] Implement GET /chat/conversations/:conversationId/messages với cursor limit=10 trong backend/src/modules/chat/chat.controller.ts
- [ ] T023 [US1] Tích hợp forwarding message vào luồng backend hiện tại (Linux kernel pipeline adapter) trong backend/src/modules/chat/chat.service.ts
- [ ] T024 [US1] Implement chat page layout 3 vùng (list/thread/input) trong frontend/src/features/chat/chat.page.tsx
- [ ] T025 [P] [US1] Implement gửi binary từ FE và nhận trạng thái gửi trong frontend/src/services/chat.service.ts
- [ ] T026 [US1] Kết nối UI nhập/gửi/tải lịch sử 10 tin + scroll load-more trong frontend/src/features/chat/chat.page.tsx

**Checkpoint**: US1 chạy độc lập end-to-end.

---

## Phase 4: User Story 2 - Chat nhóm và lịch sử thành viên (Priority: P2)

**Goal**: Chat nhóm có thể thêm thành viên và hiển thị timeline minh bạch ai thêm ai, lúc nào.

**Independent Test**: Tạo nhóm, thêm thành viên bằng user khác, timeline hiển thị đúng target/actor/time.

### Tests for User Story 2

- [ ] T027 [P] [US2] Thêm e2e test add member và event timeline trong backend/test/chat-group-membership-events.e2e-spec.ts
- [ ] T028 [P] [US2] Thêm frontend test hiển thị membership timeline trong frontend/src/test/chat-group-timeline.test.tsx

### Implementation for User Story 2

- [ ] T029 [US2] Implement tạo group conversation và add member endpoint/service trong backend/src/modules/chat/chat.service.ts
- [ ] T030 [US2] Implement POST /chat/conversations/:conversationId/members trong backend/src/modules/chat/chat.controller.ts
- [ ] T031 [US2] Implement ghi MembershipEvent immutable (added/joined) trong backend/src/modules/chat/chat.service.ts
- [ ] T032 [US2] Implement GET /chat/conversations/:conversationId/events trong backend/src/modules/chat/chat.controller.ts
- [ ] T033 [US2] Implement UI hiển thị danh sách thành viên và timeline event trong frontend/src/features/chat/chat.page.tsx

**Checkpoint**: US2 chạy độc lập với timeline thành viên đúng.

---

## Phase 5: User Story 3 - Rời nhóm hoặc xoá thành viên (Priority: P3)

**Goal**: Thành viên có thể rời nhóm; owner/admin có thể xoá thành viên; người không active không gửi được tin nhắn.

**Independent Test**: User tự leave và admin remove user khác; cả hai trường hợp đều cập nhật active list + event; user không active bị chặn gửi tin.

### Tests for User Story 3

- [ ] T034 [P] [US3] Thêm e2e test leave group và ghi event trong backend/test/chat-group-leave.e2e-spec.ts
- [ ] T035 [P] [US3] Thêm e2e test remove member theo quyền trong backend/test/chat-group-remove-member.e2e-spec.ts
- [ ] T036 [P] [US3] Thêm e2e test chặn gửi khi không còn active trong backend/test/chat-group-forbidden-send.e2e-spec.ts

### Implementation for User Story 3

- [ ] T037 [US3] Implement POST /chat/conversations/:conversationId/leave trong backend/src/modules/chat/chat.controller.ts
- [ ] T038 [US3] Implement DELETE /chat/conversations/:conversationId/members/:userId trong backend/src/modules/chat/chat.controller.ts
- [ ] T039 [US3] Implement service logic leave/remove + permission owner/admin + append event trong backend/src/modules/chat/chat.service.ts
- [ ] T040 [US3] Cập nhật validate gửi message để reject non-active participant trong backend/src/modules/chat/chat.service.ts
- [ ] T041 [US3] Implement UI action leave/remove và trạng thái bị chặn gửi trong frontend/src/features/chat/chat.page.tsx

**Checkpoint**: US3 chạy độc lập đúng quyền và lifecycle.

---

## Phase 6: User Story 4 - Giao diện chat quen thuộc (Priority: P3)

**Goal**: UI chat quen thuộc kiểu Messenger: conversation list + thread + input, dễ phân biệt tin nhắn của mình/người khác.

**Independent Test**: Người dùng mở chat và nhận diện được 3 vùng chính; phân biệt được bubble của mình và người khác.

### Tests for User Story 4

- [ ] T042 [P] [US4] Thêm frontend test bố cục 3 vùng chat trong frontend/src/test/chat-layout.test.tsx
- [ ] T043 [P] [US4] Thêm frontend test phân biệt bubble mine/theirs trong frontend/src/test/chat-bubble-variant.test.tsx

### Implementation for User Story 4

- [ ] T044 [US4] Refine UI bố cục và style tương tác danh sách hội thoại trong frontend/src/features/chat/chat.page.tsx
- [ ] T045 [US4] Implement component hiển thị message bubble mine/theirs trong frontend/src/features/chat/components/message-bubble.tsx
- [ ] T046 [US4] Tách component conversation list và composer trong frontend/src/features/chat/components/conversation-list.tsx và frontend/src/features/chat/components/chat-composer.tsx

**Checkpoint**: US4 đạt trải nghiệm UI mục tiêu.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [ ] T047 [P] Chuẩn hóa response/error schema của chat APIs trong backend/src/modules/chat/chat.controller.ts
- [ ] T048 [P] Tối ưu query index cho message/event theo conversationId + time trong backend/src/modules/chat/schemas/message.schema.ts và backend/src/modules/chat/schemas/membership-event.schema.ts
- [ ] T049 [P] Rà soát bảo mật input/authorization cho toàn bộ chat endpoints trong backend/src/modules/chat/chat.service.ts
- [ ] T050 Chạy và cập nhật quickstart validation notes trong specs/003-chat-groups/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 -> không phụ thuộc.
- Phase 2 -> phụ thuộc Phase 1.
- Phase 3/4/5/6 -> phụ thuộc Phase 2.
- Final Phase -> phụ thuộc các phase story đã chọn.

### User Story Dependencies

- **US1 (P1)**: bắt đầu ngay sau Foundational, là MVP.
- **US2 (P2)**: phụ thuộc foundational, không bắt buộc chờ US1 hoàn tất để bắt đầu backend model/event.
- **US3 (P3)**: phụ thuộc foundational + logic membership đã có từ US2.
- **US4 (P3)**: có thể song song với US2/US3 sau khi US1 đã dựng khung UI cơ bản.

### Parallel Opportunities

- Setup: T002-T004 song song.
- Foundational: T009-T010 và T012-T013 song song.
- US1 tests: T014-T017 song song.
- US2 tests: T027-T028 song song.
- US3 tests: T034-T036 song song.
- US4 tests: T042-T043 song song.
- Polish: T047-T049 song song.

---

## Parallel Example: User Story 1

```bash
Task: "T014 [US1] backend direct message e2e test"
Task: "T015 [US1] backend binary decode error e2e test"
Task: "T016 [US1] backend pagination e2e test"
Task: "T017 [US1] frontend direct thread render test"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Hoàn thành Phase 1 + Phase 2.
2. Hoàn thành toàn bộ US1 (T014-T026).
3. Validate độc lập theo tiêu chí US1.

### Incremental Delivery

1. Ship MVP US1.
2. Thêm US2 (group + membership timeline).
3. Thêm US3 (leave/remove + reject non-active send).
4. Hoàn thiện US4 (UI/UX quen thuộc).
5. Chạy polish phase.
