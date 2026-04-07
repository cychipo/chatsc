# Tasks: Chat File Upload

**Input**: Design documents from `/specs/013-chat-file-upload/`
**Branch**: `013-chat-file-upload`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/chat-attachment-contract.md

## Phase 1: Setup

**Purpose**: Add R2 dependency and configure environment variables

- [X] T001 [P] Install `@aws-sdk/client-s3` package in `backend/package.json`
- [X] T002 Add R2 environment variables to `backend/.env.example`: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- [X] T003 [P] Add R2 environment variables to `deploy/.env.example` (VPS Docker Compose) for production deployment

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend infrastructure for file attachments — blocks all user stories

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create `ChatAttachment` schema in `backend/src/modules/chat/schemas/chat-attachment.schema.ts` with fields: `_id`, `conversationId` (ref Conversation), `messageId` (ref Message), `uploaderId` (ref User — to distinguish who sent the file), `r2Key`, `originalName`, `mimeType`, `sizeBytes`, `isImage`, `createdAt`. Add indexes: `{ conversationId: 1, createdAt: -1 }`, `{ messageId: 1 }`, `{ uploaderId: 1 }`.
- [X] T005 [P] Extend `Message` schema in `backend/src/modules/chat/schemas/message.schema.ts` with optional `attachment` embedded object: `{ attachmentId: ObjectId, fileName: string, mimeType: string, sizeBytes: number, isImage: boolean }`
- [X] T006 [P] Add `ChatAttachment` type to `frontend/src/types/chat.ts` with fields: `attachmentId`, `fileName`, `mimeType`, `sizeBytes`, `isImage`
- [X] T007 Implement `ChatAttachmentService` in `backend/src/modules/chat/chat-attachment.service.ts` with methods: `generatePresignedUploadUrl` (creates ChatAttachment record in pending state, returns presigned PUT URL via `@aws-sdk/client-s3`), `confirmAttachment` (updates ChatAttachment, creates message with attachment, emits realtime event), `generatePresignedDownloadUrl` (returns presigned GET URL for download), `listConversationAttachments` (returns paginated attachment metadata)
- [X] T008 [P] Register ChatAttachment schema in `backend/src/modules/chat/chat.module.ts` and add ChatAttachmentService to providers
- [X] T009 Add DTOs in `backend/src/modules/chat/dto/chat-attachment.dto.ts`: `GeneratePresignedUploadDto` (conversationId, fileName, mimeType, sizeBytes), `ConfirmAttachmentDto` (attachmentId)
- [X] T010 Add endpoints to `backend/src/modules/chat/chat.controller.ts`: `POST /chat/attachments/presigned-upload`, `POST /chat/conversations/:conversationId/attachments`, `GET /chat/attachments/:attachmentId/download`, `GET /chat/conversations/:conversationId/attachments`
- [X] T011 [P] Add `ChatAttachment` type to `frontend/src/types/chat.ts` extending the Message type

**Checkpoint**: Foundation ready — all four endpoints functional, ChatAttachment schema persisted, realtime delivery wired

---

## Phase 3: User Story 1 — Gửi và hiển thị ảnh trong chat (Priority: P1) 🎯 MVP

**Goal**: Người dùng chọn ảnh, upload lên R2, ảnh hiển thị inline trong luồng tin nhắn, có thể mở trình xem ảnh với zoom/download

**Independent Test**: Mở một cuộc trò chuyện, chọn file ảnh dưới 25MB, xác nhận ảnh hiển thị inline, bấm mở trình xem ảnh với đầy đủ các nút điều khiển

### Implementation for User Story 1

- [X] T012 [P] [US1] Create `FileCard` component in `frontend/src/features/chat/components/file-card.tsx` with file icon (based on mimeType), file name, file size, and download button
- [X] T013 [P] [US1] Extend `ChatComposer` in `frontend/src/features/chat/components/chat-composer.tsx` to add attachment button (paper clip icon from Lucide), handle file selection with validation (size <= 25MB, no folders, show clear error messages), call presigned upload API, PUT to R2, confirm attachment, emit message via realtime
- [X] T014 [US1] Add `ChatAttachmentService` client in `frontend/src/services/chat-attachment.service.ts` with methods: `getPresignedUploadUrl`, `confirmAttachment`, `getPresignedDownloadUrl`
- [X] T015 [US1] Extend `MessageBubble` in `frontend/src/features/chat/components/message-bubble.tsx` to render inline image preview when `message.attachment?.isImage === true` using AntD `Image` component with `preview` disabled (custom viewer instead)
- [X] T016 [US1] Implement `ImageViewer` component in `frontend/src/features/chat/components/image-viewer.tsx` using AntD `Image` component with custom toolbar showing zoom-in, zoom-out, reset, and download icons. Controls: zoom in (scale += 0.25, max 3.0), zoom out (scale -= 0.25, min 0.5), reset (scale = 1.0), download (call download endpoint). Close on Escape key and backdrop click.
- [X] T017 [US1] Integrate `ImageViewer` into `ChatPage` in `frontend/src/features/chat/chat.page.tsx` — manage viewer state (isOpen, currentAttachmentId, currentPresignedUrl, scale). Pass `onAttachmentClick` callback to `MessageBubble`.

**Checkpoint**: US1 complete — user can upload image, see inline preview, open image viewer with zoom/download controls, and close viewer

---

## Phase 4: User Story 2 — Gửi file không phải ảnh (Priority: P2)

