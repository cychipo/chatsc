# Feature Specification: Chat Groups

**Feature Branch**: `[003-chat-groups]`  
**Created**: 2026-04-04  
**Status**: Draft  
**Input**: User description: "bây giờ bạn tạo cho tôi spec cho phần chat nhé, phần này có thể chat đơn lẻ, chat theo nhóm, theo nhóm thì biết được ai tham giao vào lúc nào, ai được ai thêm vào nhóm, có thể rời nhóm, xoá khỏi nhóm, ... giao diện chat sẽ giống với message của facebook, tin nhắn sẽ gửi đến backend và be kết nối tới nhân linux như hiện tại, à tôi muốn tin nhắn gửi từ fe lên be sẽ là dạng binary thay vì text thuần, be chuyển bynarry đó ngược lại thành văn bản nhé"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gửi tin nhắn 1-1 (Priority: P1)

Người dùng đã đăng nhập có thể mở cuộc trò chuyện riêng với một người khác và gửi nhận tin nhắn ngay trong giao diện chat để trao đổi trực tiếp.

**Why this priority**: Đây là giá trị cốt lõi nhất của phần chat. Chỉ cần luồng chat 1-1 hoạt động là đã có một MVP có thể dùng được.

**Independent Test**: Có thể kiểm thử độc lập bằng cách cho hai người dùng mở cùng một cuộc trò chuyện riêng, gửi tin nhắn từ một bên và xác nhận bên còn lại nhận được nội dung đúng trong giao diện chat.

**Acceptance Scenarios**:

1. **Given** hai người dùng có quyền truy cập phần chat, **When** một người gửi tin nhắn trong cuộc trò chuyện riêng, **Then** tin nhắn xuất hiện ở phía người gửi và được chuyển tới người nhận.
2. **Given** một cuộc trò chuyện riêng đã có lịch sử tin nhắn, **When** người dùng mở lại cuộc trò chuyện đó, **Then** hệ thống mặc định hiển thị 10 tin nhắn gần nhất theo đúng thứ tự thời gian.
3. **Given** người dùng đang xem một cuộc trò chuyện cũ, **When** họ kéo lên để xem lịch sử trước đó, **Then** hệ thống tải thêm 10 tin nhắn cũ hơn mỗi lần cho đến khi hết lịch sử khả dụng.
4. **Given** người dùng gửi nội dung từ giao diện chat, **When** tin nhắn được chuyển từ frontend lên backend, **Then** payload được gửi ở dạng binary và backend chuyển ngược về dạng văn bản có thể đọc được trước khi đẩy vào luồng chat hiện tại.

---

### User Story 2 - Chat nhóm và theo dõi lịch sử thành viên (Priority: P2)

Người dùng có thể tham gia cuộc trò chuyện nhóm, xem ai đã vào nhóm lúc nào và ai là người thêm họ để hiểu đầy đủ bối cảnh của nhóm.

**Why this priority**: Đây là phần quan trọng tiếp theo mà người dùng đã yêu cầu rõ ràng, giúp phần chat nhóm có tính minh bạch và dễ theo dõi.

**Independent Test**: Có thể kiểm thử độc lập bằng cách tạo một nhóm, thêm thành viên bằng một người dùng khác, rồi xác nhận giao diện nhóm hiển thị đúng người tham gia, thời điểm tham gia và người đã thực hiện thao tác thêm.

**Acceptance Scenarios**:

1. **Given** một nhóm đã tồn tại, **When** một người dùng thêm thành viên mới, **Then** hệ thống ghi nhận thành viên được thêm, người đã thêm và thời điểm thay đổi.
2. **Given** người dùng mở một cuộc trò chuyện nhóm, **When** trong nhóm đã có các thay đổi thành viên trước đó, **Then** giao diện hiển thị rõ các sự kiện tham gia thành viên trong ngữ cảnh của nhóm.
3. **Given** một thành viên được thêm bởi người khác, **When** các thành viên xem lịch sử nhóm, **Then** họ biết được ai được thêm và ai là người đã thêm họ.

---

### User Story 3 - Rời nhóm hoặc xoá thành viên khỏi nhóm (Priority: P3)

Người dùng có thể rời nhóm, và người có quyền quản lý thành viên có thể xoá một người khỏi nhóm để danh sách thành viên luôn chính xác.

**Why this priority**: Đây là luồng quản trị vòng đời cần thiết cho chat nhóm, nhưng vẫn xếp sau khả năng chat và xem lịch sử thành viên.

**Independent Test**: Có thể kiểm thử độc lập bằng cách cho một thành viên tự rời nhóm và cho một người có quyền xoá thành viên khác, sau đó xác nhận danh sách thành viên hoạt động và lịch sử nhóm được cập nhật đúng.

**Acceptance Scenarios**:

