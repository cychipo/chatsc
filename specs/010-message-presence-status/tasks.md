# Tasks: Trạng thái gửi/xem và hiện diện chat

**Input**: Design documents from `/specs/010-message-presence-status/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Không tạo task test tự động riêng vì spec không yêu cầu TDD bắt buộc; validation tập trung vào build và quickstart realtime với hai tài khoản.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g. [US1], [US2], [US3])
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Chuẩn bị contract và bề mặt kiểu dữ liệu cho metadata unread/read/typing của chat.

- [X] T001 Cập nhật tài liệu quickstart và contract tổng quát cho presence/unread/read trong `specs/010-message-presence-status/quickstart.md` và `specs/010-message-presence-status/contracts/message-presence-contract.md`
- [X] T002 [P] Mở rộng kiểu dữ liệu frontend cho unread count, seen state và typing presence trong `frontend/src/types/chat.ts`
- [X] T003 [P] Mở rộng schema participant/message cho unread/read metadata trong `backend/src/modules/chat/schemas/conversation-participant.schema.ts` và `backend/src/modules/chat/schemas/message.schema.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Hoàn thiện hạ tầng chung để mọi user story có thể reuse cho direct chat presence.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Tạo helper/service backend để khôi phục direct participant đã `left`, tính unread count và read marker trong `backend/src/modules/chat/chat.service.ts`
- [X] T005 [P] Mở rộng contract realtime preview/message để mang unread metadata trong `backend/src/modules/chat/chat.service.ts` và `frontend/src/services/chat.service.ts`
- [X] T006 [P] Mở rộng socket client để hỗ trợ event presence/read/typing trong `frontend/src/services/chat-socket.service.ts`
- [X] T007 Mở rộng gateway realtime cho preview update và event metadata mới trong `backend/src/modules/chat/chat.gateway.ts`
- [X] T008 Tạo contract HTTP đánh dấu conversation đã đọc trong `backend/src/modules/chat/chat.controller.ts` và `frontend/src/services/chat.service.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Nhận tin nhắn theo thời gian thực (Priority: P1) 🎯 MVP

**Goal**: Người nhận thấy tin nhắn mới ngay lập tức, direct chat liên quan nhảy lên đầu danh sách và được hiện lại đúng nếu đã xoá/left trước đó.

**Independent Test**: Dùng hai tài khoản A và B; khi A gửi tin nhắn cho B thì B nhận được ngay, đoạn chat với A xuất hiện hoặc hiện lại nếu cần và nằm trên đầu danh sách chat mà không reload.

### Implementation for User Story 1

- [ ] T009 [US1] Bổ sung logic backend gửi tin nhắn để khôi phục direct participant bên nhận và cập nhật `lastMessageAt` đúng trong `backend/src/modules/chat/chat.service.ts`
- [X] T010 [US1] Mở rộng gateway để phát đúng message realtime và preview update cho cả sender lẫn receiver user room trong `backend/src/modules/chat/chat.gateway.ts`
- [X] T011 [P] [US1] Mở rộng contract danh sách chat để trả conversation direct đã được hiện lại cùng metadata mới trong `backend/src/modules/chat/chat.service.ts`
- [X] T012 [P] [US1] Cập nhật frontend state xử lý incoming message và preview update để đưa conversation lên đầu danh sách trong `frontend/src/features/chat/chat.page.tsx`
- [X] T013 [US1] Cập nhật UI danh sách chat để render preview/time ổn định cho conversation vừa được hiện lại trong `frontend/src/features/chat/components/conversation-list.tsx`
- [X] T014 [US1] Đồng bộ quickstart cho luồng realtime delivery và auto-restore direct chat trong `specs/010-message-presence-status/quickstart.md`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Theo dõi tin nhắn chưa đọc (Priority: P2)

**Goal**: Người dùng thấy số tin nhắn chưa đọc đúng theo từng conversation và chỉ khi mở conversation thì trạng thái đọc mới được cập nhật.

**Independent Test**: Dùng hai tài khoản A và B; để B chưa mở chat với A rồi cho A gửi nhiều tin, xác nhận unread count tăng đúng; khi B bấm mở conversation thì unread count được xoá/cập nhật đúng ngay.

### Implementation for User Story 2

- [X] T015 [US2] Hoàn thiện logic backend tính unread count và read marker theo participant trong `backend/src/modules/chat/chat.service.ts`
- [X] T016 [US2] Thêm endpoint đánh dấu conversation đã đọc và trả unread state mới trong `backend/src/modules/chat/chat.controller.ts`
- [X] T017 [P] [US2] Mở rộng service frontend gọi mark-as-read và map unread metadata trong `frontend/src/services/chat.service.ts`
- [X] T018 [US2] Đồng bộ state chat page để chỉ đánh dấu đã đọc khi `selectConversation()` mở thread thành công trong `frontend/src/features/chat/chat.page.tsx`
- [X] T019 [P] [US2] Cập nhật conversation list để hiển thị unread badge/count trong `frontend/src/features/chat/components/conversation-list.tsx`
- [X] T020 [US2] Đồng bộ contract unread/read state trong `specs/010-message-presence-status/contracts/message-presence-contract.md`
- [X] T021 [US2] Bổ sung quickstart cho unread count và mark-as-read theo click mở conversation trong `specs/010-message-presence-status/quickstart.md`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Hiển thị trạng thái gửi/xem và đang soạn tin (Priority: P3)

**Goal**: Người gửi thấy trạng thái `đã gửi`/`đã xem` cho cụm tin outbound gần nhất và người còn lại thấy typing indicator realtime khi đối phương đang nhập.

**Independent Test**: Dùng hai tài khoản A và B trong cùng conversation; khi A gửi một hoặc nhiều tin liên tiếp thì thấy trạng thái muted phù hợp, khi B mở xem chat thì trạng thái chuyển sang đã xem, và khi B nhập nội dung thì A thấy typing indicator.

### Implementation for User Story 3

- [X] T022 [US3] Bổ sung logic backend suy ra seen status cho cụm outbound gần nhất và phát read-state update phù hợp trong `backend/src/modules/chat/chat.service.ts` và `backend/src/modules/chat/chat.gateway.ts`
- [X] T023 [US3] Thêm event/socket contract cho typing presence trong `backend/src/modules/chat/chat.gateway.ts` và `frontend/src/services/chat-socket.service.ts`
- [X] T024 [P] [US3] Mở rộng types/service frontend cho seen status và typing indicator trong `frontend/src/types/chat.ts` và `frontend/src/services/chat.service.ts`
- [X] T025 [US3] Cập nhật chat page để phát typing signal khi nhập và hiển thị indicator cho participant còn lại trong `frontend/src/features/chat/chat.page.tsx`
- [X] T026 [US3] Cập nhật message bubble để render text muted `Đã gửi`/`Đã xem` cho cụm outbound phù hợp trong `frontend/src/features/chat/components/message-bubble.tsx`
- [X] T027 [P] [US3] Đồng bộ contract message seen status và typing presence trong `specs/010-message-presence-status/contracts/message-presence-contract.md`
- [X] T028 [US3] Bổ sung quickstart cho sent/seen label và typing indicator trong `specs/010-message-presence-status/quickstart.md`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hoàn thiện các phần giao cắt nhiều story và xác minh end-to-end.

- [X] T029 [P] Rà soát mọi luồng direct chat để đảm bảo không tạo conversation trùng khi participant đã `left` trong `backend/src/modules/chat/chat.service.ts` và `backend/src/modules/chat/schemas/conversation-participant.schema.ts`
- [X] T030 [P] Rà soát UI sidebar/thread để tránh unread/seen/typing bị lệch state khi reload hoặc reconnect trong `frontend/src/features/chat/chat.page.tsx`, `frontend/src/features/chat/components/conversation-list.tsx`, và `frontend/src/features/chat/components/message-bubble.tsx`
- [X] T031 Chạy full quickstart validation cho realtime delivery, auto-restore direct chat, unread count, sent/seen status và typing indicator bằng `specs/010-message-presence-status/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion và reuse read/unread primitives đã chuẩn hoá ở Phase 2
- **User Story 3 (Phase 5)**: Depends on Foundational completion; nên làm sau US2 để reuse read marker/seen state đã có
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Bắt đầu sau Phase 2, không phụ thuộc vào US2/US3
- **User Story 2 (P2)**: Phụ thuộc vào hạ tầng unread/read marker từ Phase 2; nên làm sau US1 để tận dụng preview/message flow đã ổn định
- **User Story 3 (P3)**: Phụ thuộc vào việc đã có read marker và realtime event ổn định từ US1/US2

