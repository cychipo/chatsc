# Feature Specification: Trạng thái gửi/xem và hiện diện chat

**Feature Branch**: `010-message-presence-status`  
**Created**: 2026-04-06  
**Status**: Draft  
**Input**: User description: "muốn khi người A gửi tin nhắn đến người B, thứ tự tin nhắn sẽ nhảy lên đầu, người B nhận được tin nhắn ngay, nếu chưa có hội thạoitruowsc đó ( có thể là đã xoá hoặc chưa chat bao giờ) thì cũng tự tạo đoạn chat ở người B, sẽ hiện số tin nhắn chưa đọc, bấm vào thì mới đọc, ở ui dưới 1 tin nhắn hặc 1 đoạn tin nhắn ( có thể gửi liên tiếp 1 2 3 .. tin nhắn ) sẽ có text muted là đã gửi hay đã xem , khi người dùng B nhập tin nhắn sẽ có animation đang soạn tin bằng icon giống với messager. Bạn tạo cho tôi spec phần này với nhé"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nhận tin nhắn theo thời gian thực (Priority: P1)

Là người nhận, tôi muốn thấy cuộc trò chuyện có tin nhắn mới xuất hiện ngay và được đưa lên đầu danh sách chat để tôi không bỏ lỡ tin nhắn vừa đến, kể cả khi trước đó tôi chưa từng chat hoặc đã xoá đoạn chat khỏi danh sách của mình.

**Why this priority**: Đây là giá trị cốt lõi nhất của trải nghiệm chat trực tiếp. Nếu người nhận không thấy cuộc trò chuyện bật lên ngay, các phần còn lại như unread count hay trạng thái đã xem sẽ kém giá trị.

**Independent Test**: Đăng nhập bằng hai tài khoản A và B. Khi A gửi tin nhắn cho B, phía B phải nhận được tin nhắn ngay; đoạn chat tương ứng phải xuất hiện hoặc được tạo lại nếu cần, và được đưa lên đầu danh sách chat.

**Acceptance Scenarios**:

1. **Given** A và B đã có đoạn chat trực tiếp, **When** A gửi một tin nhắn mới cho B, **Then** đoạn chat đó phải nhảy lên đầu danh sách chat của cả hai theo thứ tự hoạt động mới nhất.
2. **Given** B đang mở ứng dụng và chưa chọn đoạn chat với A, **When** A gửi tin nhắn cho B, **Then** B phải thấy đoạn chat với A xuất hiện ngay trong danh sách chat mà không cần tải lại trang.
3. **Given** B không còn thấy đoạn chat trước đó với A vì đã xoá khỏi danh sách hoặc chưa từng chat, **When** A gửi tin nhắn đầu tiên hoặc gửi lại tin nhắn mới, **Then** hệ thống phải tự tạo hoặc khôi phục đoạn chat phù hợp cho B và hiển thị nó trong danh sách chat.

---

### User Story 2 - Theo dõi tin nhắn chưa đọc (Priority: P2)

Là người nhận, tôi muốn biết mỗi đoạn chat đang có bao nhiêu tin nhắn chưa đọc và chỉ khi tôi mở đoạn chat đó thì các tin nhắn mới được đánh dấu là đã đọc.

**Why this priority**: Sau khi người dùng thấy tin nhắn đến ngay, bước tiếp theo là giúp họ biết nơi nào cần chú ý. Unread count trực tiếp hỗ trợ hành vi quay lại và đọc đúng đoạn chat.

**Independent Test**: Đăng nhập bằng hai tài khoản A và B. Để B không mở đoạn chat với A, cho A gửi nhiều tin nhắn. Danh sách chat của B phải hiển thị số tin nhắn chưa đọc. Khi B bấm vào đoạn chat đó, số chưa đọc phải được xoá hoặc giảm về đúng giá trị sau khi đọc.

**Acceptance Scenarios**:

1. **Given** B chưa mở đoạn chat với A, **When** A gửi một hoặc nhiều tin nhắn mới, **Then** đoạn chat của B phải hiển thị số tin nhắn chưa đọc tương ứng.
2. **Given** một đoạn chat đang có tin nhắn chưa đọc, **When** B bấm mở đoạn chat đó, **Then** các tin nhắn mới trong đoạn chat phải được đánh dấu là đã đọc và số chưa đọc phải được cập nhật ngay.
3. **Given** B đang mở đúng đoạn chat với A tại thời điểm tin nhắn mới đến, **When** A gửi thêm tin nhắn, **Then** hệ thống phải xử lý theo trạng thái đang xem để không hiển thị số chưa đọc sai lệch.

