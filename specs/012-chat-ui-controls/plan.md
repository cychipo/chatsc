# Implementation Plan: Chat UI Controls

**Branch**: `012-chat-ui-controls` | **Date**: 2026-04-07 | **Spec**: [/Users/tgiap.dev/devs/chatsc/specs/012-chat-ui-controls/spec.md](/Users/tgiap.dev/devs/chatsc/specs/012-chat-ui-controls/spec.md)
**Input**: Feature specification from `/specs/012-chat-ui-controls/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Enhance the existing chat screen so the header controls become functional: the menu button collapses/expands the conversation sidebar, the search button opens a popup to search messages inside the active conversation, and message bubbles show real user avatars or a default avatar placeholder instead of a generic icon.

## Technical Context

**Language/Version**: TypeScript 5.x cho frontend và backend  
**Primary Dependencies**: NestJS 10, Mongoose 8, React 18, Vite 6, Zustand 5, Axios 1.12, Ant Design 5, Lucide React, Vitest, React Testing Library  
**Storage**: MongoDB cho conversation/message persistence; browser runtime state cho sidebar toggle và search popup  
**Testing**: Frontend dùng Vitest + React Testing Library trong `frontend/src/test`; backend dùng Jest e2e config hiện có trong `backend/test`; build validation qua workspace scripts  
**Target Platform**: Web application với backend NestJS và frontend React/Vite  
**Project Type**: Web application  
**Performance Goals**: Sidebar toggle phản hồi tức thì; search popup trả kết quả đủ nhanh cho trải nghiệm chat thông thường; avatar rendering không làm hỏng khả năng đọc thread hiện có  
**Constraints**: Chỉ search trong conversation đang mở; không làm mất selected conversation hoặc thread state khi toggle sidebar; không thêm complexity ngoài chat module và chat page hiện có; phải có fallback avatar khi thiếu ảnh đại diện  
**Scale/Scope**: Một màn hình chat frontend, một component message bubble, contract message payload hiện có, và bổ sung tối thiểu một endpoint tìm kiếm message theo conversation trong chat module

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file tại `.specify/memory/constitution.md` hiện vẫn là placeholder, chưa định nghĩa nguyên tắc hoặc gate cụ thể có thể chặn feature này.
- Kế hoạch bám vào chat module và chat page hiện có, không yêu cầu subsystem mới hay workflow đặc biệt.
- Có thể tiếp tục Phase 0 vì không có vi phạm hiến pháp cụ thể cần biện minh.

## Project Structure

### Documentation (this feature)

```text
specs/012-chat-ui-controls/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── chat-ui-controls-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   └── modules/
│       ├── auth/
│       │   ├── auth.controller.ts
│       │   └── auth.service.ts
│       └── chat/
│           ├── chat.controller.ts
│           ├── chat.service.ts
│           ├── dto/
│           │   └── chat.dto.ts
│           └── schemas/
│               └── message.schema.ts
└── test/

frontend/
├── src/
│   ├── features/
│   │   └── chat/
│   │       ├── chat.page.tsx
│   │       └── components/
│   │           ├── conversation-list.tsx
│   │           └── message-bubble.tsx
│   ├── services/
│   │   └── chat.service.ts
│   ├── types/
│   │   ├── auth.ts
│   │   └── chat.ts
│   └── test/
│       ├── chat-layout.test.tsx
│       ├── chat-bubble-variant.test.tsx
│       └── chat-direct-thread.test.tsx
```

**Structure Decision**: Giữ toàn bộ thay đổi trong feature chat frontend hiện có và chat module backend hiện có. Sidebar toggle là state cục bộ ở `chat.page.tsx`; message search đi qua chat controller/service; avatar rendering mở rộng contract message payload và `message-bubble.tsx` để không cần thêm module mới.

## Phase 0: Research

### Kết luận nghiên cứu
1. Sidebar toggle nên là local UI state trong chat page vì đây là thay đổi trình bày thuần frontend.
2. Message search nên dùng endpoint HTTP mới theo conversation và mở trong modal từ nút search hiện có.
3. Backend có thể tái sử dụng pattern escaped regex search từ auth user search để triển khai tìm kiếm nội dung message an toàn trong phạm vi feature này.
4. Avatar hiển thị trong message thread nên tái sử dụng nguồn dữ liệu avatar/fallback đang có ở conversation summary thay vì giữ icon generic.
5. Message payload cần được mở rộng với sender presentation metadata tối thiểu để bubble và search result render đúng trong direct lẫn group chat.
6. Tự động hóa nên tập trung vào frontend interaction tests cho toggle, popup, empty state và avatar rendering; backend thay đổi chủ yếu là contract và route bổ sung.

## Phase 1: Design & Contracts

### Backend design
- Mở rộng `ChatMessagePayload` và logic `toDisplayMessage()`/`getMessages()` để trả thêm sender presentation metadata cần cho avatar rendering và search result display.
- Thêm DTO query cho message search trong `backend/src/modules/chat/dto/chat.dto.ts`.
- Thêm endpoint conversation-scoped search vào `backend/src/modules/chat/chat.controller.ts`, bảo vệ bằng cùng participant checks như luồng message hiện tại.
- Thêm service method tìm kiếm message trong `backend/src/modules/chat/chat.service.ts`, escape query theo pattern hiện có của auth search và giới hạn result size hợp lý.
- Chỉ cân nhắc index tìm kiếm nếu implementation cho thấy cần thiết; không coi là bắt buộc trong plan này.

### Frontend design
- Thêm state `isSidebarCollapsed` vào `frontend/src/features/chat/chat.page.tsx` và cập nhật layout grid / sidebar rendering khi menu button được bấm.
- Gắn handler cho search button trong header và thêm modal search trong `chat.page.tsx`, tái sử dụng pattern modal + loading + empty state hiện có của “New Chat”.
- Thêm API client `searchMessages(conversationId, query)` trong `frontend/src/services/chat.service.ts`.
- Mở rộng types trong `frontend/src/types/chat.ts` để biểu diễn sender avatar/display fields và search result shape nếu cần tách riêng.
- Cập nhật `frontend/src/features/chat/components/message-bubble.tsx` để render avatar ảnh thật hoặc fallback avatar placeholder thay cho icon generic.
- Giữ `frontend/src/features/chat/components/conversation-list.tsx` làm nguồn tham chiếu cho avatar fallback styling nhằm đảm bảo UI đồng nhất.

### Contracts created
- `contracts/chat-ui-controls-contract.md`: xác định contract cho sidebar toggle behavior, conversation-scoped message search request/response, avatar rendering data, và search popup interaction.

### Data model created
- `data-model.md`: mô tả conversation view state, message search query/result, sender presentation metadata, và chat message payload mở rộng.

### Quickstart created
- `quickstart.md`: xác minh toggle sidebar, search popup trong active conversation, empty state, và avatar rendering với image/fallback.

## Post-Design Constitution Check

- Constitution vẫn là placeholder nên không có gate cụ thể bị vi phạm sau Phase 1.
- Thiết kế vẫn giữ thay đổi trong chat frontend/backend hiện có và không mở thêm subsystem ngoài phạm vi.
- Không có mục nào cần ghi vào Complexity Tracking.

## Complexity Tracking

Không có mục nào cần biện minh ở thời điểm lập plan này.