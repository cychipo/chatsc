# Implementation Plan: Trạng thái gửi/xem và hiện diện chat

**Branch**: `010-message-presence-status` | **Date**: 2026-04-06 | **Spec**: [/Users/tgiap.dev/devs/chatsc/specs/010-message-presence-status/spec.md](/Users/tgiap.dev/devs/chatsc/specs/010-message-presence-status/spec.md)
**Input**: Feature specification from `/specs/010-message-presence-status/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Mở rộng chat trực tiếp hiện có để người nhận thấy tin nhắn mới ngay lập tức, conversation có hoạt động mới luôn nhảy lên đầu danh sách, direct chat có thể hiện lại khi người nhận đã xoá/left trước đó, đồng thời bổ sung unread count, trạng thái `đã gửi`/`đã xem` cho cụm tin outbound gần nhất và typing indicator realtime giống các ứng dụng chat phổ biến.

## Technical Context

**Language/Version**: TypeScript 5.x cho frontend và backend  
**Primary Dependencies**: NestJS 10, Mongoose 8, Socket.IO, React 18, Zustand 5, Axios 1.12, Ant Design 5  
**Storage**: MongoDB cho conversation/participant/message; trạng thái tạm thời typing qua realtime layer; browser runtime state cho chat UI  
**Testing**: Build validation hiện có cho frontend/backend; kiểm thử tích hợp thủ công với hai tài khoản theo quickstart; có thể mở rộng test chat service/UI nếu cần trong implementation  
**Target Platform**: Web application với backend NestJS và frontend React/Vite  
**Project Type**: Web application  
**Performance Goals**: Tin nhắn mới, unread badge, seen status và typing indicator được phản ánh trong trải nghiệm realtime thông thường mà không cần reload; danh sách chat vẫn ổn định khi nhiều event đến liên tiếp  
**Constraints**: Không tạo direct conversation trùng nhau; không đánh dấu đã đọc chỉ vì user online nhưng chưa mở conversation; chỉ participant hợp lệ mới thấy unread/seen/typing state; không làm hỏng luồng reverse encryption và realtime chat hiện có  
**Scale/Scope**: Một module chat backend, một gateway realtime, một màn hình chat frontend, contract conversation summary/message realtime được mở rộng chủ yếu cho direct chat 1-1

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file hiện vẫn là placeholder, chưa có nguyên tắc cưỡng bức cụ thể để chặn thiết kế này.
- Không có gate thực tế nào được định nghĩa để buộc thay đổi workflow so với feature chat hiện có.
- Re-check sau Phase 1: thiết kế vẫn bám vào module chat/gateway hiện có, không phát sinh subsystem mới không cần thiết.

## Project Structure

### Documentation (this feature)

```text
specs/010-message-presence-status/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── message-presence-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   └── modules/
│       ├── auth/
│       └── chat/
│           ├── chat.controller.ts
│           ├── chat.gateway.ts
│           ├── chat.module.ts
│           ├── chat.service.ts
│           ├── dto/
│           ├── schemas/
│           │   ├── conversation.schema.ts
│           │   ├── conversation-participant.schema.ts
│           │   └── message.schema.ts
│           └── utils/
└── test/

frontend/
├── src/
│   ├── features/
│   │   └── chat/
│   │       ├── chat.page.tsx
│   │       └── components/
│   │           ├── conversation-list.tsx
│   │           ├── chat-composer.tsx
│   │           └── message-bubble.tsx
│   ├── services/
│   │   ├── chat.service.ts
│   │   └── chat-socket.service.ts
│   ├── store/
│   └── types/
│       └── chat.ts
└── test/
```

**Structure Decision**: Giữ toàn bộ thay đổi trong module chat hiện có của backend và feature chat hiện có của frontend. Trọng tâm là mở rộng schema participant/message, contract conversation summary/realtime payload, và các component sidebar/thread để render unread, seen và typing.

## Phase 0: Research

### Kết luận nghiên cứu
1. Reuse `conversation_preview_updated` làm tín hiệu chính để sắp xếp lại danh sách chat và đẩy metadata unread mới nhất.
2. Với direct chat, ưu tiên khôi phục participant đã `left` thay vì tạo conversation mới để tránh trùng 1-1 thread.
3. Theo dõi unread/read state ở cấp participant theo conversation để vừa tính unread count vừa suy ra `seen` cho cụm outbound gần nhất.
4. Đánh dấu đã đọc khi user thực sự mở conversation thông qua luồng `selectConversation()`, không chỉ vì socket đang online.
5. Hiển thị label `đã gửi`/`đã xem` cho cụm outbound gần nhất thay vì mọi bubble.
6. Typing indicator là tín hiệu realtime tạm thời theo conversation, không cần lưu bền như message.
7. Mở rộng contract conversation summary và preview payload thay vì tạo danh sách chat API mới.

## Phase 1: Design & Contracts

### Backend design
- Mở rộng `ConversationParticipant` để giữ metadata đọc/chưa đọc cho từng user trong từng conversation direct.
- Mở rộng `ChatService` để:
  - khôi phục direct participant khi có message mới đến người đã `left`,
  - cập nhật unread count và read marker,
  - build conversation summary có unread metadata,
  - suy ra seen status cho outbound message group gần nhất.
- Mở rộng `ChatGateway` với các sự kiện/payload mới cho:
  - preview update có unread metadata,
  - message delivery có status metadata cần thiết,
  - typing presence realtime,
  - read-state synchronization nếu cần phát lại cho phía còn lại.
- Mở rộng `ChatController`/contract HTTP để hỗ trợ đánh dấu conversation là đã đọc khi user mở thread.

### Frontend design
- Mở rộng `Conversation` type và `ConversationList` để hiển thị unread badge và sắp xếp lại dựa trên preview update mới.
- Mở rộng `ChatPage` để:
  - khi mở conversation thì đồng bộ read state,
  - cập nhật state local khi preview/message event tới,
  - hiển thị typing indicator trong header hoặc vùng thread,
  - render sent/seen text muted cho bubble/cụm bubble outbound phù hợp.
- Mở rộng `chat-socket.service.ts` để lắng nghe/phát typing event và các event seen/read cần thiết.
- Giữ cơ chế mapping message hiện có, chỉ bổ sung metadata status thay vì thay toàn bộ cấu trúc thread.

### Contracts created
- `contracts/message-presence-contract.md`: xác định contract cho conversation summary, realtime message delivery, preview update, mark-as-read, sent/seen status và typing presence.

### Data model created
- `data-model.md`: mô tả direct conversation presence, participant read state/unread counter, delivery status group và typing presence.

### Quickstart created
- `quickstart.md`: xác minh realtime delivery, auto restore direct conversation, unread count, mark as read, sent/seen status và typing indicator.

## Post-Design Constitution Check

- Constitution vẫn là placeholder nên không có rule cụ thể bị vi phạm.
- Thiết kế tiếp tục tận dụng chat module/gateway hiện có thay vì mở thêm service ngoài phạm vi.
- Không có mục nào cần ghi vào Complexity Tracking.

## Complexity Tracking

Không có mục nào cần biện minh ở thời điểm lập plan này.