### Within Each User Story

- Backend schema/state primitives trước khi mở rộng controller/gateway thật
- Chat service trước gateway/controller và frontend submit/listener
- Frontend service/types trước UI binding
- Contract và quickstart cập nhật sau khi hành vi code đã rõ

### Parallel Opportunities

- T002 và T003 có thể chạy song song trong phase setup
- T005 và T006 có thể chạy song song sau khi T004 chốt model state chung
- Trong US1, T011 và T012 có thể chạy song song sau khi backend realtime shape đã rõ
- Trong US2, T017 và T019 có thể chạy song song sau khi unread contract đã chốt
- Trong US3, T024 và T027 có thể chạy song song
- T029 và T030 có thể chạy song song ở phase polish

---

## Parallel Example: User Story 1

```bash
# Đồng bộ backend summary và frontend state sau khi realtime payload đã rõ:
Task: "Mở rộng contract danh sách chat để trả conversation direct đã được hiện lại cùng metadata mới trong backend/src/modules/chat/chat.service.ts"
Task: "Cập nhật frontend state xử lý incoming message và preview update để đưa conversation lên đầu danh sách trong frontend/src/features/chat/chat.page.tsx"
```

---

## Parallel Example: User Story 2

```bash
# Đồng bộ unread service và badge UI song song sau khi mark-as-read contract đã rõ:
Task: "Mở rộng service frontend gọi mark-as-read và map unread metadata trong frontend/src/services/chat.service.ts"
Task: "Cập nhật conversation list để hiển thị unread badge/count trong frontend/src/features/chat/components/conversation-list.tsx"
```

