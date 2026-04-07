# Implementation Plan: Chat File Upload

**Branch**: `013-chat-file-upload` | **Date**: 2026-04-08 | **Spec**: [/Users/tgiap.dev/devs/chatsc/specs/013-chat-file-upload/spec.md](/Users/tgiap.dev/devs/chatsc/specs/013-chat-file-upload/spec.md)
**Input**: Đặc tả tính năng Gửi file trong chat từ `/specs/013-chat-file-upload/spec.md`

## Summary

Cho phép người dùng chat gửi và nhận file trong cuộc trò chuyện. Người dùng chọn file (tối đa 25MB), file được upload lên Cloudflare R2, và nội dung được hiển thị trong luồng tin nhắn — ảnh hiển thị inline với trình xem ảnh kèm zoom/download, file khác hiển thị dưới dạng card kèm nút tải về. Backend phát sinh presigned URL cho phép client upload trực tiếp lên R2 mà không cần proxy qua backend. Siêu dữ liệu file được lưu trong MongoDB.

## Technical Context

**Language/Version**: TypeScript 5.x cho frontend và backend
**Primary Dependencies**: NestJS 10, Mongoose 8, React 18, Vite 6, Zustand 5, Axios 1.12, Ant Design 5, @aws-sdk/client-s3 (R2/S3-compatible), Vitest, React Testing Library
**Storage**: MongoDB cho file attachment metadata; Cloudflare R2 cho file binary; browser runtime state cho image viewer
**Testing**: Frontend dùng Vitest + React Testing Library trong `frontend/src/test`; backend dùng Jest e2e config trong `backend/test`; build validation qua workspace scripts
**Target Platform**: Web application với backend NestJS và frontend React/Vite
**Project Type**: Web application
**Performance Goals**: Upload file 25MB hoàn thành trong thời gian hợp lý (< 30s) mà không block UI; presigned URL phát sinh trong < 200ms
**Constraints**: Chỉ active participants mới được upload/view file; folder bị từ chối; file > 25MB bị từ chối trước khi upload; R2 credentials cần thêm vào env trước deploy; file không qua backend proxy (upload trực tiếp từ browser lên R2 qua presigned URL)
**Scale/Scope**: Một module backend mới cho chat attachment, một schema MongoDB, mở rộng chat service hiện có, component frontend mới trong chat composer và message bubble, image viewer dùng AntD Image

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution tại `.specify/memory/constitution.md` hiện vẫn là placeholder, không có nguyên tắc cụ thể bị vi phạm.
- Kế hoạch bám vào tech stack hiện có (NestJS, React, MongoDB) và mở rộng chat module hiện có.
- Không có subsystem mới ngoài phạm vi cần biện minh.

## Phase 0: Research

### Kết luận nghiên cứu