---

### User Story 3 - Hiển thị trạng thái gửi/xem và đang soạn tin (Priority: P3)

Là người gửi, tôi muốn biết tin nhắn của mình mới chỉ được gửi hay đã được người kia xem; đồng thời là người nhận hoặc người gửi, tôi muốn thấy tín hiệu "đang soạn tin" khi phía còn lại đang nhập để cuộc trò chuyện tự nhiên hơn.

**Why this priority**: Đây là lớp tín hiệu hiện diện giúp trải nghiệm chat giống ứng dụng nhắn tin quen thuộc hơn, nhưng vẫn đứng sau khả năng nhận tin nhắn ngay và quản lý chưa đọc.

**Independent Test**: Dùng hai tài khoản A và B trong cùng một đoạn chat. Sau khi A gửi một hoặc nhiều tin nhắn liên tiếp, UI của A phải hiển thị trạng thái muted dưới cụm tin phù hợp. Khi B mở và xem đoạn chat, trạng thái phải chuyển từ đã gửi sang đã xem. Khi B nhập nội dung, A phải thấy animation đang soạn tin.

**Acceptance Scenarios**:

1. **Given** A gửi một tin nhắn hoặc một cụm nhiều tin nhắn liên tiếp cho B, **When** B chưa mở xem đoạn chat, **Then** dưới cụm tin nhắn gần nhất của A phải hiển thị trạng thái muted cho biết tin đã được gửi nhưng chưa được xem.
2. **Given** A đã gửi tin nhắn cho B, **When** B mở và xem đoạn chat, **Then** trạng thái muted dưới cụm tin nhắn liên quan của A phải đổi sang đã xem.
3. **Given** B đang nhập nội dung trong đoạn chat với A, **When** B vẫn đang thao tác soạn tin, **Then** A phải thấy animation đang soạn tin mang tính chất trực quan, tương tự kiểu hiển thị phổ biến của ứng dụng nhắn tin hiện đại.

---

### Edge Cases

- Nếu A gửi nhiều tin nhắn liên tiếp trong thời gian ngắn, hệ thống phải giữ thứ tự hiển thị đúng và không tạo nhiều đoạn chat trùng nhau cho B.
- Nếu B nhận tin nhắn mới trong lúc đang ngoại tuyến, đoạn chat phải hiển thị trạng thái chưa đọc đúng ngay khi B quay lại.
- Nếu B đã xoá đoạn chat cũ với A nhưng A tiếp tục nhắn tin, hệ thống phải khôi phục đúng một đoạn chat thay vì tạo bản sao song song.
- Nếu nhiều tin nhắn mới đến trước khi danh sách chat hoặc màn hình chat kịp cập nhật, giao diện vẫn phải phản ánh đúng tin nhắn mới nhất ở đầu danh sách.
- Nếu trạng thái đang soạn tin kết thúc mà không gửi tin, tín hiệu đang soạn tin phải tự biến mất trong thời gian hợp lý.
- Nếu B mở đoạn chat rồi rời đi rất nhanh, hệ thống phải tránh đánh dấu đã xem sai cho các tin nhắn mà B chưa thực sự tiếp cận theo hành vi của ứng dụng.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST đưa đoạn chat có hoạt động tin nhắn mới nhất lên đầu danh sách chat của người gửi và người nhận.
- **FR-002**: Hệ thống MUST chuyển tin nhắn mới đến người nhận theo thời gian thực khi người nhận đang hoạt động trong ứng dụng.
- **FR-003**: Hệ thống MUST tự tạo hoặc khôi phục đoạn chat trực tiếp cho người nhận khi có tin nhắn mới đến mà người nhận hiện chưa có đoạn chat hiển thị với người gửi.
- **FR-004**: Hệ thống MUST hiển thị số lượng tin nhắn chưa đọc trên từng đoạn chat khi người dùng chưa mở đoạn chat đó.
- **FR-005**: Hệ thống MUST chỉ cập nhật trạng thái đọc của tin nhắn khi người nhận thực hiện hành động mở và xem đoạn chat tương ứng.
- **FR-006**: Hệ thống MUST cập nhật lại số tin nhắn chưa đọc ngay sau khi đoạn chat được đánh dấu là đã đọc.
- **FR-007**: Hệ thống MUST hiển thị trạng thái muted dưới tin nhắn hoặc cụm tin nhắn phù hợp để cho biết tin đã gửi hay đã xem.
- **FR-008**: Hệ thống MUST áp dụng trạng thái muted này theo cụm tin nhắn liên tiếp của cùng một người gửi thay vì buộc hiển thị lặp lại dưới mọi tin nhắn đơn lẻ.
- **FR-009**: Hệ thống MUST cập nhật trạng thái từ đã gửi sang đã xem khi người nhận đã xem đoạn chat chứa các tin nhắn liên quan.
- **FR-010**: Hệ thống MUST hiển thị tín hiệu đang soạn tin cho người còn lại khi một người dùng đang nhập nội dung trong đoạn chat.
- **FR-011**: Hệ thống MUST tự xoá tín hiệu đang soạn tin khi người dùng dừng nhập trong một khoảng thời gian hợp lý hoặc khi tin nhắn đã được gửi.
- **FR-012**: Hệ thống MUST tránh tạo đoạn chat trực tiếp trùng lặp giữa cùng hai người dùng chỉ vì có tin nhắn mới hoặc khôi phục sau khi xoá.
- **FR-013**: Hệ thống MUST giữ trạng thái chưa đọc, đã gửi, đã xem và đang soạn tin nhất quán sau khi tải lại giao diện hoặc nhận thêm sự kiện mới.
- **FR-014**: Hệ thống MUST đảm bảo các tín hiệu hiện diện và trạng thái đọc chỉ hiển thị cho những người tham gia đúng của đoạn chat.

