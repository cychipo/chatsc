# Tasks: Refresh Token Renewal

**Input**: Design documents from `/specs/005-refresh-token/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Bao gồm test tasks vì spec/plan/quickstart đã yêu cầu rõ các kịch bản backend e2e và frontend integration cho luồng refresh token.

**Organization**: Tasks được nhóm theo user story để mỗi story có thể được triển khai và kiểm thử độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác file, không phụ thuộc task chưa hoàn tất)
- **[Story]**: User story tương ứng (US1, US2, US3)
- Mỗi task đều ghi rõ file path cụ thể

## Path Conventions

- Backend: `backend/src/`, `backend/test/`
- Frontend: `frontend/src/`, `frontend/src/test/`
- Feature docs: `specs/005-refresh-token/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Chuẩn bị dependency và cấu hình nền cho token-based auth flow

- [x] T001 Cập nhật dependency token auth trong `backend/package.json`
- [x] T002 Bổ sung biến môi trường cho token secret, access token TTL, refresh token TTL và cookie config trong `backend/src/config/env.config.ts`
- [x] T003 [P] Bổ sung kiểu dữ liệu token/session response trong `frontend/src/types/auth.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Hạ tầng auth dùng chung phải hoàn tất trước khi làm từng user story

**⚠️ CRITICAL**: Không bắt đầu user story cho tới khi phase này hoàn tất

- [x] T004 Tạo schema refresh session trong `backend/src/modules/auth/schemas/refresh-session.schema.ts`
- [x] T005 [P] Mở rộng schema auth attempt hoặc tạo audit fields cho renewal event trong `backend/src/modules/auth/schemas/auth-attempt.schema.ts`
- [x] T006 Tạo type token payload và refresh response trong `backend/src/modules/auth/types/token-payload.ts`
- [x] T007 Cập nhật đăng ký schema/provider auth trong `backend/src/modules/auth/auth.module.ts`
- [x] T008 Cài đặt helper ký, xác minh và thu hồi token trong `backend/src/modules/auth/auth.service.ts`
- [x] T009 Tạo guard bearer token cho protected API trong `backend/src/modules/auth/guards/access-token-auth.guard.ts`
- [x] T010 Cập nhật bootstrap session/cors/cookie config cho refresh flow trong `backend/src/main.ts`
- [x] T011 Tạo helper quản lý access token runtime và refresh state dùng chung trong `frontend/src/services/http.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Tiếp tục sử dụng sau khi gia hạn phiên (Priority: P1) 🎯 MVP

**Goal**: Người dùng đang hoạt động vẫn dùng được protected API khi access token 30 phút hết hạn nhưng refresh token 7 ngày còn hiệu lực

**Independent Test**: Đăng nhập thành công, giả lập access token hết hạn nhưng refresh token còn hiệu lực, gửi protected request và xác nhận frontend tự refresh rồi retry thành công đúng một lần mà không yêu cầu đăng nhập lại

### Tests for User Story 1

- [x] T012 [P] [US1] Thêm backend e2e test phát hành token pair sau login trong `backend/test/auth.e2e-spec.ts`
- [x] T013 [P] [US1] Thêm backend e2e test refresh thành công với refresh token hợp lệ trong `backend/test/auth.e2e-spec.ts`
- [x] T014 [P] [US1] Thêm frontend integration test bootstrap khôi phục session qua refresh trong `frontend/src/test/auth-session.test.tsx`
- [x] T015 [P] [US1] Thêm frontend integration test interceptor refresh và retry thành công đúng một lần trong `frontend/src/test/auth-session.test.tsx`

### Implementation for User Story 1

- [x] T016 [US1] Cập nhật hoàn tất Google callback để phát hành access token và refresh token trong `backend/src/modules/auth/auth.controller.ts`
- [x] T017 [US1] Mở rộng logic auth service để tạo refresh session, access token và refresh response trong `backend/src/modules/auth/auth.service.ts`
- [x] T018 [US1] Thêm endpoint refresh trả access token mới trong `backend/src/modules/auth/auth.controller.ts`
- [x] T019 [US1] Cập nhật contract session user và auth session state cho token flow trong `backend/src/modules/auth/types/auth-session.ts`
- [x] T020 [US1] Bảo vệ endpoint business bằng bearer guard trong `backend/src/modules/chat/chat.controller.ts`
- [x] T021 [US1] Cập nhật `GET /auth/me` để trả profile phù hợp với token-based authenticated state trong `backend/src/modules/auth/auth.controller.ts`
- [x] T022 [US1] Thêm hàm login completion và refresh session client API trong `frontend/src/services/auth.service.ts`
- [x] T023 [US1] Cập nhật auth store để giữ `accessToken`, hydrate bằng refresh flow và duy trì authenticated state trong `frontend/src/store/auth.store.ts`
- [x] T024 [US1] Cập nhật Axios request/response interceptor để gắn bearer token, gọi refresh và retry một lần trong `frontend/src/services/http.ts`
- [x] T025 [US1] Cập nhật chat service dùng protected API qua HTTP client đã gắn token trong `frontend/src/services/chat.service.ts`