---

## Parallel Example: User Story 3

```bash
# Đồng bộ type/service và contract typing/seen state song song:
Task: "Mở rộng types/service frontend cho seen status và typing indicator trong frontend/src/types/chat.ts và frontend/src/services/chat.service.ts"
Task: "Đồng bộ contract message seen status và typing presence trong specs/010-message-presence-status/contracts/message-presence-contract.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop và validate người nhận thấy tin nhắn realtime, conversation nhảy lên đầu và direct chat hiện lại đúng
5. Demo được realtime direct chat restore flow trước khi mở rộng unread/read/typing

### Incremental Delivery

1. Hoàn tất Setup + Foundational để có shared state cho unread/read/typing presence
2. Add User Story 1 để khóa realtime delivery + reorder + auto-restore direct chat
3. Add User Story 2 để hỗ trợ unread count và mark-as-read đúng lúc
4. Add User Story 3 để hoàn thiện sent/seen label và typing indicator
5. Kết thúc bằng quickstart validation toàn bộ feature

### Parallel Team Strategy

Với nhiều người cùng làm:

1. Một người xử lý schema/chat service/gateway ở backend
2. Một người xử lý service/types/socket client ở frontend
3. Một người xử lý conversation list, message bubble, contract và quickstart

---

## Notes

- Tất cả task đều theo đúng format checklist với ID, label và file path
- Không tạo test task riêng vì spec không yêu cầu test-first hay bộ test bắt buộc
- MVP đề xuất: **Phase 1 + Phase 2 + Phase 3 (User Story 1)**
- Validation độc lập của từng story bám theo `specs/010-message-presence-status/quickstart.md`
