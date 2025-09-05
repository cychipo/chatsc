# Đặc tả tính năng: Gửi tin nhắn qua Socket

**Nhánh tính năng**: `006-socket-chat`  
**Ngày tạo**: 2026-04-05  
**Trạng thái**: Draft  
**Đầu vào**: Mô tả người dùng: "bây giờ tôi muốn tạo spec cho phần gửi tin nhắn qua socket thay vì resfulapI, bạn tạo giúp tôi nhé"

## Kịch bản người dùng & Kiểm thử *(bắt buộc)*

### User Story 1 - Gửi tin nhắn tức thời trong cuộc trò chuyện đang mở (Ưu tiên: P1)

Là một người dùng đã đăng nhập, tôi muốn tin nhắn mình gửi trong cuộc trò chuyện được truyền qua một kết nối thời gian thực liên tục để không phải phụ thuộc vào việc gửi request-response riêng cho từng tin nhắn.

**Lý do ưu tiên**: Gửi tin nhắn là hành động cốt lõi của chat. Nếu chưa có phần này, trải nghiệm trò chuyện vẫn bị chậm và không đúng với kỳ vọng của người dùng đối với một ứng dụng nhắn tin.

**Kiểm thử độc lập**: Mở một cuộc trò chuyện có sẵn, gửi một tin nhắn từ một client, và xác nhận rằng tin nhắn xuất hiện ngay trong cuộc trò chuyện mà không cần tải lại trang hoặc làm mới thủ công.

**Kịch bản chấp nhận**:

1. **Cho trước** một người dùng đã đăng nhập đang kết nối vào chat và đang mở một cuộc trò chuyện, **Khi** người dùng gửi một tin nhắn, **Thì** tin nhắn được chấp nhận qua kết nối thời gian thực và xuất hiện ngay trong cuộc trò chuyện.
2. **Cho trước** một người dùng đã đăng nhập gửi một tin nhắn không rỗng từ khung soạn thảo, **Khi** việc gửi thành công, **Thì** tin nhắn chỉ xuất hiện một lần trong cuộc trò chuyện và khung soạn thảo được xóa nội dung.
3. **Cho trước** một người dùng đã đăng nhập cố gửi một tin nhắn rỗng, **Khi** hành động gửi được kích hoạt, **Thì** hệ thống từ chối tin nhắn và không thay đổi nội dung cuộc trò chuyện.

---

### User Story 2 - Nhận tin nhắn thời gian thực từ người tham gia khác (Ưu tiên: P2)

Là một người tham gia cuộc trò chuyện, tôi muốn nhận tin nhắn đến ngay khi người khác gửi để có thể theo dõi cuộc trò chuyện theo thời gian thực mà không cần làm mới trang.

**Lý do ưu tiên**: Nhận tin nhắn theo thời gian thực là giá trị chính khi chuyển từ mô hình request-response sang kết nối trực tiếp.

**Kiểm thử độc lập**: Mở cùng một cuộc trò chuyện trên hai phiên hoạt động khác nhau, gửi một tin nhắn từ một phiên, và xác nhận rằng phiên còn lại hiển thị tin nhắn mới ngay trong cuộc trò chuyện đang mở mà không cần làm mới thủ công.

**Kịch bản chấp nhận**:

1. **Cho trước** hai người dùng đang kết nối vào cùng một cuộc trò chuyện, **Khi** một người gửi tin nhắn, **Thì** người còn lại thấy tin nhắn xuất hiện ngay trong cuộc trò chuyện đó.
2. **Cho trước** một người dùng đang xem danh sách cuộc trò chuyện thay vì khung chat đang mở, **Khi** có tin nhắn mới đến trong một cuộc trò chuyện mà họ tham gia, **Thì** phần preview và thứ tự cuộc trò chuyện được cập nhật mà không cần tải lại trang.

---

### User Story 3 - Khôi phục ổn định khi kết nối bị gián đoạn (Ưu tiên: P3)

Là một người dùng đã đăng nhập, tôi muốn trải nghiệm chat có thể tự phục hồi khi kết nối thời gian thực bị gián đoạn tạm thời để các lỗi mạng ngắn không bắt tôi phải mở lại ứng dụng hoặc làm tôi mất niềm tin vào việc gửi tin nhắn.

**Lý do ưu tiên**: Chat thời gian thực chỉ đáng tin cậy khi người dùng hiểu được trạng thái kết nối và có thể tiếp tục sử dụng sau gián đoạn ngắn.

**Kiểm thử độc lập**: Ngắt kết nối client trong lúc đang chat, khôi phục mạng, và xác nhận rằng người dùng có thể kết nối lại và tiếp tục gửi tin nhắn mà không cần mở lại ứng dụng.

**Kịch bản chấp nhận**:

1. **Cho trước** một người dùng bị mất kết nối mạng trong lúc đang chat, **Khi** kết nối thời gian thực bị ngắt, **Thì** người dùng được thông báo rằng chat đang tạm thời mất kết nối.
2. **Cho trước** kết nối mạng khả dụng trở lại, **Khi** client kết nối lại thành công, **Thì** người dùng có thể tiếp tục gửi tin nhắn trong các cuộc trò chuyện mình đang tham gia.
3. **Cho trước** một người dùng cố gửi tin nhắn khi kết nối thời gian thực chưa khả dụng, **Khi** hành động gửi xảy ra, **Thì** hệ thống phải hiển thị rõ trạng thái thất bại và không được làm mất tin nhắn một cách âm thầm.

---

### Trường hợp biên

