# Implementation Plan: Mã hoá ngược qua nhân Linux từ xa

**Branch**: `008-reverse-kernel-encryption` | **Date**: 2026-04-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-reverse-kernel-encryption/spec.md`

## Summary

Bổ sung luồng xử lý nội dung tin nhắn tại backend để mọi tin nhắn mới được mã hoá ngược thông qua dịch vụ xử lý từ xa chạy trên Linux trước khi lưu, sau đó khôi phục nội dung trước khi trả về qua REST, preview hội thoại và socket realtime. Thiết kế cũng cần bổ sung metadata nhận diện trạng thái xử lý cho dữ liệu tin nhắn và cập nhật tệp cấu hình mẫu để đội vận hành có thể bật feature bằng biến môi trường rõ ràng.

## Technical Context

**Language/Version**: TypeScript 5.x cho backend và frontend; C/GCC cho dịch vụ xử lý từ xa hiện có  
**Primary Dependencies**: NestJS 10, Mongoose 8, React 18, Zustand 5, Axios 1.12, Socket.IO, dịch vụ xử lý từ xa qua TCP đã có sẵn  
**Storage**: MongoDB cho conversation/message persistence  
**Testing**: Bộ test hiện có của backend/frontend và kiểm thử tích hợp thủ công theo quickstart  
**Target Platform**: Backend Node.js trên Linux/macOS dev, frontend web React, dịch vụ xử lý từ xa chạy trên VPS Linux  
**Project Type**: Web application với backend API + frontend SPA + dịch vụ xử lý từ xa hỗ trợ  
**Performance Goals**: Gửi và đọc tin nhắn vẫn phải đủ nhanh để trải nghiệm chat không bị gián đoạn rõ rệt; preview và realtime phải giữ đồng nhất với lịch sử hội thoại  
**Constraints**: Không được fallback thầm lặng sang lưu plaintext; không được trả ciphertext trực tiếp cho FE trong luồng hiển thị thường; phải phân biệt được dữ liệu cũ và dữ liệu mới  
**Scale/Scope**: Áp dụng cho luồng gửi tin nhắn mới, đọc lịch sử, preview hội thoại, event realtime và tệp cấu hình mẫu của backend/frontend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Tệp constitution hiện là mẫu placeholder, chưa định nghĩa nguyên tắc ràng buộc cụ thể để áp gate tự động.
- Không phát hiện mâu thuẫn hiển nhiên giữa feature này và hướng dẫn hiện có trong repo.
- Thiết kế được giữ ở mức tối giản: tái sử dụng module chat hiện tại, không thêm service ngoài phạm vi cần thiết, không thay đổi quyền truy cập nghiệp vụ.
- Re-check sau Phase 1: pass, vì dữ liệu, contracts và quickstart đều bám theo luồng chat hiện tại và không mở rộng phạm vi ngoài spec.

## Project Structure

### Documentation (this feature)

```text
specs/008-reverse-kernel-encryption/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── chat-reverse-encryption-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/
│   │   └── env.config.ts
│   └── modules/
│       └── chat/
│           ├── chat.controller.ts
│           ├── chat.gateway.ts
│           ├── chat.service.ts
│           ├── dto/
│           ├── schemas/
│           │   └── message.schema.ts
│           └── utils/
└── .env.example

frontend/
├── src/
│   ├── services/
│   │   └── chat.service.ts
│   ├── types/
│   │   └── chat.ts
│   └── features/chat/
└── .env.example

app/
├── client/
└── processor/
```

**Structure Decision**: Giữ nguyên cấu trúc web application hiện có. Thay đổi tập trung ở `backend/src/modules/chat/`, `backend/src/config/env.config.ts`, schema tin nhắn, và các tệp `.env.example`; frontend chỉ cập nhật nếu cần thêm cờ công khai hoặc kiểu dữ liệu hiển thị liên quan.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Thêm metadata trạng thái xử lý vào bản ghi tin nhắn | Cần phân biệt dữ liệu cũ và dữ liệu mới đã mã hoá ngược | Chỉ suy luận từ chuỗi nội dung không đáng tin cậy và dễ áp sai quy tắc khôi phục |
