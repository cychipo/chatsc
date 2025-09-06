# Tasks: Xác thực bằng tài khoản thường

**Input**: Design documents from `/specs/009-local-auth/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Không tạo task test tự động riêng vì spec không yêu cầu TDD bắt buộc; validation tập trung vào build và quickstart/integration flow của auth.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g. [US1], [US2], [US3])
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Chuẩn bị bề mặt cấu hình và khả năng gọi SHA1 remote cho local auth.

- [X] T001 Cập nhật tài liệu cấu hình backend mẫu cho local auth và remote processor dùng chung trong `backend/.env.example`
- [X] T002 [P] Cập nhật tài liệu cấu hình frontend mẫu cho auth thường trong `frontend/.env.example`
- [X] T003 [P] Mở rộng validate runtime config cho local auth/SHA1 remote trong `backend/src/config/env.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Hoàn thiện các thành phần dùng chung cho mọi luồng đăng ký/đăng nhập local.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Tạo service xử lý SHA1 remote dùng chung cho auth trong `backend/src/modules/auth/auth-processing.service.ts`
- [X] T005 [P] Đăng ký service xử lý local auth trong `backend/src/modules/auth/auth.module.ts`
- [X] T006 [P] Mở rộng schema người dùng để hỗ trợ local credential metadata trong `backend/src/modules/auth/schemas/user.schema.ts`
- [X] T007 [P] Chuẩn hoá kiểu dữ liệu frontend cho local auth state/payload trong `frontend/src/types/auth.ts`
- [X] T008 Tạo DTO/validation cho request đăng ký và đăng nhập local trong `backend/src/modules/auth/dto/local-auth.dto.ts`
- [X] T009 Chuẩn hoá taxonomy log cho register/login local trong `backend/src/modules/auth/schemas/auth-attempt.schema.ts` và `backend/src/modules/auth/auth.service.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Đăng ký tài khoản mới (Priority: P1) 🎯 MVP

**Goal**: Người dùng mới có thể tạo tài khoản local bằng email, username, display name và mật khẩu, sau đó được đăng nhập ngay.

**Independent Test**: Mở màn hình đăng ký, gửi form hợp lệ và xác nhận user mới được tạo trong DB với local credential metadata, refresh cookie được cấp và người dùng vào được khu vực đã bảo vệ.

### Implementation for User Story 1

- [X] T010 [US1] Bổ sung logic hash mật khẩu local qua SHA1 remote trong `backend/src/modules/auth/auth-processing.service.ts`
- [X] T011 [US1] Thêm service đăng ký local account, kiểm tra duplicate và cấp phiên sau đăng ký trong `backend/src/modules/auth/auth.service.ts`
- [X] T012 [US1] Thêm endpoint `POST /auth/register` theo contract trong `backend/src/modules/auth/auth.controller.ts`
- [X] T013 [P] [US1] Bổ sung hàm gọi API đăng ký local trong `frontend/src/services/auth.service.ts`
- [X] T014 [US1] Mở rộng auth store để nhận session từ đăng ký local trong `frontend/src/store/auth.store.ts`
- [X] T015 [US1] Cập nhật UI auth để hiển thị form đăng ký local và field validation trong `frontend/src/features/auth/auth.page.tsx`
- [X] T016 [P] [US1] Đồng bộ contract đăng ký local trong `specs/009-local-auth/contracts/local-auth-contract.md`
- [X] T017 [US1] Bổ sung quickstart cho luồng đăng ký local thành công, duplicate và validation trong `specs/009-local-auth/quickstart.md`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Đăng nhập bằng tài khoản thường (Priority: P2)

**Goal**: Người dùng có local account có thể đăng nhập lại bằng email + mật khẩu, nhận phiên hợp lệ và bị chặn an toàn khi sai thông tin hoặc tài khoản không hợp lệ.

**Independent Test**: Dùng tài khoản local đã tồn tại để đăng nhập thành công; sau đó thử password sai, email không tồn tại, tài khoản Google-only và xác nhận tất cả đều trả kết quả đúng contract.

### Implementation for User Story 2

- [X] T018 [US2] Bổ sung logic xác minh local password và chặn account không hợp lệ trong `backend/src/modules/auth/auth.service.ts`
- [X] T019 [US2] Thêm endpoint `POST /auth/login` theo contract trong `backend/src/modules/auth/auth.controller.ts`
- [X] T020 [P] [US2] Bổ sung hàm gọi API đăng nhập local trong `frontend/src/services/auth.service.ts`
- [X] T021 [US2] Mở rộng auth store để nhận session từ đăng nhập local trong `frontend/src/store/auth.store.ts`
- [X] T022 [US2] Cập nhật UI auth để hiển thị form đăng nhập local, lỗi submit an toàn và chuyển vào khu vực bảo vệ sau thành công trong `frontend/src/features/auth/auth.page.tsx`
- [X] T023 [P] [US2] Đồng bộ contract đăng nhập local và failure cases trong `specs/009-local-auth/contracts/local-auth-contract.md`
- [X] T024 [US2] Bổ sung quickstart cho login local thành công/thất bại và tài khoản Google-only trong `specs/009-local-auth/quickstart.md`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Chuyển đổi rõ ràng giữa các cách đăng nhập (Priority: P3)

**Goal**: Người dùng nhìn thấy rõ Google login, local login và local register trên cùng bề mặt auth mà không bị nhầm chức năng.

**Independent Test**: Mở màn hình auth và xác nhận có thể chuyển giữa Google CTA, local login và local register; sau đó thử Google login cũ để chắc chắn luồng hiện tại vẫn hoạt động.

### Implementation for User Story 3

- [X] T025 [US3] Thiết kế lại state/view model cho nhiều chế độ auth trên frontend trong `frontend/src/features/auth/auth.page.tsx`
- [X] T026 [P] [US3] Bổ sung kiểu dữ liệu frontend cho auth form mode và submit state trong `frontend/src/types/auth.ts`
- [X] T027 [US3] Điều chỉnh thông điệp lỗi/cta để phân biệt local auth với Google login trong `frontend/src/features/auth/auth.page.tsx`
- [X] T028 [P] [US3] Đồng bộ contract UI state cho auth screen trong `specs/009-local-auth/contracts/local-auth-contract.md`
- [X] T029 [US3] Bổ sung quickstart cho luồng chuyển đổi giữa Google login, local login và local register trong `specs/009-local-auth/quickstart.md`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hoàn thiện các phần cắt ngang nhiều user story và xác minh end-to-end.

- [X] T030 [P] Rà soát mọi vị trí ghi log hoặc trả lỗi auth để đảm bảo không lộ plaintext password trong `backend/src/modules/auth/auth.service.ts`, `backend/src/modules/auth/auth.controller.ts`, và `frontend/src/features/auth/auth.page.tsx`
- [X] T031 [P] Cập nhật tài liệu thiết kế nếu tên field local credential hoặc taxonomy auth attempt thay đổi trong `specs/009-local-auth/research.md` và `specs/009-local-auth/data-model.md`
- [X] T032 Chạy full quickstart validation cho đăng ký local, đăng nhập local, coexist với Google login và lỗi SHA1 remote bằng `specs/009-local-auth/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion và nên reuse logic local credential/SHA1 đã có từ Phase 2
- **User Story 3 (Phase 5)**: Depends on Foundational completion; có thể làm sau khi US1/US2 đã chốt API và auth form state
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Bắt đầu sau Phase 2, không phụ thuộc vào US2/US3
- **User Story 2 (P2)**: Phụ thuộc vào hạ tầng local credential và SHA1 remote từ Phase 2; thực tế nên làm sau US1 để reuse session flow đã chốt
- **User Story 3 (P3)**: Phụ thuộc vào việc xác định rõ local register/login flow ở US1/US2