- Điều gì xảy ra khi người dùng mở một cuộc trò chuyện trước khi kết nối thời gian thực được thiết lập hoàn toàn?
- Hệ thống xử lý thế nào khi người dùng không còn là thành viên hoạt động của cuộc trò chuyện nhưng vẫn đang mở màn hình chat?
- Điều gì xảy ra khi cùng một người dùng có nhiều phiên hoạt động cùng kết nối vào một cuộc trò chuyện?
- Hệ thống xử lý thế nào với các lần gửi trùng lặp do reconnect hoặc do người dùng bấm gửi nhiều lần?
- Điều gì xảy ra khi có tin nhắn mới đến cho một cuộc trò chuyện hiện không được chọn?

## Yêu cầu *(bắt buộc)*

### Yêu cầu chức năng

- **FR-001**: Hệ thống PHẢI cho phép người dùng đã đăng nhập gửi tin nhắn chat qua một kết nối thời gian thực liên tục thay vì phụ thuộc vào mô hình gửi request-response cho từng tin nhắn.
- **FR-002**: Hệ thống CHỈ được chấp nhận việc gửi tin nhắn từ những người dùng đang là thành viên hoạt động của cuộc trò chuyện đích.
- **FR-003**: Người dùng PHẢI có thể gửi tin nhắn từ khung soạn thảo bằng nút gửi hoặc phím Enter, đồng thời vẫn giữ Shift+Enter để xuống dòng.
- **FR-004**: Hệ thống PHẢI chuyển tin nhắn mới đến tất cả người tham gia hiện đang kết nối trong cùng cuộc trò chuyện mà không yêu cầu tải lại trang.
- **FR-005**: Hệ thống PHẢI cập nhật ngay khung trò chuyện đang mở sau khi tin nhắn được gửi thành công.
- **FR-006**: Hệ thống PHẢI cập nhật phần preview và thứ tự của cuộc trò chuyện khi có tin nhắn mới đến trong một cuộc trò chuyện mà người dùng có quyền truy cập.
- **FR-007**: Hệ thống PHẢI từ chối các tin nhắn rỗng hoặc chỉ chứa khoảng trắng trước khi thực hiện gửi.
- **FR-008**: Hệ thống PHẢI hiển thị rõ cho người gửi khi việc gửi thất bại hoặc tin nhắn không được chấp nhận.
- **FR-009**: Hệ thống PHẢI cho biết khi kết nối chat thời gian thực không khả dụng và khi kết nối đó hoạt động trở lại.
- **FR-010**: Hệ thống PHẢI cho phép người dùng tiếp tục hoạt động chat sau khi bị mất kết nối tạm thời mà không cần tải lại toàn bộ ứng dụng.
- **FR-011**: Hệ thống PHẢI ngăn việc một tin nhắn đã được gửi thành công bị hiển thị lặp lại nhiều lần trong cùng một phiên client.
- **FR-012**: Hệ thống PHẢI giữ nguyên các quy tắc hiện có về quyền truy cập cuộc trò chuyện và tư cách thành viên khi gửi và nhận tin nhắn.

### Thực thể chính *(nếu tính năng có dữ liệu)*

- **Phiên chat thời gian thực**: Đại diện cho trạng thái kết nối hoạt động của một người dùng đã xác thực, bao gồm các trạng thái như đang kết nối, bị ngắt kết nối, hoặc đang kết nối lại.
- **Tin nhắn cuộc trò chuyện**: Đại diện cho một tin nhắn đã được chuyển thành công, gắn với cuộc trò chuyện, người gửi, thời điểm gửi, và trạng thái hiển thị cho người tham gia.
- **Đăng ký nhận cuộc trò chuyện**: Đại diện cho mối quan hệ giữa một phiên client thời gian thực và các cuộc trò chuyện mà phiên đó được phép nhận cập nhật.

## Tiêu chí thành công *(bắt buộc)*

### Kết quả đo lường được

- **SC-001**: Trong cuộc trò chuyện đang hoạt động, người dùng thấy tin nhắn mình gửi thành công xuất hiện trong khung chat trong dưới 1 giây ở điều kiện mạng bình thường.
- **SC-002**: Trong cuộc trò chuyện đang hoạt động với hai người tham gia cùng kết nối, 95% tin nhắn mới xuất hiện với người nhận trong dưới 1 giây ở điều kiện mạng bình thường.
- **SC-003**: 100% các lần cố gửi tin nhắn rỗng bị từ chối mà không tạo ra mục chat hiển thị nào.
- **SC-004**: Sau một lần mất kết nối tạm thời ngắn hơn 30 giây, người dùng có thể tiếp tục gửi tin nhắn mà không cần tải lại ứng dụng.
- **SC-005**: Trong kiểm thử xác nhận, không có tin nhắn nào đã được gửi thành công bị hiển thị nhiều hơn một lần trong cùng một phiên client cho một lần gửi duy nhất.

## Giả định

- Hệ thống xác thực hiện có và quy tắc thành viên của cuộc trò chuyện tiếp tục là nguồn sự thật để quyết định ai được quyền gửi và nhận tin nhắn.
- Cơ chế tải lịch sử tin nhắn hiện có vẫn tiếp tục được sử dụng cho việc đọc lại tin nhắn cũ; tính năng này chỉ thay đổi cách truyền tin nhắn theo thời gian thực.
- Phạm vi ban đầu chỉ bao gồm trải nghiệm chat trên trình duyệt trong ứng dụng hiện tại.
- Việc tạo cuộc trò chuyện, tìm kiếm người dùng, và quản lý danh sách cuộc trò chuyện vẫn thuộc luồng chat hiện có và không bị định nghĩa lại trong tính năng này.
