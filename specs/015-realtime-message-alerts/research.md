# Research: Realtime message alerts

## Decision 1: Reuse existing chat socket events as the primary signal

- **Decision**: Dùng tiếp `message_delivered` để báo có tin nhắn mới và `conversation_preview_updated` để đồng bộ unread state.
- **Rationale**: [backend/src/modules/chat/chat.gateway.ts](../../backend/src/modules/chat/chat.gateway.ts) đã phát cả hai event vào user room. [backend/src/modules/chat/chat.service.ts](../../backend/src/modules/chat/chat.service.ts) đã cập nhật `unreadCount` cho participant và build preview sau mỗi lần send/read. Điều này cho phép feature bám vào nguồn sự thật hiện có thay vì tạo event mới.
- **Alternatives considered**:
  - Tạo event `unread_summary_updated`: bị loại vì trùng trách nhiệm với preview updates và làm tăng contract surface.
  - Poll conversation list định kỳ: bị loại vì không realtime và trái mục tiêu không cần refresh.

## Decision 2: Aggregate unread title state on the frontend from conversation previews

- **Decision**: Tính title tab từ `state.conversations` trên frontend.
- **Rationale**: [frontend/src/features/chat/chat.page.tsx](../../frontend/src/features/chat/chat.page.tsx) đã lưu `conversations` state, cập nhật nó qua `handlePreviewUpdate`, và reset unread qua `selectConversation`. Mỗi conversation đã có `unreadCount`, `hasUnread`, `displayTitle`, và với direct chat còn có `directPeer`, đủ để suy ra tổng unread và xác định khi nào chỉ có một sender.
- **Alternatives considered**:
  - Persist unread aggregate ở backend: không cần thiết vì dữ liệu nguồn đã sẵn trong preview list.
  - Tính title chỉ từ `message_delivered`: không đủ chính xác khi read state thay đổi hoặc khi socket reconnect.

## Decision 3: Keep notification orchestration inside ChatPage

- **Decision**: Đặt logic thông báo trong phiên và cập nhật `document.title` tại [frontend/src/features/chat/chat.page.tsx](../../frontend/src/features/chat/chat.page.tsx).
- **Rationale**: File này đã quản lý socket subscriptions, selected conversation, load conversations, và read flow. Đặt logic tại đây giúp dùng trực tiếp state hiện có, tránh thêm store/global abstraction mới cho một feature gắn chặt với chat page.
- **Alternatives considered**:
  - Tạo Zustand store mới cho notifications: bị loại vì tạo thêm complexity chưa cần thiết.
  - Nhét logic vào `chat-socket.service.ts`: bị loại vì service hiện chỉ đóng vai trò transport, không nên biết UI state như conversation đang mở hay title mặc định.

## Decision 4: Use runtime-only in-app notification presentation

- **Decision**: Hiển thị thông báo trong phiên bằng UI notification/message của frontend, không thêm push/email/browser permission flow.
- **Rationale**: Spec giới hạn phạm vi ở in-session realtime notifications và tab title updates. Repo hiện đã dùng Ant Design feedback APIs trong chat page, nên có thể mở rộng theo cùng pattern mà không thêm hạ tầng mới.
- **Alternatives considered**:
  - Browser Notification API: bị loại vì kéo theo permission UX và vượt ngoài phạm vi yêu cầu.
  - Email/SMS/off-session push: ngoài scope của spec.

## Decision 5: Preserve existing unread persistence model

- **Decision**: Tiếp tục dùng `ConversationParticipant.unreadCount`, `lastReadMessageId`, và `lastReadAt` làm unread persistence model.
- **Rationale**: [backend/src/modules/chat/schemas/conversation-participant.schema.ts](../../backend/src/modules/chat/schemas/conversation-participant.schema.ts) đã có các field cần thiết. `incrementUnreadForOtherParticipants()` tăng unread khi có tin mới, còn `markConversationRead()` reset unread về 0 cho conversation. Không cần thêm entity mới.
- **Alternatives considered**:
  - Thêm bảng/tài liệu notification riêng: bị loại vì duplicate dữ liệu unread.
  - Tính unread hoàn toàn từ message history mỗi lần render: bị loại vì tốn kém và không phù hợp với mô hình hiện tại.

## Open Questions Resolved

- **Single sender detection**: Dùng các conversation có `unreadCount > 0` làm tập nguồn unread; nếu chỉ có một conversation direct/unread source thì title dùng tên sender, nếu nhiều nguồn unread thì dùng title tổng quát.
- **Read synchronization**: `conversation_preview_updated` + `conversation_read_updated` và reload/select hiện có đủ để đưa title về trạng thái mới sau khi người dùng đọc tin nhắn.
- **Payload sufficiency**: Có thể bắt đầu với dữ liệu preview hiện có; chỉ mở rộng contract nếu trong bước implement phát hiện thiếu tên người gửi đáng tin cậy cho direct unread title.