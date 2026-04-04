# Tasks: Nền tảng codebase FE + BE

**Input**: Design documents from `/specs/004-fe-be-codebase/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/system-interfaces.md, quickstart.md

**Tests**: Không tạo task viết test riêng vì spec không yêu cầu TDD hay test-first. Các task bên dưới vẫn bao gồm thiết lập test entrypoints để developer chạy kiểm tra đúng theo từng ứng dụng.

**Organization**: Tasks được nhóm theo user story để mỗi story có thể được triển khai và kiểm tra độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song
- **[Story]**: User story tương ứng (`[US1]`, `[US2]`, `[US3]`)
- Mỗi task đều ghi rõ file path cần tác động

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tạo skeleton repository và package workflow cơ bản cho hai ứng dụng

- [X] T001 Create root Yarn workspace configuration in /Users/tgiap.dev/devs/chatsc/package.json
- [X] T002 Create backend package manifest with baseline dependencies in /Users/tgiap.dev/devs/chatsc/backend/package.json
- [X] T003 [P] Create frontend package manifest with baseline dependencies in /Users/tgiap.dev/devs/chatsc/frontend/package.json
- [X] T004 [P] Create backend TypeScript configuration in /Users/tgiap.dev/devs/chatsc/backend/tsconfig.json
- [X] T005 [P] Create frontend TypeScript configuration in /Users/tgiap.dev/devs/chatsc/frontend/tsconfig.json
- [X] T006 [P] Create frontend Vite configuration in /Users/tgiap.dev/devs/chatsc/frontend/vite.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Hoàn thiện hạ tầng chung bắt buộc trước khi làm từng user story

**⚠️ CRITICAL**: Không bắt đầu user story trước khi phase này hoàn tất

- [X] T007 Create backend bootstrap entry and root module in /Users/tgiap.dev/devs/chatsc/backend/src/main.ts and /Users/tgiap.dev/devs/chatsc/backend/src/app.module.ts
- [X] T008 [P] Create backend env config loader in /Users/tgiap.dev/devs/chatsc/backend/src/config/env.config.ts
- [X] T009 [P] Create backend MongoDB connection factory in /Users/tgiap.dev/devs/chatsc/backend/src/database/mongoose.config.ts
- [X] T010 [P] Create backend health module files in /Users/tgiap.dev/devs/chatsc/backend/src/modules/health/health.module.ts and /Users/tgiap.dev/devs/chatsc/backend/src/modules/health/health.controller.ts
- [X] T011 Create frontend bootstrap and root app shell in /Users/tgiap.dev/devs/chatsc/frontend/src/main.tsx and /Users/tgiap.dev/devs/chatsc/frontend/src/App.tsx
- [X] T012 [P] Create frontend app providers and landing page modules in /Users/tgiap.dev/devs/chatsc/frontend/src/app/providers.tsx and /Users/tgiap.dev/devs/chatsc/frontend/src/pages/home.page.tsx
- [X] T013 [P] Create centralized Axios client in /Users/tgiap.dev/devs/chatsc/frontend/src/services/http.ts
- [X] T014 [P] Create base Zustand app store in /Users/tgiap.dev/devs/chatsc/frontend/src/store/app.store.ts
- [X] T015 [P] Create backend environment example in /Users/tgiap.dev/devs/chatsc/backend/.env.example
- [X] T016 [P] Create frontend environment example in /Users/tgiap.dev/devs/chatsc/frontend/.env.example
- [X] T017 [P] Create frontend glassstyle theme tokens and Ant Design provider setup in /Users/tgiap.dev/devs/chatsc/frontend/src/theme/theme.ts and /Users/tgiap.dev/devs/chatsc/frontend/src/theme/antd-theme.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Bắt đầu làm việc với frontend và backend từ một nền tảng rõ ràng (Priority: P1) 🎯 MVP

**Goal**: Developer mở repo và có ngay hai khu vực ứng dụng rõ ràng, runnable và dễ định vị nơi thêm code mới.

**Independent Test**: Mở repository và xác định ngay `frontend/` với `backend/`; mỗi bên có skeleton source, env mẫu, UI shell cơ bản và script chạy local độc lập.

### Implementation for User Story 1

- [X] T018 [P] [US1] Create backend shared source placeholders in /Users/tgiap.dev/devs/chatsc/backend/src/common/.gitkeep and /Users/tgiap.dev/devs/chatsc/backend/src/modules/.gitkeep
- [X] T019 [P] [US1] Create frontend shared source placeholders in /Users/tgiap.dev/devs/chatsc/frontend/src/components/.gitkeep and /Users/tgiap.dev/devs/chatsc/frontend/src/features/.gitkeep
- [X] T020 [US1] Add backend local development scripts and startup flow in /Users/tgiap.dev/devs/chatsc/backend/package.json
- [X] T021 [US1] Add frontend local development scripts and startup flow in /Users/tgiap.dev/devs/chatsc/frontend/package.json
- [X] T022 [US1] Wire backend readiness route in /Users/tgiap.dev/devs/chatsc/backend/src/modules/health/health.controller.ts and /Users/tgiap.dev/devs/chatsc/backend/src/modules/health/health.module.ts
- [X] T023 [US1] Add frontend landing page wired to the app shell in /Users/tgiap.dev/devs/chatsc/frontend/src/pages/home.page.tsx and /Users/tgiap.dev/devs/chatsc/frontend/src/App.tsx
- [X] T024 [US1] Document feature-level startup flow and expected repo boundaries in /Users/tgiap.dev/devs/chatsc/specs/004-fe-be-codebase/quickstart.md

**Checkpoint**: User Story 1 hoàn tất khi developer có thể nhận diện cấu trúc repo và chạy từng app độc lập

---

## Phase 4: User Story 2 - Làm việc nhất quán trên toàn bộ full stack (Priority: P2)

**Goal**: Thiết lập convention đồng nhất giữa frontend và backend để chuyển ngữ cảnh dễ dàng.

**Independent Test**: Soát package scripts, env naming, cấu trúc thư mục và vị trí config/test của cả hai ứng dụng; mọi nơi đều theo quy ước nhất quán và dễ đoán.

### Implementation for User Story 2

- [X] T025 [P] [US2] Standardize backend script naming for dev build and test in /Users/tgiap.dev/devs/chatsc/backend/package.json
- [X] T026 [P] [US2] Standardize frontend script naming for dev build and test in /Users/tgiap.dev/devs/chatsc/frontend/package.json
- [X] T027 [P] [US2] Add backend Jest test entry files in /Users/tgiap.dev/devs/chatsc/backend/test/jest-e2e.json and /Users/tgiap.dev/devs/chatsc/backend/test/app.e2e-spec.ts
- [X] T028 [P] [US2] Add frontend Vitest setup files in /Users/tgiap.dev/devs/chatsc/frontend/vitest.config.ts and /Users/tgiap.dev/devs/chatsc/frontend/src/test/setup.ts
- [X] T029 [US2] Define shared environment naming conventions in /Users/tgiap.dev/devs/chatsc/backend/.env.example and /Users/tgiap.dev/devs/chatsc/frontend/.env.example
- [X] T030 [US2] Capture full-stack working conventions and ownership rules in /Users/tgiap.dev/devs/chatsc/specs/004-fe-be-codebase/contracts/system-interfaces.md
- [X] T031 [US2] Align repository-level workspace commands with per-app commands in /Users/tgiap.dev/devs/chatsc/package.json

**Checkpoint**: User Story 2 hoàn tất khi developer có thể suy ra cùng kiểu setup và workflow ở cả hai app

---

## Phase 5: User Story 3 - Hỗ trợ triển khai các tính năng auth và chat trên nền tảng chung (Priority: P3)

**Goal**: Chuẩn bị sẵn các integration points để auth và chat được thêm vào sau này mà không cần tái cấu trúc lớn.

**Independent Test**: Đối chiếu spec auth/chat vào codebase hiện tại và xác định được ngay nơi đặt feature frontend, module backend, HTTP service và theme/app shell liên quan.

### Implementation for User Story 3

- [X] T032 [P] [US3] Create backend auth module placeholder files in /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/auth.module.ts and /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/auth.controller.ts
- [X] T033 [P] [US3] Create backend chat module placeholder files in /Users/tgiap.dev/devs/chatsc/backend/src/modules/chat/chat.module.ts and /Users/tgiap.dev/devs/chatsc/backend/src/modules/chat/chat.controller.ts
- [X] T034 [P] [US3] Create frontend auth feature entry files in /Users/tgiap.dev/devs/chatsc/frontend/src/features/auth/index.ts and /Users/tgiap.dev/devs/chatsc/frontend/src/features/auth/auth.page.tsx
- [X] T035 [P] [US3] Create frontend chat feature entry files in /Users/tgiap.dev/devs/chatsc/frontend/src/features/chat/index.ts and /Users/tgiap.dev/devs/chatsc/frontend/src/features/chat/chat.page.tsx
- [X] T036 [US3] Wire backend API prefix and module registration points in /Users/tgiap.dev/devs/chatsc/backend/src/app.module.ts and /Users/tgiap.dev/devs/chatsc/backend/src/main.ts
- [X] T037 [US3] Implement frontend API service organization for future auth and chat flows in /Users/tgiap.dev/devs/chatsc/frontend/src/services/auth.service.ts and /Users/tgiap.dev/devs/chatsc/frontend/src/services/chat.service.ts
- [X] T038 [US3] Add shared feature-facing types and app extension points in /Users/tgiap.dev/devs/chatsc/frontend/src/types/auth.ts, /Users/tgiap.dev/devs/chatsc/frontend/src/types/chat.ts, and /Users/tgiap.dev/devs/chatsc/frontend/src/app/routes.tsx
- [X] T039 [US3] Document auth/chat extension mapping in /Users/tgiap.dev/devs/chatsc/specs/004-fe-be-codebase/data-model.md

**Checkpoint**: User Story 3 hoàn tất khi auth/chat có vị trí mở rộng rõ ràng ở cả frontend và backend

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hoàn thiện các phần ảnh hưởng nhiều user story

- [X] T040 [P] Integrate Lucide-only icon usage into reusable frontend UI primitives in /Users/tgiap.dev/devs/chatsc/frontend/src/components/icon.tsx and /Users/tgiap.dev/devs/chatsc/frontend/src/components/layout-shell.tsx
- [X] T041 Run quickstart validation and update onboarding details in /Users/tgiap.dev/devs/chatsc/specs/004-fe-be-codebase/quickstart.md
- [X] T042 Update implementation plan notes to reflect the delivered repository structure in /Users/tgiap.dev/devs/chatsc/specs/004-fe-be-codebase/plan.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup**: Bắt đầu ngay
- **Phase 2: Foundational**: Phụ thuộc Phase 1, chặn toàn bộ user stories
- **Phase 3: US1**: Phụ thuộc Phase 2, là MVP
- **Phase 4: US2**: Phụ thuộc Phase 2; có thể làm sau hoặc song song với US1 nếu cần, nhưng nên hoàn tất sau MVP
- **Phase 5: US3**: Phụ thuộc Phase 2; tốt nhất làm sau khi cấu trúc và convention đã ổn định
- **Phase 6: Polish**: Phụ thuộc các user stories mong muốn đã hoàn tất

### User Story Dependencies

- **US1 (P1)**: Không phụ thuộc US2/US3
- **US2 (P2)**: Không phụ thuộc logic US1, nhưng hưởng lợi từ skeleton đã ổn định của US1
- **US3 (P3)**: Phụ thuộc nền tảng chung đã có từ Setup + Foundational; không yêu cầu hoàn tất business logic auth/chat thật

### Within Each User Story

- Tạo thư mục và placeholder trước
- Hoàn thiện script/configuration trước wiring runtime
- Cập nhật tài liệu sau khi cấu trúc và integration points đã ổn định

### Parallel Opportunities

- **Setup**: T003, T004, T005, T006 chạy song song sau T001
- **Foundational**: T008, T009, T010, T012, T013, T014, T015, T016, T017 chạy song song sau T007 và T011 tương ứng
- **US1**: T018 và T019 chạy song song; T020 và T021 chạy song song
- **US2**: T025, T026, T027, T028 chạy song song; T029 có thể làm song song trước T030
- **US3**: T032, T033, T034, T035 chạy song song
- **Polish**: T040 chạy độc lập trước T041 và T042

---

## Parallel Example: User Story 3

```bash
Task: "Create backend auth module placeholder files in /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/auth.module.ts and /Users/tgiap.dev/devs/chatsc/backend/src/modules/auth/auth.controller.ts"
Task: "Create backend chat module placeholder files in /Users/tgiap.dev/devs/chatsc/backend/src/modules/chat/chat.module.ts and /Users/tgiap.dev/devs/chatsc/backend/src/modules/chat/chat.controller.ts"
Task: "Create frontend auth feature entry files in /Users/tgiap.dev/devs/chatsc/frontend/src/features/auth/index.ts and /Users/tgiap.dev/devs/chatsc/frontend/src/features/auth/auth.page.tsx"
Task: "Create frontend chat feature entry files in /Users/tgiap.dev/devs/chatsc/frontend/src/features/chat/index.ts and /Users/tgiap.dev/devs/chatsc/frontend/src/features/chat/chat.page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Hoàn tất Phase 1: Setup
2. Hoàn tất Phase 2: Foundational
3. Hoàn tất Phase 3: US1
4. Validate developer có thể nhận diện repo và chạy riêng frontend/backend

### Incremental Delivery

1. Setup + Foundational để khóa skeleton chung
2. Thêm US1 để có nền tảng runnable
3. Thêm US2 để chuẩn hóa workflow và convention
4. Thêm US3 để mở đường cho auth/chat
5. Polish theme, icons và quickstart cuối cùng

### Parallel Team Strategy

1. Một người chốt root/workspace + backend bootstrap
2. Một người chốt frontend bootstrap + theme/service layer
3. Sau Foundational, tách người làm convention (US2) và feature extension points (US3)

---

## Notes

- Tổng số task: 42
- Tất cả task đều theo đúng checklist format `- [ ] Txxx [P?] [Story?] Description with file path`
- Tasks đã được refine để giảm chồng chéo giữa setup và user-story phases, đồng thời chỉ rõ file-level targets cho implement
- MVP đề xuất: hoàn tất qua Phase 3 (US1)
- `check-prerequisites.sh --json` fail vì branch hiện tại là `main`, nên plan/tasks đang phản ánh current workspace thay vì feature branch thực thi