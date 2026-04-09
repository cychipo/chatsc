# Tasks: Realtime message alerts

**Input**: Design documents from `/specs/015-realtime-message-alerts/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Không tạo task test tự động riêng vì spec không yêu cầu TDD hay bộ test mới bắt buộc. Validation cuối cùng sẽ dựa trên quickstart và regression checks của feature.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Feature work for this plan is concentrated in `backend/src/modules/chat/` and `frontend/src/features/chat/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Chuẩn bị các điểm tích hợp chung cho feature notification + tab title

- [X] T001 Review existing realtime chat entry points in `backend/src/modules/chat/chat.gateway.ts`, `frontend/src/services/chat-socket.service.ts`, and `frontend/src/features/chat/chat.page.tsx`
- [X] T002 Capture the default browser tab title handling in `frontend/src/app/providers.tsx` and `frontend/src/features/chat/chat.page.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Hoàn thiện các cấu phần dùng chung mà mọi user story đều phụ thuộc

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Extend unread/title support types in `frontend/src/types/chat.ts`
- [X] T004 [P] Verify or extend preview/read payload mapping for unread aggregation in `frontend/src/services/chat.service.ts` and `frontend/src/services/chat-socket.service.ts`
- [X] T005 Create shared unread-summary, sender-resolution, and tab-title formatting logic in `frontend/src/features/chat/chat.page.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Nhận biết ngay khi có tin nhắn mới (Priority: P1) 🎯 MVP

**Goal**: Người dùng đang hoạt động nhận được thông báo trong phiên ngay khi có inbound message mới.

**Independent Test**: Đăng nhập User A, để User B gửi tin nhắn mới, xác minh User A thấy thông báo mới trong phiên hiện tại mà không cần refresh trang.

### Implementation for User Story 1

- [X] T006 [US1] Add inbound-message notification coordinator and duplicate suppression in `frontend/src/features/chat/chat.page.tsx`
- [X] T007 [US1] Filter self-sent, AI-only, and already-read-active-conversation cases in `frontend/src/features/chat/chat.page.tsx`
- [X] T008 [US1] Render in-session realtime notification content from `message_delivered` payload in `frontend/src/features/chat/chat.page.tsx`
- [X] T009 [US1] Ensure unread conversation state stays synchronized with socket preview/read updates in `frontend/src/features/chat/chat.page.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Cập nhật tiêu đề tab khi chỉ có một người nhắn (Priority: P2)

**Goal**: Khi unread chỉ đến từ một người gửi, title tab hiển thị đúng tổng unread và tên người gửi.

**Independent Test**: Tạo nhiều unread từ cùng một người gửi và xác minh tab title có dạng `Bạn có n tin nhắn mới từ {name user}` với số lượng đúng.

### Implementation for User Story 2

- [X] T010 [US2] Derive single-sender unread state from conversation metadata in `frontend/src/features/chat/chat.page.tsx`
- [X] T011 [US2] Add fallback sender-name resolution from `directPeer` and `displayTitle` in `frontend/src/features/chat/chat.page.tsx`
- [X] T012 [US2] Update `document.title` for the one-sender unread case in `frontend/src/features/chat/chat.page.tsx`
- [X] T013 [US2] Restore the default tab title when single-sender unread count returns to zero in `frontend/src/features/chat/chat.page.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Gộp tiêu đề tab khi có nhiều người nhắn (Priority: P3)

**Goal**: Khi unread đến từ nhiều người gửi, title tab chuyển sang thông điệp tổng quát và quay lại đúng trạng thái sau khi người dùng đọc tin nhắn.

**Independent Test**: Tạo unread từ ít nhất hai người gửi khác nhau, xác minh title là `Bạn có n tin nhắn chưa đọc`, sau đó đọc bớt tin để title quay về single-sender hoặc default đúng lúc.

### Implementation for User Story 3

