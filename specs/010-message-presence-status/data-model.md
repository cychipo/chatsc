# Data Model: Trạng thái gửi/xem và hiện diện chat

## 1. Direct Conversation Presence

### Purpose
Đại diện cho một đoạn chat trực tiếp giữa hai người dùng và khả năng đoạn chat đó xuất hiện hoặc xuất hiện lại trong danh sách chat khi có hoạt động mới.

### Fields
- `conversationId`: định danh đoạn chat trực tiếp.
- `type`: loại đoạn chat, trong phạm vi feature này tập trung vào `direct`.
- `lastMessageAt`: thời điểm hoạt động tin nhắn mới nhất.
- `lastMessagePreview`: đoạn preview mới nhất hiển thị trong danh sách chat.
- `participants`: các bản ghi tham gia tương ứng của hai người dùng.

### Behavior
- Chỉ nên tồn tại một direct conversation hoạt động logic giữa cùng hai người dùng.
- Nếu một người dùng đã ẩn/xoá đoạn chat khỏi danh sách do `left`, đoạn chat có thể xuất hiện lại khi có tin nhắn trực tiếp mới.

## 2. Conversation Participant Presence

### Purpose
Đại diện cho trạng thái tham gia, trạng thái đọc và tín hiệu hiện diện theo từng người dùng trong một đoạn chat.

### Fields
- `conversationId`
- `userId`
- `status`: `active`, `left`, hoặc `removed`.
- `joinedAt`
- `leftAt`
- `lastReadMessageId`: tin nhắn mới nhất mà người dùng đã xem trong đoạn chat, nếu có.
- `lastReadAt`: thời điểm người dùng gần nhất mở/xem đoạn chat.
- `unreadCount`: số tin nhắn hiện đang chưa đọc cho người dùng trong đoạn chat.
- `typingState`: tín hiệu tạm thời cho biết người dùng đang nhập trong đoạn chat, nếu đang online.

### Validation Rules
- Chỉ người tham gia hợp lệ mới có participant record cho đoạn chat.
- `unreadCount` không được âm.
- `lastReadMessageId` chỉ được trỏ tới tin nhắn thuộc cùng `conversationId`.
- `typingState` là dữ liệu tạm thời, không được dùng như nguồn bền vững cho lịch sử.

## 3. Message

### Purpose
Đại diện cho một tin nhắn trong đoạn chat và là nguồn để suy ra preview, unread state, sent/seen status.

### Fields
- `messageId`
- `conversationId`
- `senderId`
- `content`
- `sentAt`
- `deliveryStatus`: tối thiểu vẫn bao gồm trạng thái đã gửi thành công.
- `reverseEncryptionState` và metadata giải mã hiện có nếu feature mã hoá đang bật.

### Derived Behavior
- Một tin nhắn được coi là `seen` với người gửi khi participant của người nhận đã có read marker bao phủ qua tin nhắn đó.
- Các tin nhắn outbound liên tiếp của cùng một người gửi có thể được gom thành một `Delivery Status Group` trong UI.

## 4. Delivery Status Group

### Purpose
Đại diện cho một tin nhắn đơn lẻ hoặc cụm nhiều tin nhắn liên tiếp của cùng người gửi dùng chung một nhãn trạng thái muted trong UI.

### Fields
- `conversationId`
- `senderId`
- `messageIds`: danh sách message liên tiếp thuộc cùng cụm.
- `tailMessageId`: tin nhắn cuối cùng trong cụm, là nơi hiển thị label.
- `statusLabel`: `sent` hoặc `seen`.

### Validation Rules
- Chỉ gom các tin nhắn liên tiếp của cùng `senderId`.
- Label chỉ hiển thị cho cụm outbound của người dùng hiện tại.

## 5. Unread Message Counter

### Purpose
Đại diện cho số lượng tin nhắn mới trong một conversation mà người dùng chưa mở để xem.

### Fields
- `conversationId`
- `userId`
- `count`
- `updatedAt`

### Behavior
- Tăng khi có tin nhắn mới đến conversation mà người dùng chưa mở để đọc.
- Giảm về `0` hoặc giá trị mới đúng thực tế khi người dùng mở đoạn chat.

## 6. Typing Presence

### Purpose
Đại diện cho tín hiệu tạm thời cho biết một người tham gia trong conversation đang nhập nội dung.

### Fields
- `conversationId`
- `userId`
- `isTyping`
- `expiresAt`

### Validation Rules
- Chỉ phát cho các participant hợp lệ của conversation.
- Phải tự hết hạn nếu không có cập nhật mới trong khoảng thời gian ngắn.

## 7. Conversation Preview Update Payload

### Purpose
Payload realtime và payload danh sách dùng để đồng bộ thứ tự conversation, preview mới nhất và metadata unread/read.

### Fields
- `conversationId`
- `lastMessagePreview`
- `lastMessageAt`
- `unreadCount`
- `hasUnread`
- `seenState` cho cụm outbound gần nhất nếu cần hiển thị ngay trong danh sách

### Behavior
- Khi có tin nhắn mới, payload này phải đủ để frontend đưa conversation lên đầu danh sách.
- Khi trạng thái đọc thay đổi, payload hoặc contract tương ứng phải đủ để frontend cập nhật badge và trạng thái đã xem mà không cần tải lại toàn bộ app.
