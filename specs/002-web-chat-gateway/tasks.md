# Tasks: Web Google Auth

**Input**: Design documents from `/specs/002-web-chat-gateway/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-interfaces.md, quickstart.md

**Tests**: Bao gồm task test vì feature này có yêu cầu hành vi xác thực, duy trì session và xử lý edge case cần được kiểm thử rõ ràng.

**Organization**: Tasks được nhóm theo user story để mỗi story có thể được triển khai và kiểm thử độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song
- **[Story]**: User story tương ứng (`[US1]`, `[US2]`, `[US3]`)
- Mỗi task đều ghi rõ file path cần tác động

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Chuẩn bị dependencies và cấu hình cơ bản cho OAuth + session flow

- [X] T001 Add backend auth dependencies for Passport Google OAuth and sessions in /Users/tgiap.dev/devs/chatsc/backend/package.json
- [X] T002 [P] Add frontend auth-related dependencies if needed in /Users/tgiap.dev/devs/chatsc/frontend/package.json
- [X] T003 [P] Extend backend environment template with OAuth and session settings in /Users/tgiap.dev/devs/chatsc/backend/.env.example
- [X] T004 [P] Extend frontend environment template for auth app integration in /Users/tgiap.dev/devs/chatsc/frontend/.env.example

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Hoàn thiện hạ tầng auth dùng chung trước khi vào từng user story

**⚠️ CRITICAL**: Không bắt đầu user story trước khi phase này hoàn tất

- [X] T005 Create backend user schema and model in /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/schemas/user.schema.ts
- [X] T006 [P] Create backend auth session typing and request context helpers in /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/types/auth-session.ts
- [X] T007 [P] Create backend Google OAuth strategy in /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/strategies/google.strategy.ts
- [X] T008 [P] Create backend session serialization helpers in /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/auth.serializer.ts
- [X] T009 Create backend auth service foundation for user lookup and profile upsert in /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/auth.service.ts
- [X] T010 Create backend auth module wiring for strategy, schema and service in /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/auth.module.ts
- [X] T011 Create backend session middleware bootstrap in /Users/tgiap.dev/devs/chatsc/backend/src/main.ts
- [X] T012 Create frontend auth state store in /Users/tgiap.dev/devs/chatsc/frontend/src/store/auth.store.ts
- [X] T013 [P] Create frontend auth service client for login, me and logout in /Users/tgiap.dev/devs/chatsc/frontend/src/services/auth.service.ts
- [X] T014 [P] Create frontend auth user types in /Users/tgiap.dev/devs/chatsc/frontend/src/types/auth.ts
- [X] T015 [P] Create frontend protected route wrapper in /Users/tgiap.dev/devs/chatsc/frontend/src/app/protected-route.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Đăng nhập bằng Google vào website (Priority: P1) 🎯 MVP

**Goal**: Người dùng có thể bắt đầu và hoàn tất Google login từ website, sau đó truy cập được vào khu vực đã xác thực.

**Independent Test**: Mở auth page, bấm Google login, hoàn tất xác thực thành công và xác nhận frontend hydrate trạng thái authenticated cùng protected area truy cập được.

### Tests for User Story 1

- [X] T016 [P] [US1] Add backend auth endpoint integration tests in /Users/tgiap.dev/devs/chatsc/backend/test/auth-login.e2e-spec.ts
- [X] T017 [P] [US1] Add frontend auth page and protected route tests in /Users/tgiap.dev/devs/chatsc/frontend/src/test/auth-login.test.tsx

### Implementation for User Story 1

- [X] T018 [US1] Implement backend Google auth controller endpoints for login, callback, me and logout in /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/auth.controller.ts
- [X] T019 [US1] Implement backend Google auth guard in /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/guards/google-auth.guard.ts
- [X] T020 [US1] Implement backend current-user/session guard for protected endpoints in /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/guards/session-auth.guard.ts
- [X] T021 [US1] Implement frontend auth login page with Google CTA and glassstyle UI in /Users/tgiap.dev/devs/chatsc/frontend/src/features/auth/auth.page.tsx
- [X] T022 [US1] Implement frontend auth bootstrap and session hydrate flow in /Users/tgiap.dev/devs/chatsc/frontend/src/app/providers.tsx and /Users/tgiap.dev/devs/chatsc/frontend/src/store/auth.store.ts
- [X] T023 [US1] Wire frontend app routing and protected area entry in /Users/tgiap.dev/devs/chatsc/frontend/src/app/routes.tsx and /Users/tgiap.dev/devs/chatsc/frontend/src/App.tsx
- [X] T024 [US1] Add authenticated landing shell for signed-in users in /Users/tgiap.dev/devs/chatsc/frontend/src/pages/home.page.tsx

**Checkpoint**: User Story 1 hoàn tất khi happy path Google login truy cập được khu vực đã đăng nhập

---

## Phase 4: User Story 2 - Tạo hồ sơ người dùng từ email Google (Priority: P2)

**Goal**: Người dùng đăng nhập lần đầu được tạo hồ sơ hệ thống với username suy ra từ email Google theo quy tắc nhất quán.

**Independent Test**: Đăng nhập lần đầu bằng email Google chưa tồn tại và xác nhận backend tạo profile mới với username đúng theo local-part email; khi trùng thì áp dụng suffix nhất quán.

### Tests for User Story 2

- [X] T025 [P] [US2] Add backend user profile creation and username collision tests in /Users/tgiap.dev/devs/chatsc/backend/test/auth-profile.e2e-spec.ts
- [X] T026 [P] [US2] Add frontend authenticated profile display tests in /Users/tgiap.dev/devs/chatsc/frontend/src/test/auth-profile.test.tsx

### Implementation for User Story 2

- [X] T027 [US2] Implement username derivation and collision resolution in /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/utils/username.util.ts
- [X] T028 [US2] Implement profile creation and upsert logic in /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/auth.service.ts
- [X] T029 [US2] Add auth attempt persistence model for login outcomes in /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/schemas/auth-attempt.schema.ts
- [X] T030 [US2] Extend backend auth controller/service responses with current user profile data in /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/auth.controller.ts and /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/auth.service.ts
- [X] T031 [US2] Implement frontend authenticated user summary UI in /Users/tgiap.dev/devs/chatsc/frontend/src/features/auth/auth-summary.tsx and /Users/tgiap.dev/devs/chatsc/frontend/src/pages/home.page.tsx
- [X] T032 [US2] Update frontend auth types and store for profile fields in /Users/tgiap.dev/devs/chatsc/frontend/src/types/auth.ts and /Users/tgiap.dev/devs/chatsc/frontend/src/store/auth.store.ts

**Checkpoint**: User Story 2 hoàn tất khi profile lần đầu và username derivation hoạt động đúng với email Google

---

## Phase 5: User Story 3 - Duy trì phiên truy cập hợp lệ (Priority: P3)

**Goal**: Người dùng vẫn ở trạng thái đã đăng nhập khi reload trong phiên hợp lệ, và bị yêu cầu đăng nhập lại khi session không còn hợp lệ.

**Independent Test**: Đăng nhập thành công, reload website để xác nhận phiên được hydrate; sau khi logout hoặc session invalid thì protected area không còn truy cập được.

### Tests for User Story 3

- [X] T033 [P] [US3] Add backend session persistence and logout tests in /Users/tgiap.dev/devs/chatsc/backend/test/auth-session.e2e-spec.ts
- [X] T034 [P] [US3] Add frontend session hydrate and logout tests in /Users/tgiap.dev/devs/chatsc/frontend/src/test/auth-session.test.tsx

### Implementation for User Story 3

- [X] T035 [US3] Implement backend session validation and logout behavior in /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/auth.controller.ts and /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/auth.service.ts
- [X] T036 [US3] Implement frontend logout action and session expiry handling in /Users/tgiap.dev/devs/chatsc/frontend/src/store/auth.store.ts and /Users/tgiap.dev/devs/chatsc/frontend/src/services/auth.service.ts
- [X] T037 [US3] Implement frontend protected route redirect behavior for invalid session in /Users/tgiap.dev/devs/chatsc/frontend/src/app/protected-route.tsx and /Users/tgiap.dev/devs/chatsc/frontend/src/app/routes.tsx
- [X] T038 [US3] Add frontend auth error and session invalid messaging in /Users/tgiap.dev/devs/chatsc/frontend/src/features/auth/auth.page.tsx and /Users/tgiap.dev/devs/chatsc/frontend/src/features/auth/auth-summary.tsx

**Checkpoint**: User Story 3 hoàn tất khi session hợp lệ được giữ qua reload và session invalid buộc login lại

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hoàn thiện các phần dùng chung ảnh hưởng nhiều user story

- [X] T039 [P] Update backend and frontend quickstart env examples for OAuth rollout in /Users/tgiap.dev/devs/chatsc/specs/002-web-chat-gateway/quickstart.md
- [X] T040 [P] Align auth interface contract with delivered endpoint and state names in /Users/tgiap.dev/devs/chatsc/specs/002-web-chat-gateway/contracts/auth-interfaces.md
- [X] T041 Document final OAuth scaffold notes in /Users/tgiap.dev/devs/chatsc/specs/002-web-chat-gateway/plan.md
- [X] T042 Run full auth flow validation checklist updates in /Users/tgiap.dev/devs/chatsc/specs/002-web-chat-gateway/tasks.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup**: Bắt đầu ngay
- **Phase 2: Foundational**: Phụ thuộc Phase 1, chặn toàn bộ user stories
- **Phase 3: US1**: Phụ thuộc Phase 2, là MVP
- **Phase 4: US2**: Phụ thuộc Phase 3 vì profile creation đi sau happy-path login
- **Phase 5: US3**: Phụ thuộc Phase 3 và tận dụng session/profile behavior đã có
- **Phase 6: Polish**: Phụ thuộc các user stories mong muốn đã hoàn tất

### User Story Dependencies

- **US1 (P1)**: Bắt đầu sau Foundational, không phụ thuộc US2/US3
- **US2 (P2)**: Phụ thuộc flow auth thành công của US1
- **US3 (P3)**: Phụ thuộc session flow cơ bản của US1, có thể tận dụng dữ liệu profile từ US2 cho UI hoàn chỉnh hơn

### Within Each User Story

- Viết test story trước implementation chính
- Hoàn thiện backend flow trước khi wire frontend hydrate/protected behavior phụ thuộc vào endpoint
- Cập nhật UI/error states sau khi session/profile responses đã ổn định

### Parallel Opportunities

- **Setup**: T002, T003, T004 chạy song song sau T001
- **Foundational**: T006, T007, T008, T013, T014, T015 chạy song song sau T005/T009 theo dependency file
- **US1**: T016 và T017 chạy song song; T021 và T022 có thể song song sau khi backend endpoints ổn định
- **US2**: T025 và T026 chạy song song; T031 và T032 có thể song song sau T028/T030
- **US3**: T033 và T034 chạy song song; T036 và T037 có thể song song sau T035
- **Polish**: T039 và T040 chạy song song

---

## Parallel Example: User Story 1

```bash
Task: "Add backend auth endpoint integration tests in /Users/tgiap.dev/devs/chatsc/backend/test/auth-login.e2e-spec.ts"
Task: "Add frontend auth page and protected route tests in /Users/tgiap.dev/devs/chatsc/frontend/src/test/auth-login.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Hoàn tất Phase 1: Setup
2. Hoàn tất Phase 2: Foundational
3. Hoàn tất Phase 3: US1
4. Validate happy path Google login và protected area access

### Incremental Delivery

1. Setup + Foundational để khóa boundary auth, session và frontend state
2. Thêm US1 để có login flow dùng được
3. Thêm US2 để profile creation và username derivation đúng rule nghiệp vụ
4. Thêm US3 để session persistence/logout/expiry hoàn chỉnh
5. Polish docs và contract naming cuối cùng

### Parallel Team Strategy

1. Một người làm backend auth strategy/session boundary
2. Một người làm frontend auth page/store/protected route
3. Sau MVP, tách thêm người xử lý profile derivation và session edge cases

---

## Notes

- Tổng số task: 42
- Tất cả task đều theo đúng checklist format `- [ ] Txxx [P?] [Story?] Description with file path`
- MVP đề xuất: hoàn tất qua Phase 3 (US1)
- `check-prerequisites.sh --json` fail vì branch hiện tại là `main`, nhưng tasks vẫn được generate thủ công từ tài liệu feature tại `/Users/tgiap.dev/devs/chatsc/specs/002-web-chat-gateway/`