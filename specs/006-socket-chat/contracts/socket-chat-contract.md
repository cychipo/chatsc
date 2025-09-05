# Contract: Socket Chat Realtime Events

## Purpose
Mô tả các tương tác thời gian thực mà client chat và server chat phải thống nhất để gửi, nhận và đồng bộ trạng thái cuộc trò chuyện theo realtime.

## Connection Contract
- Client chỉ được kết nối realtime khi người dùng đã đăng nhập hợp lệ và gửi access token hiện tại trong handshake socket.
- Server từ chối kết nối nếu token không hợp lệ hoặc hết hạn.
- Namespace realtime chat hiện dùng là `/chat`.
- Sau khi kết nối thành công, server emit `connection_status_changed` với `state=connected`.

## Client → Server Events

### 1. `join_conversation`
- **Intent**: Client đăng ký nhận cập nhật realtime cho một conversation đang mở.
- **Required data**:
  - `conversationId`
- **Expected outcome**:
  - Nếu user là active participant, server join connection vào room của conversation và ack thành công.
  - Nếu user không có quyền, server ack lỗi rõ ràng và không subscribe.

### 2. `leave_conversation`
- **Intent**: Client rời đăng ký realtime khỏi conversation trước đó.
- **Required data**:
  - `conversationId`
- **Expected outcome**:
  - Server remove connection khỏi room conversation và ack thành công.

### 3. `send_message`
- **Intent**: Client gửi tin nhắn mới qua kết nối realtime.
- **Required data**:
  - `conversationId`
  - `content`
- **Validation**:
  - User phải là active participant.
  - Nội dung không được rỗng sau khi trim.
- **Expected outcome**:
  - Server persist message thành công.
  - Server ack với payload message chuẩn hoá.
  - Server emit `message_delivered` tới room conversation.
  - Server emit `conversation_preview_updated` tới các participant active của conversation.
  - Nếu gửi thất bại, ack trả lỗi rõ ràng.

## Server → Client Events

### 1. `message_delivered`
- **Intent**: Thông báo một tin nhắn mới đã được chấp nhận và phát thành công.
- **Payload tối thiểu**:
  - `messageId`
  - `conversationId`
  - `senderId`
  - `content`
  - `sentAt`
- **Client behavior**:
  - Thêm tin nhắn vào thread nếu chưa tồn tại.
  - Nếu là echo từ chính người gửi, dùng `messageId` để dedupe.

### 2. `conversation_preview_updated`
- **Intent**: Thông báo thông tin danh sách chat cần cập nhật theo message mới.
- **Payload tối thiểu**:
  - `conversationId`
  - `lastMessagePreview`
  - `lastMessageAt`
- **Client behavior**:
  - Cập nhật preview và sắp xếp lại conversation list nếu cần.

### 3. `connection_status_changed`
- **Intent**: Thông báo trạng thái realtime hiện tại của client.
- **Payload tối thiểu**:
  - `state` (`connecting | connected | reconnecting | disconnected`)
- **Client behavior**:
  - Hiển thị trạng thái kết nối phù hợp cho người dùng.

## Ack Error Shape
- **Payload tối thiểu**:
  - `code`
  - `message`
  - `conversationId?`
- **Các code thường gặp**:
  - `UNAUTHORIZED`
  - `FORBIDDEN`
  - `EMPTY_MESSAGE`
  - `SOCKET_NOT_READY`
  - `CHAT_ERROR`

## Compatibility Rules
- Message history hiện có vẫn tiếp tục được tải bằng REST API hiện tại.
- Realtime contract chỉ phục vụ live delivery và đồng bộ preview/trạng thái liên quan đến message mới.
- Mọi payload message server phát cho client phải có đủ thông tin để dedupe theo `messageId`.