### Key Entities *(include if feature involves data)*

- **Direct Conversation Presence**: Đại diện cho một đoạn chat trực tiếp giữa hai người dùng, bao gồm khả năng xuất hiện lại trong danh sách chat khi có hoạt động mới.
- **Unread Message Counter**: Đại diện cho số lượng tin nhắn mới trong một đoạn chat mà người dùng chưa mở và chưa xem.
- **Read State**: Đại diện cho mốc mà tại đó người nhận đã xem các tin nhắn trong một đoạn chat, dùng để xác định trạng thái đã gửi hoặc đã xem.
- **Delivery Status Group**: Đại diện cho một tin nhắn hoặc cụm tin nhắn liên tiếp của cùng người gửi dùng chung một nhãn trạng thái muted.
- **Typing Presence**: Đại diện cho tín hiệu tạm thời cho biết một người tham gia trong đoạn chat đang nhập nội dung.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trong kiểm thử với hai người dùng đang hoạt động, 100% tin nhắn mới làm đoạn chat tương ứng xuất hiện ở vị trí đầu danh sách chat của người nhận.
- **SC-002**: Trong kiểm thử với hai người dùng đang hoạt động, 100% tin nhắn mới được người nhận thấy trong ứng dụng mà không cần tải lại trang.
- **SC-003**: Trong kiểm thử các đoạn chat có tin nhắn chưa đọc, số lượng chưa đọc hiển thị đúng trước khi mở đoạn chat và được cập nhật đúng ngay sau khi người dùng mở xem.
- **SC-004**: Trong kiểm thử trạng thái tin nhắn, người gửi luôn thấy được một trạng thái cuối cùng rõ ràng cho cụm tin nhắn gần nhất của mình là đã gửi hoặc đã xem.
- **SC-005**: Trong kiểm thử nhập liệu hai chiều, tín hiệu đang soạn tin xuất hiện trong lúc đối phương đang nhập và biến mất sau khi họ dừng nhập hoặc gửi tin.

## Assumptions

- Tính năng áp dụng trước hết cho đoạn chat trực tiếp giữa hai người dùng; hành vi trong nhóm có thể được xem xét riêng nếu cần.
- Khi người dùng đã xoá đoạn chat khỏi danh sách của mình, hệ thống vẫn được phép hiển thị lại đoạn chat đó nếu có tin nhắn trực tiếp mới phát sinh.
- Trạng thái đã xem được hiểu là người nhận đã mở đoạn chat tương ứng trong ứng dụng, không yêu cầu xác minh người nhận đã đọc từng dòng nội dung.
- Trạng thái muted dưới tin nhắn được áp dụng cho cụm tin nhắn liên tiếp gần nhất của cùng một người gửi để tránh lặp lại quá nhiều nhãn trên giao diện.
- Tín hiệu đang soạn tin chỉ hiển thị khi cả hai phía đều đang ở trạng thái có thể nhận cập nhật hiện diện trong ứng dụng.