- [X] T014 [US3] Aggregate multi-sender unread totals across conversation previews in `frontend/src/features/chat/chat.page.tsx`
- [X] T015 [US3] Update `document.title` for the multi-sender unread case in `frontend/src/features/chat/chat.page.tsx`
- [X] T016 [US3] Recalculate tab-title transitions on `conversation_preview_updated`, `conversation_read_updated`, and conversation selection in `frontend/src/features/chat/chat.page.tsx`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hoàn thiện behavior xuyên suốt nhiều user story

- [X] T017 [P] Add any required backend preview payload enhancement for sender presentation fallback in `backend/src/modules/chat/chat.service.ts`, `backend/src/modules/chat/chat.gateway.ts`, and `frontend/src/types/chat.ts`
- [X] T018 Clean up tab-title lifecycle and unmount/reset behavior in `frontend/src/features/chat/chat.page.tsx`
- [X] T019 Run the manual validation flow from `specs/015-realtime-message-alerts/quickstart.md` and update any mismatched behavior in `frontend/src/features/chat/chat.page.tsx` and `backend/src/modules/chat/chat.service.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational phase - MVP slice
- **User Story 2 (P2)**: Starts after Foundational phase and builds on shared unread aggregation from Phase 2
- **User Story 3 (P3)**: Starts after Foundational phase and extends the same unread/title pipeline for multi-sender cases

### Within Each User Story

- Shared unread/title helpers before story-specific UI behavior
- Notification handling before story-level edge-case cleanup
- Single-sender title logic before multi-sender transitions
- Manual quickstart validation after all desired stories are complete

### Parallel Opportunities

- T003 and T004 can run in parallel
- After T005, US1, US2, and US3 can be worked on sequentially by priority or in parallel by separate contributors
- T017 can run in parallel with T018 once user stories are implemented if sender fallback payload changes are still needed

---

## Parallel Example: User Story 1

```bash
Task: "Extend unread/title support types in frontend/src/types/chat.ts"
Task: "Verify or extend preview/read payload mapping in frontend/src/services/chat.service.ts and frontend/src/services/chat-socket.service.ts"
```

```bash
Task: "Add inbound-message notification coordinator and duplicate suppression in frontend/src/features/chat/chat.page.tsx"
Task: "Filter self-sent, AI-only, and already-read-active-conversation cases in frontend/src/features/chat/chat.page.tsx"
```

---

## Parallel Example: User Story 2

```bash
Task: "Derive single-sender unread state from conversation metadata in frontend/src/features/chat/chat.page.tsx"
Task: "Add fallback sender-name resolution from directPeer and displayTitle in frontend/src/features/chat/chat.page.tsx"
```

---

## Parallel Example: User Story 3

```bash
Task: "Aggregate multi-sender unread totals across conversation previews in frontend/src/features/chat/chat.page.tsx"
Task: "Update document.title for the multi-sender unread case in frontend/src/features/chat/chat.page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate realtime in-session notification behavior from `specs/015-realtime-message-alerts/quickstart.md`

### Incremental Delivery

1. Setup + Foundational để ổn định pipeline unread/title
2. Deliver User Story 1 for realtime in-session alerts
3. Deliver User Story 2 for single-sender tab title
4. Deliver User Story 3 for multi-sender tab title transitions
5. Finish with Polish and full quickstart validation

### Parallel Team Strategy

1. Một người xử lý Foundation (`frontend/src/types/chat.ts`, `frontend/src/services/chat.service.ts`, `frontend/src/services/chat-socket.service.ts`)
2. Một người xử lý notification flow trong `frontend/src/features/chat/chat.page.tsx`
3. Một người xử lý title transitions và backend fallback payload nếu cần trong `backend/src/modules/chat/chat.service.ts`

---

## Notes

- [P] tasks = different files, no blocking dependency on an unfinished sibling task
- [US1]/[US2]/[US3] map directly to the user stories in `spec.md`
- MVP scope là Phase 1 + Phase 2 + Phase 3
- T017 là conditional polish task: chỉ cần implement nếu sender metadata hiện có không đủ cho fallback title behavior
- Tất cả task đều dùng checklist format với ID, marker, story label phù hợp, và file path rõ ràng