**Checkpoint**: User Story 1 phải hoạt động độc lập với login thành công, refresh thành công và protected request được phục hồi tự động

---

## Phase 4: User Story 2 - Đăng nhập lại khi refresh token hết hạn (Priority: P2)

**Goal**: Khi refresh token không còn hợp lệ, hệ thống kết thúc phiên rõ ràng và buộc người dùng đăng nhập lại thay vì retry vô hạn

**Independent Test**: Giả lập refresh token hết hạn, revoked hoặc không hợp lệ; gửi protected request và xác nhận refresh bị từ chối, auth state bị xóa và người dùng quay về luồng đăng nhập lại

### Tests for User Story 2

- [x] T026 [P] [US2] Thêm backend e2e test refresh thất bại khi refresh token hết hạn hoặc bị revoke trong `backend/test/auth.e2e-spec.ts`
- [x] T027 [P] [US2] Thêm backend e2e test logout thu hồi refresh session trong `backend/test/auth.e2e-spec.ts`
- [x] T028 [P] [US2] Thêm frontend integration test refresh thất bại sẽ chuyển store về unauthenticated trong `frontend/src/test/auth-session.test.tsx`
- [x] T029 [P] [US2] Thêm frontend integration test logout xóa auth state và không refresh lại sau đó trong `frontend/src/test/auth-session.test.tsx`

### Implementation for User Story 2

- [x] T030 [US2] Hoàn thiện logic từ chối refresh khi token thiếu, hết hạn, sai hoặc revoked trong `backend/src/modules/auth/auth.service.ts`
- [x] T031 [US2] Cập nhật logout để thu hồi refresh session và xóa refresh cookie trong `backend/src/modules/auth/auth.controller.ts`
- [x] T032 [US2] Ghi nhận renewal failure và logout revoke event trong `backend/src/modules/auth/auth.service.ts`
- [x] T033 [US2] Cập nhật frontend auth service xử lý refresh failure và logout cleanup trong `frontend/src/services/auth.service.ts`
- [x] T034 [US2] Cập nhật auth store để clear `currentUser`, `accessToken`, `errorMessage` khi refresh thất bại trong `frontend/src/store/auth.store.ts`
- [x] T035 [US2] Cập nhật protected route hoặc bootstrap flow để điều hướng về unauthenticated state rõ ràng trong `frontend/src/app/protected-route.tsx`

**Checkpoint**: User Stories 1 và 2 đều phải hoạt động độc lập; refresh không hợp lệ luôn dẫn tới re-authentication rõ ràng

---

## Phase 5: User Story 3 - Duy trì quy tắc phiên nhất quán (Priority: P3)

**Goal**: Token lifetime 30 phút/7 ngày, audit renewal event và xử lý nhiều request đồng thời phải nhất quán với policy của feature

**Independent Test**: Xác nhận access token hết hạn đúng theo TTL, refresh token ngừng gia hạn sau TTL hoặc khi revoked, nhiều request đồng thời chỉ sinh một refresh flow và renewal events được ghi nhận đầy đủ

### Tests for User Story 3

- [x] T036 [P] [US3] Thêm backend e2e test xác minh TTL 30 phút access token và 7 ngày refresh token trong `backend/test/auth.e2e-spec.ts`
- [x] T037 [P] [US3] Thêm backend e2e test renewal event được ghi nhận cho cả success và failure trong `backend/test/auth.e2e-spec.ts`
- [x] T038 [P] [US3] Thêm frontend integration test nhiều request đồng thời chỉ dùng một refresh promise trong `frontend/src/test/auth-session.test.tsx`
- [x] T039 [P] [US3] Thêm frontend integration test request retry thất bại vì lỗi business vẫn trả lỗi gốc trong `frontend/src/test/auth-session.test.tsx`

### Implementation for User Story 3

- [x] T040 [US3] Cố định TTL access token 30 phút và refresh token 7 ngày trong `backend/src/config/env.config.ts` và `backend/src/modules/auth/auth.service.ts`
- [x] T041 [US3] Cập nhật persistence refresh session để lưu `issuedAt`, `expiresAt`, `lastUsedAt`, `revokedAt` và status nhất quán trong `backend/src/modules/auth/schemas/refresh-session.schema.ts`
- [x] T042 [US3] Hoàn thiện audit ghi nhận refresh success/failure theo contract trong `backend/src/modules/auth/auth.service.ts`
- [x] T043 [US3] Hoàn thiện cơ chế shared refresh promise và hàng đợi request đồng thời trong `frontend/src/services/http.ts`
- [x] T044 [US3] Bảo đảm retry chỉ áp dụng cho lỗi expired token và trả lỗi gốc cho lỗi không liên quan auth trong `frontend/src/services/http.ts`

