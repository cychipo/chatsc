# Implementation Plan: Chat Groups

**Branch**: `[003-chat-groups]` | **Date**: 2026-04-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-chat-groups/spec.md`

## Summary

Triển khai module chat theo 2 luồng chính: chat 1-1 và chat nhóm, có lịch sử thành viên minh bạch (ai thêm ai, lúc nào), hỗ trợ rời nhóm/xóa thành viên theo quyền, và gửi tin nhắn từ frontend lên backend bằng binary rồi decode về text ở backend trước khi đi vào luồng xử lý chat hiện tại kết nối nhân Linux.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + backend), Node.js LTS  
**Primary Dependencies**: NestJS 10, Mongoose 8, React 18, Zustand 5, Axios 1.12, Ant Design 5  
**Storage**: MongoDB (conversation, participant, message, membership-event)  
**Testing**: Jest e2e (backend), Vitest + Testing Library (frontend)  
**Target Platform**: Web app (React/Vite) + Linux-hosted NestJS API  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: Lịch sử chat tải thêm 10 tin nhắn cũ hơn trong <2s cho >=95% request (theo SC-003)  
**Constraints**: FE->BE payload message bắt buộc binary; BE phải decode thất bại có lỗi rõ ràng; giữ thứ tự message/event theo conversation  
**Scale/Scope**: MVP chat gồm direct, group, membership timeline, leave/remove; chưa gồm file-sharing/search/notification nâng cao

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- `.specify/memory/constitution.md` hiện là template placeholder, chưa có nguyên tắc governance thực thi cụ thể.
- Gate result: **PASS (không có tiêu chí ràng buộc khả dụng để vi phạm)**.
- Post-design re-check: **PASS** (không phát sinh vi phạm mới theo constitution hiện tại).

## Project Structure

### Documentation (this feature)

```text
specs/003-chat-groups/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── chat-api.yaml
└── tasks.md             # tạo ở bước /speckit.tasks
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   └── chat/
│   └── main.ts
└── test/

frontend/
├── src/
│   ├── features/
│   │   ├── auth/
│   │   └── chat/
│   ├── services/
│   └── store/
└── src/test/
```

**Structure Decision**: Chọn cấu trúc web app frontend/backend hiện có, mở rộng trực tiếp trong `backend/src/modules/chat` và `frontend/src/features/chat` để tránh tạo project con mới.

## Phase 0: Outline & Research

Hoàn tất trong [research.md](./research.md):
- Chuẩn binary transport (ArrayBuffer UTF-8) và decode backend fail-fast.
- Mô hình dữ liệu conversation/message/membership-event thống nhất.
- Quy tắc quyền leave/remove ở backend.
- Cursor pagination cho lịch sử 10 tin nhắn/lần.
- Giữ vai trò adapter cho luồng kernel Linux hiện tại.

## Phase 1: Design & Contracts

### Data model
- Đã tạo: [data-model.md](./data-model.md)
- Entities chính: `Conversation`, `ConversationParticipant`, `Message`, `MembershipEvent`.

### Interface contracts
- Đã tạo: [contracts/chat-api.yaml](./contracts/chat-api.yaml)
- Bao phủ endpoints tạo hội thoại, gửi/đọc message, add/remove member, leave group, đọc membership timeline.

### Quickstart/test flow
- Đã tạo: [quickstart.md](./quickstart.md)
- Bao phủ scenario trực tiếp theo ưu tiên P1->P3 và edge case decode error.

## Phase 2 Planning Notes (for /speckit.tasks)

1. Backend chat domain
   - Thiết kế schema Mongoose cho conversation/participant/message/event.
   - Viết service cho create direct/group, add/remove/leave, list events.
2. Binary message pipeline
   - Endpoint nhận `application/octet-stream`.
   - Decode UTF-8 + map lỗi nghiệp vụ cho FE.
3. Chat history pagination
   - API trả 10 message mới nhất mặc định.
   - Cursor fetch thêm 10 message cũ hơn khi scroll-up.
4. Frontend chat UI
   - Bố cục danh sách hội thoại + khung chat + input theo pattern quen thuộc.
   - Phân biệt bubble tin nhắn của mình/người khác.
5. Integration with current backend flow
   - Sau decode/validation, forward message vào luồng xử lý đang kết nối kernel Linux.
6. Tests
   - Backend e2e: auth + membership permissions + binary decode + pagination.
   - Frontend tests: layout, history loading, error state khi decode fail.

## Complexity Tracking

Không có vi phạm cần biện minh ở thời điểm lập kế hoạch.
