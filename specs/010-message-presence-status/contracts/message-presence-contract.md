# Contract: Trạng thái gửi/xem và hiện diện chat

## 1. Conversation summary contract

### Purpose
Trả danh sách đoạn chat cho người dùng hiện tại với đủ metadata để render thứ tự mới nhất, unread count và preview.

### Response shape
Mỗi conversation summary phải bao gồm tối thiểu:
- `id`
- `type`
- `displayTitle`
- `lastMessagePreview`
- `lastMessageAt`
- `unreadCount`
- `hasUnread`
- metadata direct peer nếu là chat trực tiếp

### Behavior
- Danh sách được sắp xếp theo hoạt động mới nhất giảm dần.
- Nếu có tin nhắn mới trong direct chat mà người nhận đã xoá trước đó, conversation vẫn phải xuất hiện lại trong response.

## 2. Realtime message delivery contract

### Purpose
Đẩy tin nhắn mới tới người tham gia liên quan theo thời gian thực.

### Message event
Sự kiện tin nhắn mới phải cung cấp tối thiểu:
- `messageId`
- `conversationId`
- `senderId`
- `content`
- `sentAt`
- metadata hiển thị cần thiết cho message status nếu có

### Behavior
- Người nhận online nhận được sự kiện mà không cần reload.
- Nếu conversation chưa hiện trong danh sách phía người nhận, frontend vẫn có đủ tín hiệu tiếp theo để tạo hoặc hiện lại conversation.

## 3. Conversation preview update contract

### Purpose
Cập nhật danh sách chat ngay sau khi có message mới hoặc thay đổi read state.

### Event shape
Sự kiện preview update phải bao gồm tối thiểu:
- `conversationId`
- `lastMessagePreview`
- `lastMessageAt`
- `unreadCount`
- `hasUnread`

### Implemented note
- Payload realtime preview được mở rộng theo cùng shape unread metadata để frontend có thể reorder danh sách chat và cập nhật badge mà không cần reload.

### Behavior
- Frontend có thể dùng riêng payload này để đưa conversation lên đầu danh sách.
- Với người gửi, payload phản ánh preview mới nhất nhưng không tăng unread count cho chính họ.
- Với người nhận, payload phản ánh unread count đúng theo trạng thái đã mở/xem.

## 4. Mark conversation as read contract

### Purpose
Đánh dấu conversation là đã đọc khi người dùng mở/xem thread.

### Trigger
Hệ thống phải hỗ trợ một contract rõ ràng để client báo rằng conversation hiện đã được mở để đọc.

### Request shape
Tối thiểu cần có:
- `conversationId`
- read marker hoặc thông tin đủ để suy ra mốc đã xem mới nhất

### Response shape
Trả về tối thiểu:
- `conversationId`
- `unreadCount`
- `lastReadMessageId` hoặc read marker tương đương
- trạng thái thành công

### Behavior
- Sau khi contract này hoàn tất, unread count của conversation phải được cập nhật ngay.
- Các payload tiếp theo cho người gửi phải có thể suy ra `seen` nếu mốc đọc đã bao phủ tin nhắn mới nhất.
- HTTP `POST /chat/conversations/:conversationId/read` và socket event `mark_conversation_read` hiện cùng trả `conversationId`, `unreadCount`, `lastReadMessageId` để frontend có thể đồng bộ state không cần reload.

## 5. Message seen status contract

### Purpose
Cho phép frontend hiển thị text muted `Đã gửi` hoặc `Đã xem` dưới cụm tin outbound.

### Required data
Hệ thống phải cung cấp đủ dữ liệu để frontend xác định:
- cụm outbound gần nhất của người dùng hiện tại trong conversation
- trạng thái hiện tại của cụm đó là `sent` hay `seen`

### Behavior
- Không cần label lặp cho mọi tin nhắn.
- Khi người nhận mở và xem conversation, trạng thái của cụm phù hợp phải chuyển sang `seen`.
- Payload message hiện mang `seenState` và `isTailOfSenderGroup` để UI chỉ render muted label cho tin cuối của cụm outbound.

## 6. Typing presence contract

### Purpose
Cập nhật realtime rằng một participant đang nhập nội dung trong conversation.

### Event shape
Sự kiện typing phải bao gồm tối thiểu:
- `conversationId`
- `userId`
- `isTyping`
- `expiresAt` hoặc tín hiệu đủ để client tự hết hạn indicator

### Behavior
- Chỉ participant còn lại trong cùng conversation mới nhìn thấy indicator.
- Indicator biến mất khi người dùng dừng nhập quá lâu, rời conversation, hoặc gửi tin nhắn.
- Socket event `typing_presence_updated` hiện phát kèm `expiresAt` để UI tự dọn indicator nếu không có tín hiệu mới.

## 7. Failure cases

- Nếu người dùng không còn là participant hợp lệ của conversation, hệ thống từ chối join/read/typing updates cho conversation đó.
- Nếu có nhiều tin nhắn mới đến liên tiếp, contract preview và unread vẫn phải nhất quán, không bỏ sót event cuối.
- Nếu người nhận offline rồi quay lại, conversation summary ban đầu vẫn phải phản ánh unread count đúng dù không nhận được event realtime trước đó.
