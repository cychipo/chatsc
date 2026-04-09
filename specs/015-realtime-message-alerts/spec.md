# Feature Specification: Thông báo tin nhắn realtime

**Feature Branch**: `015-realtime-message-alerts`  
**Created**: 2026-04-09  
**Status**: Draft  
**Input**: User description: "tôi muốn làm tính năng thông báo realtime khi có người nhắn cho hệ thóng, nếu có tin nhắn mới sẽ có thông báo về áy gười dùng, ngoài ra title của trang ( nó là cái text của tab ấy ) sẽ thay đổi dạng :
- nếu có 1 người nhắn thì sẽ là bạn có n tin nhắn mới từ {name user}
- Nếu có nhiều tin nhắn từ nhiều người sẽ là bạn có n tin nhắn chưa đọc

Bạn tạo spec cho toi nhé"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nhận biết ngay khi có tin nhắn mới (Priority: P1)

Là người dùng đang đăng nhập vào hệ thống chat, tôi muốn nhận được thông báo ngay khi có tin nhắn mới gửi đến mình để không bỏ lỡ hội thoại mới hoặc phản hồi quan trọng.

**Why this priority**: Giá trị cốt lõi của tính năng là giúp người dùng biết ngay có tin nhắn mới mà không cần tự kiểm tra thủ công.

**Independent Test**: Có thể kiểm thử độc lập bằng cách để một người dùng khác gửi tin nhắn mới cho tài khoản đang đăng nhập và xác nhận tài khoản nhận được thông báo mới ngay trong phiên làm việc hiện tại.

**Acceptance Scenarios**:

1. **Given** người dùng đang đăng nhập và đang mở hệ thống, **When** có người khác gửi tin nhắn mới đến hội thoại của họ, **Then** người dùng phải nhận được thông báo mới trong lúc đang sử dụng hệ thống.
2. **Given** người dùng đang ở một màn hình khác trong hệ thống nhưng phiên làm việc vẫn còn hiệu lực, **When** có tin nhắn mới gửi đến, **Then** thông báo vẫn phải xuất hiện để người dùng biết có hoạt động mới.

---

### User Story 2 - Cập nhật tiêu đề tab khi chỉ có một người nhắn (Priority: P2)

Là người dùng đang mở hệ thống trên trình duyệt, tôi muốn tiêu đề tab đổi sang thông điệp nêu rõ số tin nhắn mới và tên người gửi khi chỉ có một người đang nhắn cho tôi để tôi nhận biết nhanh nguồn tin nhắn.

**Why this priority**: Tiêu đề tab là tín hiệu dễ thấy khi người dùng đang chuyển sang tab khác; việc hiển thị tên người gửi giúp ưu tiên xử lý nhanh hơn.

**Independent Test**: Có thể kiểm thử độc lập bằng cách tạo nhiều tin nhắn chưa đọc từ cùng một người gửi và xác nhận tiêu đề tab hiển thị đúng số lượng tin nhắn mới cùng tên người gửi.

**Acceptance Scenarios**:

1. **Given** người dùng có đúng một người gửi đang tạo ra các tin nhắn chưa đọc, **When** ít nhất một tin nhắn mới đến, **Then** tiêu đề tab phải hiển thị theo mẫu: "Bạn có n tin nhắn mới từ {tên người dùng}".
2. **Given** người dùng tiếp tục nhận thêm tin nhắn chưa đọc từ cùng người gửi đó, **When** số lượng tin nhắn chưa đọc tăng lên, **Then** tiêu đề tab phải cập nhật lại đúng tổng số tin nhắn chưa đọc và vẫn giữ tên người gửi.

---

### User Story 3 - Gộp tiêu đề tab khi có nhiều người nhắn (Priority: P3)

Là người dùng đang mở hệ thống trên trình duyệt, tôi muốn tiêu đề tab chuyển sang thông điệp tổng quát khi có tin nhắn chưa đọc từ nhiều người khác nhau để biết tôi đang có nhiều hội thoại cần xem.

**Why this priority**: Khi có nhiều nguồn tin nhắn, thông điệp tổng quát giúp tránh tiêu đề tab quá dài nhưng vẫn giữ được thông tin quan trọng là số lượng tin nhắn chưa đọc.

**Independent Test**: Có thể kiểm thử độc lập bằng cách tạo tin nhắn chưa đọc từ ít nhất hai người gửi khác nhau và xác nhận tiêu đề tab đổi sang mẫu tổng quát.

**Acceptance Scenarios**:

1. **Given** người dùng có tin nhắn chưa đọc từ ít nhất hai người gửi khác nhau, **When** tiêu đề tab được cập nhật, **Then** tiêu đề tab phải hiển thị theo mẫu: "Bạn có n tin nhắn chưa đọc".
2. **Given** người dùng đang thấy tiêu đề tổng quát do có nhiều người gửi, **When** họ đọc bớt tin nhắn và chỉ còn tin nhắn chưa đọc từ một người gửi, **Then** tiêu đề tab phải quay về mẫu có tên người gửi tương ứng.

