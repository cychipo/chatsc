# Tasks: Mã hoá ngược qua nhân Linux từ xa

**Input**: Design documents from `/specs/008-reverse-kernel-encryption/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Không tạo task test tự động riêng vì spec không yêu cầu TDD hay bộ test mới bắt buộc. Validation tập trung vào build, quickstart và kiểm thử tích hợp thủ công theo tài liệu feature.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3])
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Chuẩn bị cấu hình và bề mặt tích hợp chung cho luồng mã hoá ngược qua backend.

- [X] T001 Cập nhật tài liệu cấu hình backend mẫu trong `backend/.env.example`
- [X] T002 [P] Cập nhật tài liệu cấu hình frontend mẫu trong `frontend/.env.example`
- [X] T003 [P] Mở rộng cấu hình runtime cho backend trong `backend/src/config/env.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Các thành phần lõi dùng chung cho mọi luồng ghi/đọc chat phải hoàn tất trước khi làm theo từng user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Tạo service xử lý mã hoá ngược dùng chung cho backend trong `backend/src/modules/chat/chat-encryption.service.ts`
- [X] T005 [P] Đăng ký service và wiring dependency trong `backend/src/modules/chat/chat.module.ts`
- [X] T006 [P] Mở rộng schema tin nhắn với metadata trạng thái mã hoá ngược trong `backend/src/modules/chat/schemas/message.schema.ts`
- [X] T007 Chuẩn hoá kiểu dữ liệu message trả về cho frontend trong `frontend/src/types/chat.ts`
- [X] T008 Thiết lập chiến lược lỗi xử lý chung cho chat encryption trong `backend/src/modules/chat/utils/chat-error.util.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Lưu tin nhắn dưới dạng mã hoá ngược (Priority: P1) 🎯 MVP

**Goal**: Mọi tin nhắn mới được mã hoá ngược qua luồng xử lý Linux từ xa trước khi ghi vào DB, và không có fallback thầm lặng sang plaintext.

**Independent Test**: Gửi một tin nhắn mới qua backend/chat realtime, xác nhận bản ghi trong DB lưu ciphertext thay vì plaintext và có metadata trạng thái xử lý phù hợp.

### Implementation for User Story 1

- [X] T009 [US1] Tích hợp mã hoá ngược vào luồng gửi tin nhắn trước khi lưu trong `backend/src/modules/chat/chat.service.ts`
- [X] T010 [US1] Cập nhật payload realtime sau khi lưu để dùng dữ liệu message mới trong `backend/src/modules/chat/chat.service.ts`
- [X] T011 [US1] Cập nhật luồng socket gửi tin nhắn để fail rõ ràng khi mã hoá không thành công trong `backend/src/modules/chat/chat.gateway.ts`
- [X] T012 [P] [US1] Điều chỉnh response contract gửi tin nhắn theo feature trong `specs/008-reverse-kernel-encryption/contracts/chat-reverse-encryption-contract.md`
- [X] T013 [US1] Bổ sung hướng dẫn kiểm tra bản ghi lưu trữ cho luồng gửi mới trong `specs/008-reverse-kernel-encryption/quickstart.md`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Hiển thị lại nội dung dễ đọc cho người xem (Priority: P2)

**Goal**: Nội dung lưu dưới dạng mã hoá ngược được khôi phục trước khi trả ra REST, preview hội thoại và realtime display để người dùng luôn thấy nội dung đọc được.

**Independent Test**: Tải lại lịch sử hội thoại, quan sát preview ở danh sách hội thoại và nhận tin nhắn realtime; xác nhận cả ba luồng đều hiển thị plaintext khôi phục được thay vì ciphertext.

### Implementation for User Story 2

- [X] T014 [US2] Tích hợp khôi phục nội dung trong luồng lấy danh sách tin nhắn ở `backend/src/modules/chat/chat.service.ts`
- [X] T015 [US2] Tích hợp khôi phục nội dung trong preview hội thoại ở `backend/src/modules/chat/chat.service.ts`
- [X] T016 [US2] Tích hợp khôi phục nội dung cho payload realtime ở `backend/src/modules/chat/chat.service.ts`
- [X] T017 [P] [US2] Điều chỉnh endpoint lấy lịch sử nếu cần trạng thái hiển thị bổ sung trong `backend/src/modules/chat/chat.controller.ts`
- [X] T018 [P] [US2] Đồng bộ kiểu dữ liệu và mapping client cho message hiển thị trong `frontend/src/services/chat.service.ts`
- [X] T019 [P] [US2] Đồng bộ contract cho REST, preview và socket payload trong `specs/008-reverse-kernel-encryption/contracts/chat-reverse-encryption-contract.md`
- [X] T020 [US2] Bổ sung quickstart cho kiểm tra history, preview và realtime trong `specs/008-reverse-kernel-encryption/quickstart.md`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Vận hành cấu hình an toàn và rõ ràng (Priority: P3)

**Goal**: Đội vận hành có thể bật feature bằng các khóa env mẫu rõ ràng, và hệ thống fail rõ khi thiếu cấu hình hoặc không kết nối được dịch vụ xử lý từ xa.

**Independent Test**: Điền các khóa mới vào env thật rồi chạy hệ thống thành công; sau đó thử thiếu một khóa bắt buộc hoặc ngắt kết nối processor và xác nhận hệ thống trả lỗi rõ ràng.

### Implementation for User Story 3

- [X] T021 [US3] Hoàn thiện validate các khóa cấu hình bắt buộc cho backend trong `backend/src/config/env.config.ts`
- [X] T022 [P] [US3] Bổ sung mô tả ý nghĩa từng khóa cấu hình mẫu ở `backend/.env.example`
- [X] T023 [P] [US3] Bổ sung cờ cấu hình công khai nếu cần cho frontend ở `frontend/.env.example`
- [X] T024 [US3] Tạo thông điệp lỗi cấu hình hoặc kết nối processor rõ ràng trong `backend/src/modules/chat/chat-encryption.service.ts`
- [X] T025 [P] [US3] Đồng bộ tài liệu contract cho phần cấu hình mẫu trong `specs/008-reverse-kernel-encryption/contracts/chat-reverse-encryption-contract.md`
- [X] T026 [US3] Bổ sung quickstart cho luồng kiểm tra lỗi cấu hình và lỗi kết nối trong `specs/008-reverse-kernel-encryption/quickstart.md`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hoàn thiện các phần cắt ngang nhiều user story và xác minh end-to-end.

- [X] T027 [P] Rà soát mọi vị trí đang đọc `message.content` để tránh lộ ciphertext trong `backend/src/modules/chat/chat.service.ts`, `backend/src/modules/chat/chat.gateway.ts`, và `frontend/src/features/chat/`
- [X] T028 [P] Cập nhật tài liệu thiết kế cho quyết định cuối cùng nếu tên khóa env hoặc trạng thái metadata thay đổi trong `specs/008-reverse-kernel-encryption/research.md` và `specs/008-reverse-kernel-encryption/data-model.md`
- [X] T029 Chạy full quickstart validation cho luồng gửi, lưu ciphertext, khôi phục history/preview/realtime và lỗi cấu hình bằng `specs/008-reverse-kernel-encryption/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion và cần tái sử dụng service mã hoá/khôi phục đã tạo ở Phase 2
- **User Story 3 (Phase 5)**: Depends on Foundational completion, có thể làm song song với US1/US2 nếu đã chốt nhu cầu cấu hình
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Bắt đầu sau Phase 2, không phụ thuộc vào US2 hay US3
- **User Story 2 (P2)**: Phụ thuộc vào hạ tầng chung và thực tế nên làm sau hoặc song song cuối US1 vì cần reuse logic xử lý message đã ổn định
- **User Story 3 (P3)**: Có thể tiến hành sau Phase 2 nhưng nên chốt sau khi biết chính xác các khóa env và thông điệp lỗi cần expose

