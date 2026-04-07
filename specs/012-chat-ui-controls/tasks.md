# Tasks: Chat UI Controls

**Input**: Design documents from `/specs/012-chat-ui-controls/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No new test-creation tasks are included because the feature specification did not explicitly require TDD or test-first delivery.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Feature docs for this feature live in `specs/012-chat-ui-controls/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the shared frontend type surface needed by the upcoming chat UI changes.

- [X] T001 Add shared sender presentation fields and message search result types in frontend/src/types/chat.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Complete shared contract and page-state work that blocks multiple user stories.

**⚠️ CRITICAL**: No user story work should start until this phase is complete.

- [X] T002 Extend shared chat message payload builders with sender display name and avatar fields in backend/src/modules/chat/chat.service.ts
- [X] T003 Refactor shared header-control state so sidebar and search actions preserve selected conversation and thread state in frontend/src/features/chat/chat.page.tsx

**Checkpoint**: Shared chat payloads and header state are ready for story-specific work.

---

## Phase 3: User Story 1 - Search messages in the current conversation (Priority: P1) 🎯 MVP

**Goal**: Let users open a popup from the search button and search message content within the active conversation only, including conversations whose stored content is encrypted at rest.

**Independent Test**: Open a conversation, press the search button, search for a known message, verify matching results appear with sender and timestamp context, then search for a missing term and verify the empty state.

### Implementation for User Story 1

- [X] T004 [P] [US1] Add the conversation-scoped message search DTO and route wiring in backend/src/modules/chat/dto/chat.dto.ts and backend/src/modules/chat/chat.controller.ts
- [X] T005 [US1] Implement decrypted-content conversation message search with bounded results in backend/src/modules/chat/chat.service.ts
- [X] T006 [P] [US1] Add the conversation-scoped searchMessages API client in frontend/src/services/chat.service.ts
- [X] T007 [US1] Implement search popup state, active-conversation guard, loading state, and empty state in frontend/src/features/chat/chat.page.tsx
- [X] T008 [US1] Render conversation-scoped search results with sender and timestamp context in frontend/src/features/chat/chat.page.tsx

**Checkpoint**: User Story 1 is functional and independently testable inside an active conversation.

---

## Phase 4: User Story 2 - Show user avatars in messages (Priority: P2)

**Goal**: Let users open a popup from the search button and search message content within the active conversation only.

**Independent Test**: Open a conversation, press the search button, search for a known message, verify matching results appear with sender and timestamp context, then search for a missing term and verify the empty state.

### Implementation for User Story 2

- [X] T006 [P] [US2] Add the conversation-scoped message search DTO and route wiring in backend/src/modules/chat/dto/chat.dto.ts and backend/src/modules/chat/chat.controller.ts
- [X] T007 [US2] Implement escaped-query conversation message search with bounded results in backend/src/modules/chat/chat.service.ts
- [X] T008 [P] [US2] Add the conversation-scoped searchMessages API client in frontend/src/services/chat.service.ts
- [X] T009 [US2] Implement search popup state, active-conversation guard, loading state, and empty state in frontend/src/features/chat/chat.page.tsx
- [X] T010 [US2] Render conversation-scoped search results with sender and timestamp context in frontend/src/features/chat/chat.page.tsx

**Checkpoint**: User Story 2 is functional and independently testable inside an active conversation.

---

## Phase 5: User Story 2 - Show user avatars in messages (Priority: P2)

**Goal**: Replace the generic incoming-message icon with the sender avatar or a default avatar placeholder.

**Independent Test**: Open conversations with senders who have and do not have avatar images, then confirm each incoming message shows either the correct avatar image or a stable fallback avatar placeholder.

### Implementation for User Story 2

- [X] T009 [US2] Replace the generic incoming-message icon with avatar image and fallback avatar rendering in frontend/src/features/chat/components/message-bubble.tsx
- [X] T010 [US2] Pass sender-specific display name and avatar metadata from frontend/src/features/chat/chat.page.tsx into frontend/src/features/chat/components/message-bubble.tsx

**Checkpoint**: User Story 2 is functional and independently testable in direct and group message threads.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the combined feature across stories and run final project-level checks.

- [ ] T011 Run the manual feature validation scenarios in specs/012-chat-ui-controls/quickstart.md against frontend/src/features/chat/chat.page.tsx and frontend/src/features/chat/components/message-bubble.tsx
- [X] T012 Run the workspace validation commands defined in package.json, frontend/package.json, and backend/package.json after implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup**: No dependencies.
- **Phase 2: Foundational**: Depends on Phase 1 and blocks all user stories.
- **Phase 3: US1**: Depends on Phase 2.
- **Phase 4: US2**: Depends on Phase 2.
- **Phase 5: US2**: Depends on Phase 2.
- **Phase 6: Polish**: Depends on completion of the desired user stories.

### User Story Dependencies

- **US1 (P1)**: Starts after shared payload/type work is complete; no dependency on US2.
- **US2 (P2)**: Starts after shared payload/type work is complete; no dependency on US1.

### Within Each User Story

- Shared types and payload updates come before story-specific UI wiring.
- Backend route definitions come before frontend search integration for US1.
- Page-level prop wiring comes before final bubble rendering verification for US2.
- Polish starts only after the intended stories are implemented.

### Parallel Opportunities

- T004 and T006 can run in parallel after Phase 2 because they touch different files on backend and frontend.
- US1 and US2 can proceed in parallel after Phase 2, but both should avoid overlapping edits in frontend/src/features/chat/chat.page.tsx at the same time.

---

## Parallel Example: User Story 1

```bash
Task: "Add the conversation-scoped message search DTO and route wiring in backend/src/modules/chat/dto/chat.dto.ts and backend/src/modules/chat/chat.controller.ts"
Task: "Add the conversation-scoped searchMessages API client in frontend/src/services/chat.service.ts"
```

---

## Parallel Example: User Story 2

```bash
# No safe same-story parallel split is recommended for US2 because the page-level
# prop wiring and message bubble rendering depend on the same message flow.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Validate in-conversation search behavior before moving on.

### Incremental Delivery

1. Finish shared setup and foundational work.
2. Deliver US1 as the MVP.
3. Add US2 for avatar rendering.
4. Finish with Phase 6 validation and workspace checks.

### Parallel Team Strategy

1. One developer completes Phase 1 and Phase 2.
2. After that:
   - Developer A implements US1 across backend/src/modules/chat/ and frontend/src/services/chat.service.ts.
   - Developer B implements US2 in frontend/src/features/chat/components/message-bubble.tsx and frontend/src/features/chat/chat.page.tsx.

---

## Notes

- All tasks use the required checklist format with task ID and file path.
- Only user story tasks include `[US#]` labels.
- `[P]` markers are only used where the file changes are independently parallelizable.
- Suggested MVP scope is Phase 3 / User Story 1 only.
- Sidebar toggle work was removed from scope after implementation feedback and is no longer tracked as a required task.