1. **Given** người dùng đang là thành viên hiện tại của một nhóm, **When** họ chọn rời nhóm, **Then** họ bị xoá khỏi danh sách thành viên đang hoạt động và sự kiện đó được ghi vào lịch sử nhóm.
2. **Given** một thành viên có quyền quản lý nhóm, **When** họ xoá một thành viên khác khỏi nhóm, **Then** người bị xoá không còn trong danh sách thành viên đang hoạt động và sự kiện bị xoá được ghi lại.
3. **Given** một người đã rời nhóm hoặc bị xoá khỏi nhóm, **When** họ cố gửi thêm tin nhắn vào nhóm đó, **Then** hệ thống không cho phép gửi tin nhắn mới.

---

### User Story 4 - Dùng giao diện chat quen thuộc (Priority: P3)

Người dùng có thể thao tác trong giao diện chat có bố cục quen thuộc giống các ứng dụng nhắn tin phổ biến để dễ làm quen và sử dụng.

**Why this priority**: Người dùng đã yêu cầu giao diện giống Messenger về mặt bố cục và trải nghiệm, giúp phần chat dễ tiếp cận hơn.

**Independent Test**: Có thể kiểm thử độc lập bằng cách xác nhận người dùng phân biệt được danh sách cuộc trò chuyện, khung hội thoại đang mở và vùng nhập tin nhắn mà không cần hướng dẫn.

**Acceptance Scenarios**:

1. **Given** người dùng mở phần chat, **When** giao diện được hiển thị, **Then** họ có thể nhận ra danh sách cuộc trò chuyện, vùng nội dung cuộc trò chuyện hiện tại và ô nhập tin nhắn.
2. **Given** một cuộc trò chuyện có tin nhắn từ nhiều người, **When** người dùng xem luồng hội thoại, **Then** họ có thể phân biệt trực quan tin nhắn của mình với tin nhắn của người khác.

### Edge Cases

- Điều gì xảy ra khi payload binary không thể được backend chuyển ngược thành văn bản đọc được.
- Điều gì xảy ra khi một người dùng bị thêm lặp lại vào cùng một nhóm.
- Điều gì xảy ra khi thành viên cuối cùng của nhóm muốn rời nhóm.
- Điều gì xảy ra khi một người bị xoá khỏi nhóm trong lúc đang mở sẵn cuộc trò chuyện nhóm đó.
- Điều gì xảy ra khi có nhiều sự kiện thêm, rời và xoá thành viên diễn ra liên tiếp trong thời gian ngắn.
- Điều gì xảy ra khi cuộc trò chuyện có ít hơn 10 tin nhắn nhưng người dùng vẫn mở lại lịch sử.
- Điều gì xảy ra khi người dùng kéo lên tải thêm lịch sử nhưng không còn tin nhắn cũ hơn để nạp.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST cho phép người dùng đã đăng nhập bắt đầu và sử dụng cuộc trò chuyện 1-1 với một người dùng khác.
- **FR-002**: Hệ thống MUST cho phép người dùng gửi và nhận tin nhắn trong cuộc trò chuyện 1-1.
- **FR-003**: Hệ thống MUST lưu và hiển thị lại lịch sử tin nhắn của cuộc trò chuyện 1-1 khi người dùng mở lại cuộc trò chuyện.
- **FR-004**: Hệ thống MUST mặc định tải 10 tin nhắn gần nhất khi người dùng mở lại một cuộc trò chuyện cũ.
- **FR-005**: Hệ thống MUST tải thêm 10 tin nhắn cũ hơn mỗi lần người dùng kéo lên để xem lịch sử trước đó cho đến khi không còn dữ liệu.
- **FR-006**: Hệ thống MUST cho phép tạo và sử dụng cuộc trò chuyện nhóm.
- **FR-007**: Hệ thống MUST duy trì danh sách thành viên đang hoạt động cho mỗi cuộc trò chuyện nhóm.
- **FR-008**: Hệ thống MUST ghi nhận mỗi lần một thành viên được thêm vào nhóm cùng với người được thêm, thời điểm tham gia và người thực hiện thao tác thêm khi có áp dụng.
- **FR-009**: Hệ thống MUST hiển thị các sự kiện thành viên trong nhóm để người dùng biết ai tham gia, tham gia lúc nào và ai là người thêm họ.
- **FR-010**: Hệ thống MUST cho phép thành viên hiện tại tự rời khỏi cuộc trò chuyện nhóm.
- **FR-011**: Hệ thống MUST cho phép người có quyền quản lý thành viên xoá một người khỏi cuộc trò chuyện nhóm.
- **FR-012**: Hệ thống MUST cập nhật ngay danh sách thành viên đang hoạt động sau khi xảy ra thao tác rời nhóm hoặc xoá thành viên.
- **FR-013**: Hệ thống MUST lưu các sự kiện rời nhóm và xoá thành viên trong lịch sử của nhóm.
- **FR-014**: Hệ thống MUST không cho phép người không còn là thành viên hoạt động của nhóm gửi tin nhắn mới vào nhóm đó.
- **FR-015**: Giao diện chat MUST có danh sách cuộc trò chuyện, vùng hội thoại đang mở và vùng nhập tin nhắn theo bố cục quen thuộc của ứng dụng nhắn tin.
- **FR-016**: Giao diện chat MUST phân biệt trực quan tin nhắn của người dùng hiện tại với tin nhắn từ những người khác.
- **FR-017**: Hệ thống MUST gửi dữ liệu tin nhắn từ frontend lên backend ở dạng binary thay vì văn bản thuần.
- **FR-018**: Backend MUST chuyển mỗi payload tin nhắn binary nhận được về dạng văn bản có thể đọc được trước khi chuyển tiếp vào luồng xử lý chat hiện tại.
- **FR-019**: Hệ thống MUST hiển thị trạng thái lỗi rõ ràng cho người dùng khi tin nhắn không thể được giải mã hoặc chuyển tiếp thành công.
- **FR-020**: Hệ thống MUST bảo toàn thứ tự của tin nhắn và các sự kiện thành viên trong từng cuộc trò chuyện.
- **FR-021**: Phần chat MUST hoạt động như lớp giao diện và điều phối cho luồng backend kết nối tới nhân Linux hiện tại, không thay thế cơ chế lõi đang có.