**Goal**: Người dùng chọn file không phải ảnh, upload lên R2, card file hiển thị trong luồng tin nhắn với nút tải về

**Independent Test**: Mở một cuộc trò chuyện, chọn file không phải ảnh dưới 25MB, xác nhận card file hiển thị đúng, bấm tải về thành công

### Implementation for User Story 2

- [X] T018 [P] [US2] Extend `MessageBubble` to render `FileCard` when `message.attachment?.isImage === false` — pass all attachment fields and `onDownload` callback
- [X] T019 [US2] Add download handler to `FileCard` component — on download button click, call `getPresignedDownloadUrl`, then trigger browser download via created anchor element or fetch+blob

**Checkpoint**: US2 complete — user can upload non-image files, see file card in chat, and download the file

---

## Phase 5: User Story 3 — Tải về các file đã chia sẻ (Priority: P3)

**Goal**: Người dùng có thể tải về bất kỳ file đã chia sẻ nào trong cuộc trò chuyện

**Independent Test**: Mở cuộc trò chuyện đã có tin nhắn chứa file, bấm tải về trên card file hoặc trong trình xem ảnh, xác nhận file được lưu

### Implementation for User Story 3

- [X] T020 [P] [US3] Backend: ensure `GET /chat/attachments/:attachmentId/download` endpoint validates requester is an active participant of the conversation that owns the attachment (reject with 403 otherwise)
- [X] T021 [P] [US3] Backend: ensure `GET /chat/conversations/:conversationId/attachments` endpoint returns full attachment metadata including `uploaderId` so frontend can display who uploaded each file
- [X] T022 [US3] Frontend: wire up `FileCard` download button to call `getPresignedDownloadUrl` and trigger browser download (already done in T019)
- [X] T023 [US3] Frontend: wire up `ImageViewer` download button to call `getPresignedDownloadUrl` and trigger browser download (already done in T016)

**Checkpoint**: US3 complete — all shared files are downloadable by conversation participants

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, cleanup, and final checks across all user stories

- [X] T024 [P] Frontend validation tests: verify size limit (file > 25MB rejected with clear error before upload starts), folder selection rejected with clear error, image vs non-image renders correctly
- [X] T025 [P] Backend: verify presigned URL generation works with valid R2 credentials, returns correct expiry (15 minutes)
- [X] T026 [P] Backend: write unit test for `ChatAttachmentService` covering presigned URL generation, attachment confirmation with message creation, download URL generation, and participant authorization checks
- [ ] T027 [P] Backend: write e2e test for attachment flow: generate presigned URL → upload to R2 → confirm attachment → message delivered via realtime → download attachment
- [ ] T028 Run quickstart.md validation scenarios: image upload/display, non-image file card, size limit error, folder rejection, re-download
- [X] T029 [P] Run workspace build: `yarn workspace @chatsc/backend build` and `yarn workspace @chatsc/frontend build` — verify no TypeScript errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001) — **BLOCKS all user stories**
- **User Stories (Phase 3+)**: All depend on Foundational phase complete
  - US1 (P1) → US2 (P2) → US3 (P3) proceed sequentially (each builds on previous)
  - Or US2/US3 can start once US1's frontend wiring is done
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational — no dependencies on other stories
- **US2 (P2)**: Depends on US1 frontend wiring (T013 — ChatComposer handles file selection) but FileCard (T012) and MessageBubble extension (T018) are independent
- **US3 (P3)**: Depends on US1 + US2 for full download wiring; backend authorization (T020, T021) can start after Foundational

### Within Each User Story

- Schema/models before services
- Services before endpoints
- Backend before frontend integration
- Core implementation before polish

### Parallel Opportunities

- T001 + T002 + T003: Setup tasks run in parallel
- T004 + T005 + T006: Foundational schema/type tasks run in parallel
- T008 + T011: Module registration and frontend type extension run in parallel
- T012 + T013: FileCard and ChatComposer extension run in parallel (different files)
- T015 + T016 + T017: MessageBubble inline image, ImageViewer, and ChatPage integration run in parallel
- T018 + T019: FileCard integration and download handler run in parallel
- T020 + T021: Backend authorization tasks run in parallel
- T024 + T025: Validation tests run in parallel
- T026 + T027: Backend unit test and e2e test run in parallel

---

## Parallel Example

```bash
# Setup phase — all three tasks in parallel:
Task: T001 — Install @aws-sdk/client-s3 in backend/package.json
Task: T002 — Add R2 env vars to backend/.env.example
Task: T003 — Add R2 env vars to deploy/.env.example

# Foundational phase — schema and types in parallel:
Task: T004 — Create ChatAttachment schema
Task: T005 — Extend Message schema with attachment field
Task: T006 — Add ChatAttachment type to frontend types

# US1 frontend — components in parallel:
Task: T012 — Create FileCard component
Task: T013 — Extend ChatComposer with attachment button
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (R2 dependency + env vars)
2. Complete Phase 2: Foundational (schema, service, endpoints)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test image upload → inline display → image viewer with zoom/download
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Deploy/Demo (MVP!)
3. Add US2 → Test independently → Deploy/Demo
4. Add US3 → Test independently → Deploy/Demo
5. Polish → Final validation → Release

---

## Notes

- **[P]** tasks = different files, no dependencies, can run in parallel
- **[US1/US2/US3]** label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Each ChatAttachment has `uploaderId` (who sent the file) and `messageId` (which message it belongs to) to distinguish ownership
- R2 env vars must be set in both `backend/.env` (dev) and `deploy/.env` (production) for uploads to work