---

### Edge Cases

- Khi người dùng đã đọc hết toàn bộ tin nhắn chưa đọc, tiêu đề tab phải trở về tiêu đề mặc định của hệ thống.
- Khi một người gửi tạo nhiều tin nhắn liên tiếp trong thời gian ngắn, hệ thống vẫn phải cộng dồn đúng số lượng tin nhắn chưa đọc thay vì tạo nhiều trạng thái mâu thuẫn.
- Khi có nhiều người gửi cùng lúc, tiêu đề tab phải ưu tiên mẫu tổng quát thay vì cố gắng hiển thị nhiều tên.
- Khi tên người gửi trống, không hợp lệ, hoặc không còn khả dụng, hệ thống phải dùng cách hiển thị thay thế dễ hiểu mà không làm hỏng cấu trúc tiêu đề tab.
- Khi người dùng đăng xuất, phiên làm việc hết hạn, hoặc không còn quyền truy cập hội thoại, hệ thống không được tiếp tục hiển thị thông báo mới cho phiên đó.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST deliver an in-session realtime notification to the recipient when a new message is sent to a conversation they can access.
- **FR-002**: System MUST only show new message notifications to the intended recipient while that recipient has an active authenticated session.
- **FR-003**: System MUST maintain an up-to-date unread message count for the current user across all conversations during the active session.
- **FR-004**: System MUST maintain enough sender context to determine whether unread messages currently come from exactly one sender or from multiple senders.
- **FR-005**: When unread messages exist from exactly one sender, the system MUST update the browser tab title to the format: "Bạn có n tin nhắn mới từ {tên người dùng}".
- **FR-006**: When unread messages exist from multiple senders, the system MUST update the browser tab title to the format: "Bạn có n tin nhắn chưa đọc".
- **FR-007**: The system MUST recalculate the browser tab title whenever a new unread message arrives, an unread message is marked as read, or the unread sender set changes between one sender and multiple senders.
- **FR-008**: The system MUST restore the default browser tab title when the current user has no unread messages.
- **FR-009**: The system MUST increment the value `n` in the tab title based on the total number of unread messages for the current user, not just the number of conversations.
- **FR-010**: The system MUST keep the tab title consistent with the current unread state even when multiple new messages arrive close together.
- **FR-011**: Users MUST be able to understand from the notification and tab title that new chat activity has arrived without manually refreshing the page.

### Key Entities *(include if feature involves data)*

- **Unread Message State**: Trạng thái tổng hợp cho người dùng hiện tại, bao gồm tổng số tin nhắn chưa đọc, danh sách người gửi đang tạo ra tin nhắn chưa đọc, và trạng thái còn/không còn tin nhắn chưa đọc.
- **Message Notification Event**: Sự kiện thông báo rằng một tin nhắn mới vừa đến với người nhận hợp lệ trong phiên đang hoạt động.
- **Tab Title State**: Trạng thái hiển thị trên tiêu đề tab, gồm tiêu đề mặc định, tiêu đề theo một người gửi, hoặc tiêu đề tổng quát theo nhiều người gửi.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trong kiểm thử chấp nhận, 100% tin nhắn mới gửi đến người dùng đang hoạt động đều tạo ra thông báo trong cùng phiên làm việc mà không cần tải lại trang.
- **SC-002**: Trong kiểm thử chấp nhận, tiêu đề tab phản ánh đúng tổng số tin nhắn chưa đọc ở mọi kịch bản một người gửi và nhiều người gửi.
- **SC-003**: Trong kiểm thử chấp nhận, tiêu đề tab được cập nhật đúng trong vòng 2 giây sau khi có thay đổi trạng thái chưa đọc.
- **SC-004**: Ít nhất 90% kịch bản kiểm thử chính của tính năng có thể được hoàn thành mà không cần người dùng tự làm mới trang để thấy trạng thái mới.

## Assumptions

- Tính năng chỉ áp dụng cho người dùng đang đăng nhập và đang có phiên làm việc hợp lệ trên ứng dụng web.
- `n` trong tiêu đề tab là tổng số tin nhắn chưa đọc của người dùng trên toàn hệ thống chat, không giới hạn trong một hội thoại duy nhất.
- Khi chỉ có một người gửi tạo ra các tin nhắn chưa đọc, hệ thống luôn có thể xác định được tên hiển thị phù hợp của người gửi đó.
- Tiêu đề mặc định của hệ thống đã tồn tại sẵn và có thể được khôi phục khi không còn tin nhắn chưa đọc.
- Phạm vi của feature này chỉ bao gồm thông báo trong phiên sử dụng và thay đổi tiêu đề tab; không bao gồm email, SMS, hoặc thông báo đẩy ngoài trình duyệt.