1. **Upload strategy**: Backend phát sinh presigned URL từ AWS SDK v3 (`@aws-sdk/client-s3`) với `PutObjectCommand`. Client upload trực tiếp lên R2 qua presigned URL — không cần backend proxy file. Presigned URL hết hạn sau 15 phút.
2. **Download strategy**: Backend phát sinh presigned URL cho GET (`GetObjectCommand`) để người dùng tải về. URL có thể serve qua endpoint download hoặc redirect trực tiếp tới R2 URL.
3. **R2 as S3-compatible**: R2 hỗ trợ S3-compatible API. Cấu hình cần `endpoint`, `region` (đặt là `auto`), `credentials`, và `bucket` name. Không cần thêm dependency khác — `@aws-sdk/client-s3` là đủ.
4. **MongoDB metadata**: Lưu trữ attachment metadata (R2 key, tên file gốc, MIME type, kích thước, uploader, conversation, messageId) trong MongoDB collection `chat_attachments`.
5. **Message schema**: Mở rộng message payload để chứa attachment reference — không lưu file content trong message.
6. **Image type detection**: Dùng MIME type từ frontend upload để phân biệt ảnh (image/*) vs file thường. MIME type cũng dùng làm Content-Type khi upload lên R2.
7. **Upload cancellation**: Sử dụng AbortController trên frontend để cancel upload nếu user rời trang.

## Phase 1: Design & Contracts

### Backend design

- Thêm `@aws-sdk/client-s3` vào `backend/package.json` để giao tiếp R2 qua S3-compatible API.
- Thêm `ChatAttachmentService` trong `backend/src/modules/chat/chat-attachment.service.ts` xử lý phát sinh presigned URL upload và download, lưu metadata vào MongoDB.
- Thêm `ChatAttachment` schema trong `backend/src/modules/chat/schemas/chat-attachment.schema.ts` để lưu trữ file metadata.
- Thêm endpoint `POST /chat/attachments/presigned-upload` trả về presigned PUT URL và R2 key.
- Thêm endpoint `GET /chat/attachments/:attachmentId/download` trả về presigned GET URL hoặc redirect tới R2.
- Thêm endpoint `GET /chat/conversations/:conversationId/attachments` để lấy danh sách attachment metadata của một conversation (hỗ trợ history).
- Thêm endpoint `POST /chat/conversations/:conversationId/attachments` để lưu attachment metadata sau khi upload hoàn tất vào message.
- Mở rộng `ChatMessagePayload` để chứa `attachment?: { attachmentId, fileName, mimeType, size, r2Key, isImage }`.
- Thêm R2 env keys vào `backend/.env.example`.

### Frontend design

- Thêm `ChatAttachment` type vào `frontend/src/types/chat.ts`.
- Mở rộng `ChatComposer` thêm nút gửi file (icon đính kèm) và xử lý chọn file với validation (size, folder).
- Thêm `ChatAttachmentService` client trong `frontend/src/services/chat-attachment.service.ts` gọi presigned URL API và thực hiện upload qua Axios với `AbortController`.
- Tạo `FileCard` component trong `frontend/src/features/chat/components/file-card.tsx` hiển thị card file với icon, tên, kích thước, và nút tải về.
- Mở rộng `MessageBubble` hoặc tạo `FileAttachmentBubble` component để render ảnh inline (dùng AntD Image) hoặc file card trong luồng tin nhắn.
- Sử dụng AntD `Image` component cho trình xem ảnh với các nút zoom-in, zoom-out, reset, download.
- Thêm `uploadFile(conversationId, file)` helper trong `ChatComposer` để request presigned URL, upload lên R2, và gửi message với attachment metadata.

### Contracts created

- `contracts/chat-attachment-contract.md`: xác định request/response cho presigned upload URL, presigned download URL, attachment metadata payload, và message-with-attachment shape.

### Data model created

- `data-model.md`: mô tả ChatAttachment entity (R2 key, metadata), mở rộng Message entity, FileAttachmentPayload, và trạng thái upload.

### Quickstart created

- `quickstart.md`: xác minh upload ảnh, upload file, image viewer controls, file card download, size limit error.

## Post-Design Constitution Check

- Constitution vẫn là placeholder nên không có gate cụ thể bị vi phạm sau Phase 1.
- Thiết kế bám vào NestJS + MongoDB + React + AntD hiện có, mở rộng chat module không thêm subsystem mới.
- Không có mục nào cần ghi vào Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/013-chat-file-upload/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── chat-attachment-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/
│   │   └── env.config.ts
│   └── modules/
│       ├── auth/
│       │   ├── auth.controller.ts
│       │   └── auth.service.ts
│       └── chat/
│           ├── chat-attachment.service.ts
│           ├── chat.controller.ts
│           ├── chat.service.ts
│           ├── dto/
│           │   └── chat.dto.ts
│           └── schemas/
│               ├── chat-attachment.schema.ts
│               └── message.schema.ts
└── test/

frontend/
├── src/
│   ├── features/
│   │   └── chat/
│   │       ├── chat.page.tsx
│   │       └── components/
│   │           ├── chat-composer.tsx
│   │           ├── file-card.tsx
│   │           └── message-bubble.tsx
│   └── services/
│       └── chat-attachment.service.ts
│   └── types/
│       └── chat.ts
│   └── test/
└── tests/
```

**Structure Decision**: Thêm file mới trong chat module backend (`chat-attachment.service.ts`, `chat-attachment.schema.ts`) và frontend (`file-card.tsx`, `chat-attachment.service.ts`). Mở rộng `chat.dto.ts`, `chat.controller.ts`, `message.schema.ts` và `message-bubble.tsx`, `chat-composer.tsx` hiện có. Không cần tạo module mới vì attachment là phần mở rộng của chat.

## Complexity Tracking

Không có mục nào cần biện minh ở thời điểm lập plan này.
