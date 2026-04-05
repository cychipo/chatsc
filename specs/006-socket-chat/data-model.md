# Data Model: Gửi tin nhắn qua Socket

## 1. Live Chat Session
- **Mô tả**: Phiên kết nối thời gian thực của một người dùng đã xác thực.
- **Fields chính**:
  - `userId`: định danh người dùng đã đăng nhập
  - `connectionId`: định danh kết nối hiện tại
  - `status`: `connecting | connected | reconnecting | disconnected`
  - `joinedConversationIds`: danh sách conversation mà phiên đang subscribe
  - `connectedAt`
  - `lastSeenAt`
- **Validation rules**:
  - Chỉ người dùng đã xác thực mới có thể tạo live session
  - Một user có thể có nhiều live session đồng thời trên nhiều tab / thiết bị
- **State transitions**:
  - `connecting -> connected`
  - `connected -> reconnecting`
  - `reconnecting -> connected`
  - `connected/reconnecting -> disconnected`

## 2. Conversation Subscription
- **Mô tả**: Quan hệ giữa một live session và một conversation mà session được phép nhận cập nhật realtime.
- **Fields chính**:
  - `connectionId`
  - `conversationId`
  - `userId`
  - `joinedAt`
- **Validation rules**:
  - Chỉ được subscribe conversation nếu `userId` là active participant
  - Mỗi `connectionId + conversationId` chỉ có một subscription hiệu lực tại một thời điểm
- **State transitions**:
  - `joined -> left`
  - `joined -> rejoined` sau reconnect hoặc đổi conversation

## 3. Conversation Message
- **Mô tả**: Tin nhắn được ghi nhận thành công và được phát realtime tới người tham gia.
- **Fields chính**:
  - `_id`
  - `conversationId`
  - `senderId`
  - `content`
  - `sentAt`
  - `deliveryStatus`
- **Validation rules**:
  - `content` không được rỗng hoặc chỉ chứa khoảng trắng
  - `senderId` phải là active participant của `conversationId`
  - message chỉ được emit sau khi đã được persist thành công
- **Derived behavior**:
  - Tin nhắn mới cập nhật `lastMessageAt` của conversation
  - Tin nhắn mới cập nhật preview và thứ tự danh sách chat

## 4. Connection Status Indicator
- **Mô tả**: Trạng thái hiển thị ở frontend để người dùng biết socket có sẵn hay không.
- **Fields chính**:
  - `state`: `connecting | connected | reconnecting | disconnected`
  - `lastError?`
  - `lastConnectedAt?`
- **Validation rules**:
  - Nếu state khác `connected`, UI phải thể hiện rõ là kết nối đang không sẵn sàng hoàn toàn
  - Nếu gửi thất bại do mất kết nối, trạng thái lỗi phải hiển thị được cho người dùng