### Within Each User Story

- Backend schema/config/validation trước khi mở endpoint thật
- Auth service trước controller và frontend submit
- Frontend service/store trước UI binding
- Contract và quickstart cập nhật sau khi hành vi code đã rõ

### Parallel Opportunities

- T002 và T003 có thể chạy song song sau T001
- T005, T006, T007 và T008 có thể chạy song song sau khi chốt hướng tiếp cận ở T004
- Trong US1, T013 và T016 có thể chạy song song sau khi service/backend contract đã rõ
- Trong US2, T020 và T023 có thể chạy song song sau khi API login local được chốt
- Trong US3, T026 và T028 có thể chạy song song
- T030 và T031 có thể chạy song song ở phase polish

---

## Parallel Example: User Story 1

```bash
# Đồng bộ frontend service và contract sau khi backend register flow đã rõ:
Task: "Bổ sung hàm gọi API đăng ký local trong frontend/src/services/auth.service.ts"
Task: "Đồng bộ contract đăng ký local trong specs/009-local-auth/contracts/local-auth-contract.md"
```

---

## Parallel Example: User Story 2

```bash
# Đồng bộ client login và contract song song sau khi endpoint login local đã chốt:
Task: "Bổ sung hàm gọi API đăng nhập local trong frontend/src/services/auth.service.ts"
Task: "Đồng bộ contract đăng nhập local và failure cases trong specs/009-local-auth/contracts/local-auth-contract.md"
```

---

## Parallel Example: User Story 3

```bash
# Hoàn thiện UI auth state song song với contract UI:
Task: "Bổ sung kiểu dữ liệu frontend cho auth form mode và submit state trong frontend/src/types/auth.ts"
Task: "Đồng bộ contract UI state cho auth screen trong specs/009-local-auth/contracts/local-auth-contract.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop và validate người dùng mới có thể đăng ký local account và vào hệ thống ngay
5. Demo được local register flow trước khi mở rộng sang local login và multi-mode auth UI

### Incremental Delivery

1. Hoàn tất Setup + Foundational để có local credential model và SHA1 remote processing cho auth
2. Add User Story 1 để khóa local register + issue session flow
3. Add User Story 2 để hỗ trợ login local an toàn
4. Add User Story 3 để hoàn thiện auth UI nhiều chế độ song song với Google login
5. Kết thúc bằng quickstart validation toàn bộ feature

### Parallel Team Strategy

Với nhiều người cùng làm:

1. Một người xử lý schema/config/auth processing service ở backend
2. Một người xử lý endpoint/service/store cho register/login local
3. Một người xử lý auth UI, contract và quickstart

---

## Notes

- Tất cả task đều theo đúng format checklist với ID, label và file path
- Không tạo test task riêng vì spec không yêu cầu test-first hay bộ test bắt buộc
- MVP đề xuất: **Phase 1 + Phase 2 + Phase 3 (User Story 1)**
- Validation độc lập của từng story bám theo `specs/009-local-auth/quickstart.md`
