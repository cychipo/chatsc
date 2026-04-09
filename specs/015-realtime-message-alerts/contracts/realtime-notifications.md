# Contract: Realtime notifications and unread title behavior

## Scope

Mô tả contract hành vi giữa backend chat realtime layer và frontend chat UI cho feature thông báo realtime + cập nhật title tab.

## Existing inbound realtime events

### `message_delivered`

**Producer**: Chat gateway user room / conversation room  
**Consumer**: Frontend chat socket service and chat page

**Required payload**
- `messageId: string`
- `conversationId: string`
- `senderId: string`
- `senderDisplayName?: string`
- `content: string`
- `sentAt: string`
- `isAIBotMessage?: boolean`

**Behavioral contract**
- Event này báo rằng một message mới đã đến client realtime.
- Frontend dùng event này để cập nhật message list và quyết định có hiển thị thông báo trong phiên hay không.
- Event này không phải nguồn sự thật duy nhất cho unread aggregate/title vì unread có thể thay đổi sau read sync hoặc reconnect.

### `conversation_preview_updated`

**Producer**: Chat gateway user room  
**Consumer**: Frontend chat socket service and chat page

**Required payload**
- `conversationId: string`
- `lastMessagePreview: string`
- `lastMessageAt: string`
- `unreadCount?: number`
- `hasUnread?: boolean`

**Recommended payload support for this feature**
- Frontend should also rely on conversation list metadata (`displayTitle`, `directPeer`) already loaded from conversation APIs.
- If implementation reveals ambiguity for single-sender naming, backend may extend preview payload with explicit sender presentation fields while preserving backward compatibility for existing consumers.

**Behavioral contract**
- Đây là nguồn sự thật để đồng bộ unread count per conversation trên frontend.
- Mỗi khi unread thay đổi do send/read, frontend phải dùng payload mới nhất để tính total unread và tab title.

### `conversation_read_updated`

**Producer**: Chat gateway user room / conversation room  
**Consumer**: Frontend chat socket service and chat page

**Required payload**
- `conversationId: string`
- `unreadCount: number`
- `lastReadMessageId?: string`

**Behavioral contract**
- Khi unread của conversation được reset, frontend phải phản ánh trạng thái mới và cho phép title quay về title mặc định hoặc title của nguồn unread còn lại.

## Frontend title contract

### Default state
- Khi tổng unread bằng `0`, `document.title` phải trở về title mặc định của ứng dụng.

### Single-sender state
- Khi toàn bộ unread hiện tại đến từ đúng một nguồn sender hợp lệ, `document.title` phải là:
  - `Bạn có n tin nhắn mới từ {name user}`

### Multi-sender state
- Khi unread đến từ nhiều hơn một nguồn sender, `document.title` phải là:
  - `Bạn có n tin nhắn chưa đọc`

### Counting rule
- `n` là tổng số message unread trên toàn bộ conversations, không phải số conversations.

## Frontend in-session notification contract

- Chỉ hiển thị cho message mới đến từ user khác current user.
- Không yêu cầu browser permission flow.
- Nội dung thông báo phải đủ để người dùng hiểu có hoạt động chat mới đến mà không cần refresh trang.
- Một message không được tạo nhiều thông báo trùng lặp chỉ vì nhiều event socket hoặc reconnect.

## Error tolerance

- Nếu socket tạm mất kết nối rồi đồng bộ lại, unread aggregate sau cùng vẫn phải được làm mới từ conversation preview state.
- Nếu thiếu sender display name, title phải fallback an toàn sang dạng tổng quát hoặc display title thay thế, không để title lỗi format.