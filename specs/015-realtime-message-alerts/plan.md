# Implementation Plan: Realtime message alerts

**Branch**: `015-realtime-message-alerts` | **Date**: 2026-04-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-realtime-message-alerts/spec.md`

**Note**: This plan covers Phase 0 research and Phase 1 design artifacts for realtime in-session notifications and browser tab title updates for unread chat activity.

## Summary

Thêm thông báo realtime trong phiên chat khi người dùng nhận tin nhắn mới, đồng thời cập nhật title của tab theo tổng số tin nhắn chưa đọc và số lượng người gửi đang tạo unread. Giải pháp tận dụng luồng Socket.IO và unread state đã có: backend tiếp tục phát `message_delivered` và `conversation_preview_updated`, frontend bổ sung lớp tổng hợp unread/toast/tab-title từ state conversation hiện có thay vì tạo storage hoặc giao thức mới.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + backend)  
**Primary Dependencies**: NestJS 10, Mongoose 8, React 18, Vite 6, Zustand 5, Socket.IO, Ant Design 5  
**Storage**: MongoDB cho conversation/message/participant unread state; browser runtime state cho notification và tab title  
**Testing**: Vitest, React Testing Library, backend test stack hiện có cho service/gateway behaviors  
**Target Platform**: Ứng dụng web với backend NestJS và frontend React chạy trên trình duyệt desktop  
**Project Type**: Web application  
**Performance Goals**: Thông báo trong phiên và title tab phản ánh thay đổi unread gần realtime; cập nhật hiển thị trong vòng 2 giây theo spec  
**Constraints**: Không thêm kênh notification ngoài trình duyệt; phải bám vào unread count thực tế; không yêu cầu refresh trang; không làm sai trạng thái khi nhiều message đến gần nhau  
**Scale/Scope**: Một tính năng chat hiện có, tác động chủ yếu đến luồng socket chat, unread aggregation, và UI chat page

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` hiện vẫn là template placeholder, chưa chứa nguyên tắc hay cổng kiểm tra có thể thực thi.

- Gate 1: Không có nguyên tắc bắt buộc cụ thể để đánh giá -> PASS by default
- Gate 2: Không có ràng buộc kiến trúc/kiểm thử cụ thể trong constitution -> PASS by default
- Gate 3: Kế hoạch vẫn tuân theo chỉ dẫn repo hiện có: thay đổi tối thiểu, tái sử dụng socket/unread state sẵn có -> PASS

**Post-Design Re-check**: PASS. Thiết kế không thêm storage mới, không thêm abstraction dư thừa, và giữ nguyên contract realtime chính hiện có.

## Project Structure

### Documentation (this feature)

```text
specs/015-realtime-message-alerts/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── realtime-notifications.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   └── modules/
│       └── chat/
│           ├── chat.gateway.ts
│           ├── chat.service.ts
│           └── schemas/
│               └── conversation-participant.schema.ts
└── tests/

frontend/
├── src/
│   ├── app/
│   │   └── providers.tsx
│   ├── features/
│   │   └── chat/
│   │       └── chat.page.tsx
│   ├── services/
│   │   ├── chat-socket.service.ts
│   │   └── chat.service.ts
│   └── types/
│       └── chat.ts
└── tests/
```

**Structure Decision**: Giữ cấu trúc web app hiện tại. Backend chat module tiếp tục là nguồn unread state và realtime events; frontend chat page là nơi tổng hợp unread/title/toast vì state conversation và socket subscriptions đã tập trung ở đây.

## Phase 0: Research Summary

1. Reuse `conversation_preview_updated` as the authoritative unread update stream for each user room.
2. Keep `message_delivered` for message body delivery and sender presentation data.
3. Derive single-sender vs multi-sender tab-title state on the frontend from conversation list metadata instead of persisting a new aggregate model.
4. Add a lightweight frontend notification coordinator so duplicate socket events do not create duplicate visible alerts.

## Phase 1: Design Plan

### Backend design

- Keep current room model in [backend/src/modules/chat/chat.gateway.ts](../../backend/src/modules/chat/chat.gateway.ts).
- Continue emitting `message_delivered` to user rooms for realtime arrival.
- Continue emitting `conversation_preview_updated` after send/read so frontend receives authoritative unreadCount changes per conversation.
- Extend preview payload only if needed to expose enough sender context for direct conversations and generic conversations; prefer reusing existing `displayTitle`, `directPeer`, and `unreadCount` data already returned by conversation APIs before adding new fields.
- Preserve `markConversationRead()` behavior in [backend/src/modules/chat/chat.service.ts](../../backend/src/modules/chat/chat.service.ts) as the source of resetting unread count to zero.

### Frontend design

- Add a notification/title coordinator inside [frontend/src/features/chat/chat.page.tsx](../../frontend/src/features/chat/chat.page.tsx), because this file already owns:
  - socket subscriptions,
  - conversation list state,
  - mark-as-read flow,
  - selected conversation awareness.
- Compute aggregate unread state from `state.conversations`:
  - total unread messages,
  - unread conversations,
  - distinct senders represented by unread conversations,
  - single sender display name fallback chain.
- Show in-session notification only for inbound messages from another user and only when the conversation is not currently being read in a way that would make the alert misleading.
- Update `document.title` reactively whenever conversation unread state changes and restore the default title on cleanup or when total unread returns to zero.
- Keep socket service contract stable unless a dedicated notification event is proven necessary.

### Testing design

- Frontend tests cover tab-title transitions:
  - zero unread -> default title,
  - one sender with n unread -> sender-specific title,
  - multiple senders -> generic unread title,
  - reading messages -> title reverts correctly.
- Frontend tests cover in-session notification behavior for inbound socket messages.
- Backend tests cover payload completeness only if new preview fields/events are added.

## Complexity Tracking

No constitution violations or exceptional complexity require justification.