# Tasks: Gemini AI Chat Integration

**Input**: Design documents from `/specs/014-gemini-ai-chat/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Add AI dependencies and configure environment

- [X] T001 Install `@google/generative-ai` SDK in backend
- [X] T002 [P] Add AI environment variables to `backend/.env.example` (GEMINI_API_KEYS, GEMINI_MODELS, timeouts, feature toggles)
- [X] T003 [P] Add AI environment variables to `frontend/.env.example` (VITE_AI_ENABLED, VITE_AI_SOCKET_NAMESPACE)
- [X] T004 Extend `BackendEnv` type in `backend/src/config/env.config.ts` with AI env vars

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create `backend/src/modules/ai/` directory structure per plan.md
- [X] T006 Implement `AiConfigService` in `backend/src/modules/ai/ai-config.service.ts` — load and parse GEMINI_API_KEYS and GEMINI_MODELS from env, initialize key rotation state
- [X] T007 Implement `AiService` in `backend/src/modules/ai/ai.service.ts` — core rotation logic (round-robin API key, round-robin model, rate limit detection and skipping, timeout handling)
- [X] T008 Create DTO `GeminiRequestDto` in `backend/src/modules/ai/dto/gemini-request.dto.ts`
- [X] T009 Create `AiModule` in `backend/src/modules/ai/ai.module.ts` and register in `backend/src/app.module.ts`
- [X] T010 Create `AIUserSettings` schema in `backend/src/modules/ai/schemas/ai-user-settings.schema.ts` (userId, chatbotEnabled, suggestionsEnabled, moderationEnabled)
- [X] T011 [P] Register AIUserSettings schema in `backend/src/app.module.ts` (Mongoose.forFeature)
- [X] T012 [P] Create `AiGateway` in `backend/src/modules/ai/ai.gateway.ts` — Socket.IO `/ai` namespace with auth guard and conversation access validation
- [X] T013 Extend `Message` schema in `backend/src/modules/chat/schemas/message.schema.ts` with `moderationResult` and `isAIBotMessage` fields
- [X] T014 [P] Extend `User` schema in `backend/src/modules/auth/schemas/user.schema.ts` with `aiSettings` ObjectId reference
- [X] T015 Create frontend `AiService` in `frontend/src/services/ai.service.ts` — Socket.IO client connection to `/ai` namespace
- [X] T016 Extend `ChatStore` in `frontend/src/store/chat.store.ts` with AI feature toggles and suggestions state

**Checkpoint**: Foundation ready — all 3 user stories can now be implemented in parallel

---

## Phase 3: User Story 1 - AI Chat Bot (Priority: P1) 🎯 MVP

**Goal**: Bot tự động trả lời khi user @mention bot hoặc gửi lệnh /ai

**Independent Test**: Gửi tin nhắn "@chatai hello" hoặc "/ai hello" trong chat → nhận phản hồi từ AI bot trong 10 giây

### Implementation for User Story 1

- [X] T017 [P] [US1] Create `AIConversationContext` utility in `backend/src/modules/ai/utils/ai-conversation-context.util.ts` — load last N messages from DB for context
- [X] T018 [P] [US1] Implement `AiChatbotService` in `backend/src/modules/ai/ai-chatbot.service.ts` — detect @mention and /ai prefix, build context, call Gemini, parse response
- [X] T019 [US1] Add `@SubscribeMessage('ai:chat')` handler in `ai.gateway.ts` — validate conversation access, check AI_CHATBOT_ENABLED, call AiChatbotService, emit `ai:response`
- [X] T020 [US1] Extend `ChatGateway` in `backend/src/modules/chat/chat.gateway.ts` — on `message:create`, detect @mention or /ai prefix, forward to `ai:chat` event
- [X] T021 [US1] Extend `ChatService` in `backend/src/modules/chat/chat.service.ts` — save AI bot message to DB with `isAIBotMessage: true`
- [X] T022 [US1] Create bot message display in `frontend/src/features/chat/components/message-bubble.tsx` — distinguish AI bot messages visually
- [X] T023 [US1] Add AI status indicator in `frontend/src/features/chat/chat.page.tsx` — show when AI is unavailable

**Checkpoint**: AI Chat Bot fully functional — send @mention or /ai → get AI response

---

## Phase 4: User Story 2 - Smart Reply Suggestions (Priority: P2)

**Goal**: Hiển thị 3 gợi ý trả lời nhanh khi user focus input box

**Independent Test**: Focus vào input box trong chat → thấy 3 suggestions hiển thị phía trên input → click suggestion → text được điền vào input

### Implementation for User Story 2

- [X] T024 [P] [US2] Create `AISuggestion` DTO in `backend/src/modules/ai/dto/ai-suggestion.dto.ts`
- [X] T025 [P] [US2] Implement `AiSuggestionsService` in `backend/src/modules/ai/ai-suggestions.service.ts` — generate exactly 3 suggestions via Gemini structured JSON output, handle timeout
- [X] T026 [US2] Add `@SubscribeMessage('ai:suggestions:request')` handler in `ai.gateway.ts` — validate conversation access, check AI_SUGGESTIONS_ENABLED, call AiSuggestionsService, emit `ai:suggestions:response`
- [X] T027 [US2] Create `SmartReplySuggestions` component in `frontend/src/features/chat/components/smart-reply-suggestions.tsx` — 3 clickable chips, loading skeleton, hide when disabled or empty
- [X] T028 [US2] Emit `ai:suggestions:request` on input focus in `frontend/src/features/chat/components/chat-composer.tsx`
- [X] T029 [US2] Integrate `SmartReplySuggestions` component into `chat.page.tsx` above input box

**Checkpoint**: Smart Reply fully functional — focus input → 3 suggestions appear → click to fill

---

## Phase 5: User Story 3 - Content Moderation (Priority: P3)

**Goal**: Phân tích sentiment và phát hiện toxic content, hiển thị cảnh báo

**Independent Test**: Gửi tin nhắn với nội dung toxic → thấy cảnh báo hoặc warning badge trên tin nhắn

### Implementation for User Story 3

- [X] T030 [P] [US3] Create `ModerationResultDto` in `backend/src/modules/ai/dto/moderation-result.dto.ts`
- [X] T031 [P] [US3] Implement `AiModerationService` in `backend/src/modules/ai/ai-moderation.service.ts` — prompt-based sentiment and toxicity analysis via Gemini structured JSON, 5s timeout
- [X] T032 [US3] Add `ai:moderation:result` emit in `ChatGateway` `message:create` handler — call AiModerationService after message saved, emit to sender
- [X] T033 [US3] Update `Message` schema save logic to store `moderationResult` — persist in MongoDB
- [X] T034 [US3] Create `MessageModeration` component in `frontend/src/features/chat/components/message-moderation.tsx` — warning badge for toxic, sentiment emoji display
- [X] T035 [US3] Listen for `ai:moderation:result` in `frontend/src/services/ai.service.ts` and update message display with moderation indicators
- [X] T036 [US3] Update `ChatStore` to handle moderation results and update message list

**Checkpoint**: Content Moderation fully functional — send message → see sentiment/toxicity indicator → toxic messages show warning

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T037 [P] Error handling — add `ai:error` event in `ai.gateway.ts` with proper error codes (RATE_LIMITED, TIMEOUT, SERVICE_UNAVAILABLE, DISABLED)
- [X] T038 [P] User toggle UI — add settings in `frontend/src/features/chat/chat.page.tsx` to toggle AI features on/off per user
- [X] T039 [P] Unit tests — write tests for `ai.service.ts` (rotation logic) in `tests/unit/ai/ai.service.test.ts`
- [X] T040 [P] Unit tests — write tests for `ai-chatbot.service.ts` in `tests/unit/ai/ai-chatbot.service.test.ts`
- [X] T041 [P] Unit tests — write tests for `ai-suggestions.service.ts` in `tests/unit/ai/ai-suggestions.service.test.ts`
- [X] T042 [P] Unit tests — write tests for `ai-moderation.service.ts` in `tests/unit/ai/ai-moderation.service.test.ts`
- [X] T043 [P] Integration test — write test for AI chatbot flow in `tests/integration/ai-chatbot.integration.test.ts`
- [X] T044 Graceful degradation audit — verify all AI failures do not block message sending (FR-010)
- [X] T045 Performance check — verify AI response time < 10s, suggestions < 1s per success criteria

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3-5 (User Stories)**: All depend on Phase 2 — can run in parallel if staffed
- **Phase 6 (Polish)**: Depends on relevant user stories being complete

### User Story Dependencies

- **US1 (P1 - MVP)**: Depends on Phase 2 only — no dependencies on US2 or US3
- **US2 (P2)**: Depends on Phase 2 only — no dependencies on US1 or US3
- **US3 (P3)**: Depends on Phase 2 only — no dependencies on US1 or US2

### Within Each User Story

- Models/schemas → Services → Gateway handlers → Frontend integration
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T001, T002, T003, T004 run in parallel
- T005, T006, T007, T008 can start after T004
- T010, T011, T012, T013, T014, T015, T016 can start after T009
- After Phase 2: US1, US2, US3 can all start in parallel
- T017 + T018 (US1) run in parallel
- T024 + T025 (US2) run in parallel
- T030 + T031 (US3) run in parallel
- T039, T040, T041, T042, T043 (Phase 6 tests) run in parallel

---

## Implementation Strategy

### MVP First (Phase 3 - US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test AI Chat Bot independently
5. Deploy/demo MVP

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. Add US1 → Test independently → Deploy/Demo (MVP)
3. Add US2 → Test independently → Deploy/Demo
4. Add US3 → Test independently → Deploy/Demo
5. Add Phase 6 → Polish and tests

### Parallel Team Strategy

With multiple developers:
- Phase 1 + Phase 2: 1 developer
- Once Phase 2 is done:
  - Developer A: US1 (AI Chat Bot)
  - Developer B: US2 (Smart Reply)
  - Developer C: US3 (Moderation)
- Phase 6: All developers add tests

---

## Task Summary

| Phase | Tasks | Total |
|-------|-------|-------|
| Phase 1: Setup | T001–T004 | 4 tasks |
| Phase 2: Foundational | T005–T016 | 12 tasks |
| Phase 3: US1 — AI Chat Bot | T017–T023 | 7 tasks |
| Phase 4: US2 — Smart Reply | T024–T029 | 6 tasks |
| Phase 5: US3 — Moderation | T030–T036 | 7 tasks |
| Phase 6: Polish | T037–T045 | 9 tasks |
| **Total** | | **45 tasks** |

**Suggested MVP scope**: Phase 1 + Phase 2 + Phase 3 (T001–T023) = 23 tasks → MVP delivers AI Chat Bot