### Within Each User Story

- Service nền tảng trước, sau đó tích hợp vào luồng chat
- Metadata/schema trước khi đọc/ghi dữ liệu thật
- REST/realtime/preview phải dùng cùng một quy tắc khôi phục
- Tài liệu quickstart và contract cập nhật sau khi hành vi code đã rõ

### Parallel Opportunities

- T002 và T003 có thể chạy song song sau T001
- T005, T006, T007 và T008 có thể chạy song song sau khi tạo hướng tiếp cận ở T004
- Trong US2, T017, T018 và T019 có thể chạy song song sau khi logic khôi phục cốt lõi được chốt
- Trong US3, T022, T023 và T025 có thể chạy song song
- T027 và T028 có thể chạy song song ở phase polish

---

## Parallel Example: User Story 2

```bash
# Đồng bộ contract và client mapping song song sau khi logic khôi phục cốt lõi xong:
Task: "Điều chỉnh endpoint lấy lịch sử nếu cần trạng thái hiển thị bổ sung trong backend/src/modules/chat/chat.controller.ts"
Task: "Đồng bộ kiểu dữ liệu và mapping client cho message hiển thị trong frontend/src/services/chat.service.ts"
Task: "Đồng bộ contract cho REST, preview và socket payload trong specs/008-reverse-kernel-encryption/contracts/chat-reverse-encryption-contract.md"
```

---

## Parallel Example: User Story 3

```bash
# Chuẩn bị cấu hình mẫu song song:
Task: "Bổ sung mô tả ý nghĩa từng khóa cấu hình mẫu ở backend/.env.example"
Task: "Bổ sung cờ cấu hình công khai nếu cần cho frontend ở frontend/.env.example"
Task: "Đồng bộ tài liệu contract cho phần cấu hình mẫu trong specs/008-reverse-kernel-encryption/contracts/chat-reverse-encryption-contract.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop và validate việc gửi tin nhắn mới chỉ lưu ciphertext trong DB
5. Demo luồng lưu trữ an toàn trước khi mở rộng sang khôi phục hiển thị

### Incremental Delivery

1. Hoàn tất Setup + Foundational để có service mã hoá/khôi phục dùng chung
2. Add User Story 1 để khóa luồng lưu ciphertext
3. Add User Story 2 để trả nội dung hiển thị đúng ở history/preview/realtime
4. Add User Story 3 để hoàn tất env mẫu và failure mode rõ ràng
5. Kết thúc bằng quickstart validation toàn bộ feature

### Parallel Team Strategy

Với nhiều người cùng làm:

1. Một người xử lý schema/config nền tảng và chat encryption service
2. Một người xử lý luồng đọc/hiển thị ở REST, preview và realtime
3. Một người xử lý env example, thông điệp lỗi vận hành và quickstart/contract

---

## Notes

- Tất cả task đều theo đúng format checklist với ID, label và file path
- Không tạo test task riêng vì spec không yêu cầu test-first hay bộ test mới bắt buộc
- MVP đề xuất: **Phase 1 + Phase 2 + Phase 3 (User Story 1)**
- Validation độc lập của từng story bám theo `specs/008-reverse-kernel-encryption/quickstart.md`
