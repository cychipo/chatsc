# Data Model: Realtime message alerts

## 1. ConversationParticipant (existing persisted entity)

**Purpose**: Lưu trạng thái tham gia hội thoại và unread state của từng người dùng trong từng conversation.

**Fields used by this feature**
- `conversationId`: định danh hội thoại
- `userId`: định danh người tham gia
- `status`: chỉ participant `active` mới nhận unread updates
- `lastReadMessageId`: tin nhắn gần nhất đã đọc
- `lastReadAt`: thời điểm cập nhật read gần nhất
- `unreadCount`: số tin nhắn chưa đọc của người dùng trong conversation đó

**Validation / rules**
- `unreadCount >= 0`
- Chỉ unread của participant không phải sender mới được tăng khi có tin nhắn mới.
- Khi người dùng đánh dấu đã đọc conversation, `unreadCount` phải về `0`.

**State transitions**
- `active + unreadCount = n` -> nhận tin mới -> `active + unreadCount = n + 1`
- `active + unreadCount > 0` -> mark as read -> `active + unreadCount = 0`
- `left/removed` -> không còn được tính là nguồn unread hoạt động

## 2. Conversation Preview (existing API/socket view model)

**Purpose**: Cung cấp snapshot nhẹ của từng conversation cho sidebar và unread UI.

**Fields used by this feature**
- `conversationId`
- `displayTitle`
- `directPeer`
- `lastMessagePreview`
- `lastMessageAt`
- `unreadCount`
- `hasUnread`

**Derived rules**
- `hasUnread = unreadCount > 0`
- Conversation được đưa vào aggregate title nếu `unreadCount > 0`
- Tên sender ưu tiên lấy từ `directPeer.displayName`, sau đó fallback `displayTitle`

## 3. RealtimeMessage (existing socket payload)

**Purpose**: Payload tin nhắn realtime dùng để hiển thị message mới và xác định có cần nổi thông báo trong phiên hay không.

**Fields used by this feature**
- `messageId`
- `conversationId`
- `senderId`
- `senderDisplayName`
- `content`
- `sentAt`
- `isAIBotMessage`

**Rules**
- Chỉ inbound message từ user khác mới có thể tạo thông báo mới cho người nhận.
- Message của chính current user không được tạo notification unread mới cho chính họ.

## 4. Unread Notification Summary (new derived runtime model)

**Purpose**: Mô hình tổng hợp ở frontend để điều khiển toast + tab title, không persistence.

**Fields**
- `totalUnreadMessages`: tổng unread trên toàn bộ conversations
- `unreadConversationIds`: danh sách conversation đang có unread
- `unreadSourceCount`: số nguồn gửi unread đang hoạt động sau khi tổng hợp
- `singleSenderName?`: tên sender nếu chỉ có một nguồn unread
- `titleVariant`: `default | single-sender | multi-sender`

**Derivation rules**
- `totalUnreadMessages = sum(conversation.unreadCount)` với mọi conversation unread
- `titleVariant = default` khi `totalUnreadMessages = 0`
- `titleVariant = single-sender` khi chỉ có một nguồn unread hợp lệ
- `titleVariant = multi-sender` khi có từ hai nguồn unread trở lên

## 5. In-session Notification Item (new derived runtime model)

**Purpose**: Đại diện cho một thông báo ngắn hiển thị cho người dùng trong phiên hiện tại.

**Fields**
- `messageId`
- `conversationId`
- `senderId`
- `senderDisplayName`
- `previewText`
- `receivedAt`

**Rules**
- Mỗi `messageId` chỉ nên hiển thị thông báo một lần.
- Không hiển thị cho message do current user gửi.
- Có thể bỏ qua nếu unread được xóa ngay do conversation đang mở và đã được mark read tức thời.