**Checkpoint**: Tất cả user stories phải hoạt động độc lập với TTL rõ ràng, concurrency ổn định và audit renewal nhất quán

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hoàn thiện tài liệu, rà soát config và xác thực end-to-end toàn feature

- [x] T045 [P] Cập nhật tài liệu env và auth flow trong `backend/.env.example` và `frontend/.env.example`
- [x] T046 [P] Cập nhật quickstart nếu có sai lệch sau khi triển khai trong `specs/005-refresh-token/quickstart.md`
- [x] T047 Chạy rà soát file contract/design và đồng bộ nếu implementation thay đổi trong `specs/005-refresh-token/contracts/auth-refresh-interfaces.md` và `specs/005-refresh-token/data-model.md`
- [x] T048 Chạy xác thực toàn bộ quickstart scenarios trong `specs/005-refresh-token/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Không phụ thuộc, có thể bắt đầu ngay
- **Foundational (Phase 2)**: Phụ thuộc Phase 1 và block toàn bộ user stories
- **User Story 1 (Phase 3)**: Phụ thuộc Phase 2; là MVP
- **User Story 2 (Phase 4)**: Phụ thuộc US1 vì dùng chung refresh flow đã có
- **User Story 3 (Phase 5)**: Phụ thuộc US1 và US2 để tối ưu TTL, audit và concurrency trên flow đã hoàn thiện
- **Polish (Phase 6)**: Phụ thuộc tất cả user stories đã hoàn tất

### User Story Dependencies

- **US1**: Có thể bắt đầu ngay sau Foundational phase
- **US2**: Phụ thuộc contract refresh/logout của US1 nhưng vẫn có tiêu chí kiểm thử độc lập
- **US3**: Phụ thuộc hạ tầng token của US1 và error/logout handling của US2

### Within Each User Story

- Test tasks phải được viết trước và fail trước khi implement
- Schema/type trước service logic
- Service logic trước controller/interceptor integration
- Auth store/service update trước khi xác thực UI flow hoàn chỉnh

### Parallel Opportunities

- T003 có thể chạy song song với T001-T002
- T004-T006 có thể chia song song trước khi hợp nhất vào T007-T011
- Trong US1, T012-T015 chạy song song; T022-T025 có thể chia backend/frontend song song sau khi T016-T021 ổn định
- Trong US2, T026-T029 chạy song song; T033-T035 có thể song song một phần sau khi T030-T032 hoàn tất
- Trong US3, T036-T039 chạy song song; T043-T044 có thể song song sau khi T040-T042 hoàn tất
- T045-T046 có thể chạy song song ở phase cuối

---

## Parallel Example: User Story 1

```bash
# Backend/frontend tests for US1 can be prepared together
Task: "Thêm backend e2e test phát hành token pair sau login trong backend/test/auth.e2e-spec.ts"
Task: "Thêm backend e2e test refresh thành công với refresh token hợp lệ trong backend/test/auth.e2e-spec.ts"
Task: "Thêm frontend integration test bootstrap khôi phục session qua refresh trong frontend/src/test/auth-session.test.tsx"
Task: "Thêm frontend integration test interceptor refresh và retry thành công đúng một lần trong frontend/src/test/auth-session.test.tsx"

# Frontend and backend implementation can split after shared auth contract is clear
Task: "Thêm endpoint refresh trả access token mới trong backend/src/modules/auth/auth.controller.ts"
Task: "Cập nhật auth store để giữ accessToken, hydrate bằng refresh flow và duy trì authenticated state trong frontend/src/store/auth.store.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Hoàn tất Phase 1: Setup
2. Hoàn tất Phase 2: Foundational
3. Hoàn tất Phase 3: User Story 1
4. Dừng lại và kiểm thử độc lập luồng login → access token hết hạn → refresh → retry thành công

### Incremental Delivery

1. Setup + Foundational tạo nền token auth
2. US1 mang lại giá trị cốt lõi: auto-refresh request
3. US2 hoàn thiện hành vi logout và re-authentication khi refresh không hợp lệ
4. US3 siết chặt TTL, audit và concurrency
5. Phase cuối đồng bộ docs và xác thực toàn bộ scenario

### Suggested MVP Scope

- Phase 1
- Phase 2
- Phase 3 (US1)

---

## Notes

- Tất cả tasks đều theo đúng format checklist: checkbox + ID + marker tùy chọn + story label khi cần + file path
- `[P]` chỉ dùng cho task có thể tách file hoặc tách trách nhiệm rõ ràng
- Mỗi user story có tiêu chí kiểm thử độc lập riêng
- `backend/test/auth.e2e-spec.ts` được dùng làm điểm tập trung cho e2e auth scenarios nếu repo chưa tách file test riêng
- Nếu trong lúc triển khai phát sinh file mới cụ thể hơn, có thể cập nhật lại path trong tasks trước khi bắt đầu code