### Key Entities *(include if feature involves data)*

- **Conversation**: Không gian trao đổi giữa hai người hoặc một nhóm người, bao gồm loại cuộc trò chuyện, thành viên, lịch sử tin nhắn và lịch sử sự kiện thành viên.
- **Direct Conversation**: Cuộc trò chuyện có đúng hai thành viên đang hoạt động và hỗ trợ nhắn tin 1-1.
- **Group Conversation**: Cuộc trò chuyện có nhiều thành viên và hỗ trợ thay đổi thành viên theo thời gian.
- **Message**: Một đơn vị nội dung do người dùng gửi, bao gồm người gửi, nội dung hiển thị, thời điểm gửi, trạng thái và cuộc trò chuyện liên quan.
- **Membership Event**: Một sự kiện trong nhóm như thêm thành viên, tham gia, rời nhóm hoặc xoá thành viên, bao gồm người bị tác động, người thực hiện khi có áp dụng, thời điểm và nhóm liên quan.
- **Participant**: Người dùng có thể tham gia một hoặc nhiều cuộc trò chuyện với trạng thái thành viên hiện tại hoặc lịch sử.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trong kiểm thử sử dụng, ít nhất 90% người dùng có thể mở một cuộc trò chuyện 1-1 và gửi tin nhắn đầu tiên mà không cần hướng dẫn.
- **SC-002**: 100% cuộc trò chuyện cũ trong kịch bản kiểm thử chấp nhận mặc định hiển thị đúng 10 tin nhắn gần nhất hoặc toàn bộ lịch sử nếu cuộc trò chuyện có ít hơn 10 tin nhắn.
- **SC-003**: Trong điều kiện vận hành bình thường, ít nhất 95% lần kéo lên xem lịch sử tải thêm thành công đúng 10 tin nhắn cũ hơn trong dưới 2 giây cho đến khi hết dữ liệu.
- **SC-004**: 100% thay đổi thành viên trong nhóm được phản ánh trong lịch sử nhóm kèm người thực hiện và thời điểm xảy ra.
- **SC-005**: Ít nhất 95% người dùng trong bài kiểm thử có thể xác định đúng ai đã thêm một thành viên vào nhóm và thành viên đó tham gia lúc nào.
- **SC-006**: 100% người dùng đã rời nhóm hoặc bị xoá khỏi nhóm không thể gửi thêm tin nhắn mới vào nhóm đó.

## Assumptions

- Phần chat tái sử dụng danh tính người dùng đã đăng nhập từ phần auth hiện có thay vì tự xây dựng luồng đăng nhập riêng.
- Luồng backend kết nối tới nhân Linux hiện tại đã tồn tại và tiếp tục được dùng làm nền tảng xử lý của phần chat.
- Binary transport chỉ áp dụng cho chặng dữ liệu tin nhắn từ frontend lên backend; sau đó backend chuyển ngược về văn bản để đi tiếp trong luồng xử lý hiện tại.
- Phiên bản đầu tiên tập trung vào chat 1-1, chat nhóm, lịch sử thành viên nhóm và các thao tác rời nhóm hoặc xoá thành viên; các tính năng như gửi file, tìm kiếm lịch sử và thông báo nâng cao nằm ngoài phạm vi hiện tại.
- Giao diện chat hướng đến bố cục quen thuộc kiểu Messenger về trải nghiệm sử dụng, không yêu cầu sao chép y nguyên từng chi tiết giao diện.