# Feature Specification: Mã hoá ngược qua nhân Linux từ xa

**Feature Branch**: `008-reverse-kernel-encryption`  
**Created**: 2026-04-05  
**Status**: Draft  
**Input**: User description: "bây giờ tôi muốn tạo spec cho phần mã hoá ngược ở nhân linux thông qua phần setup port ở vps vừa rồi, tôi muốn tin nahwsn gửi lên be sẽ được mã hoá ngược sao đó lưu text mã hoá đó vào db, và khi fe lấy ra hiển thị cũng mã hoá lại sau đó mới gửi về để hiển thị ở fe, có thể tạo các key ở env example sau đó tôi sẽ tự thêm ở file .env chính. bạn tạo file spec bằng tiếng việt nhé"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lưu tin nhắn dưới dạng mã hoá ngược (Priority: P1)

Là người dùng chat, tôi muốn mọi tin nhắn gửi lên hệ thống được biến đổi bằng cơ chế mã hoá ngược thông qua dịch vụ xử lý từ xa dùng nhân Linux trước khi lưu trữ, để dữ liệu tin nhắn trong nơi lưu trữ không còn ở dạng dễ đọc.

**Why this priority**: Đây là giá trị cốt lõi của tính năng vì nó thay đổi cách hệ thống bảo vệ dữ liệu tin nhắn khi ghi nhận vào nơi lưu trữ.

**Independent Test**: Có thể kiểm thử độc lập bằng cách gửi một tin nhắn mới, xác nhận bản ghi lưu trữ không chứa nguyên văn đầu vào, và xác nhận hệ thống vẫn ghi nhận thành công tin nhắn.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập và có quyền gửi tin nhắn, **When** họ gửi một tin nhắn hợp lệ, **Then** hệ thống phải chuyển nội dung đó qua luồng mã hoá ngược trước khi lưu và chỉ lưu giá trị đã biến đổi trong nơi lưu trữ.
2. **Given** hệ thống đã lưu một tin nhắn bằng luồng mã hoá ngược, **When** quản trị viên hoặc quy trình kiểm tra xem dữ liệu lưu trữ, **Then** nội dung lưu phải là bản đã biến đổi và không trùng với văn bản người dùng đã nhập.

---

### User Story 2 - Hiển thị lại nội dung dễ đọc cho người xem (Priority: P2)

Là người dùng xem lịch sử chat, tôi muốn hệ thống khôi phục nội dung tin nhắn đã lưu về dạng hiển thị được trước khi trả dữ liệu ra giao diện, để tôi đọc được tin nhắn bình thường mà không thấy bản đã mã hoá.

**Why this priority**: Sau khi đã lưu dữ liệu dưới dạng đã biến đổi, hệ thống phải vẫn giữ được trải nghiệm đọc tin nhắn tự nhiên cho người dùng cuối.

**Independent Test**: Có thể kiểm thử độc lập bằng cách lấy lịch sử cuộc trò chuyện có chứa dữ liệu đã mã hoá ngược và xác nhận nội dung trả về cho giao diện khớp với nội dung người dùng đã gửi ban đầu.

**Acceptance Scenarios**:

1. **Given** một tin nhắn đã được lưu dưới dạng mã hoá ngược, **When** giao diện yêu cầu danh sách tin nhắn để hiển thị, **Then** hệ thống phải trả về nội dung đã được khôi phục về dạng dễ đọc cho người dùng.
2. **Given** một cuộc trò chuyện chứa cả tin nhắn cũ và mới, **When** giao diện tải lại lịch sử, **Then** mọi tin nhắn thuộc phạm vi áp dụng tính năng phải được trả về ở dạng có thể hiển thị nhất quán.

---

### User Story 3 - Vận hành cấu hình an toàn và rõ ràng (Priority: P3)

Là người vận hành hệ thống, tôi muốn có đầy đủ cấu hình mẫu cho kết nối xử lý từ xa và các giá trị bí mật liên quan trong tệp cấu hình mẫu, để tôi có thể triển khai tính năng ở các môi trường khác nhau mà không phải đoán tham số cần thiết.

**Why this priority**: Tính năng phụ thuộc vào cấu hình vận hành đúng; thiếu cấu hình mẫu sẽ làm việc bật tính năng dễ sai hoặc không thể kiểm soát được giữa các môi trường.

**Independent Test**: Có thể kiểm thử độc lập bằng cách đối chiếu tệp cấu hình mẫu với yêu cầu vận hành, sau đó cấu hình môi trường thực tế và xác nhận hệ thống khởi động thành công với luồng xử lý tin nhắn mới.

**Acceptance Scenarios**:

1. **Given** tính năng mã hoá ngược được bật cho một môi trường mới, **When** đội vận hành xem tệp cấu hình mẫu, **Then** họ phải nhìn thấy đầy đủ các khóa cấu hình cần thiết để kết nối luồng xử lý từ xa và quản lý bí mật liên quan.
2. **Given** một khóa cấu hình bắt buộc còn thiếu hoặc không hợp lệ, **When** hệ thống khởi động hoặc xử lý tin nhắn, **Then** hệ thống phải trả về lỗi rõ ràng thay vì âm thầm bỏ qua cơ chế mã hoá ngược.

### Edge Cases

- Điều gì xảy ra khi dịch vụ xử lý từ xa không khả dụng tại thời điểm người dùng gửi tin nhắn?
- Điều gì xảy ra khi hệ thống đọc lại dữ liệu tin nhắn đã lưu nhưng không thể khôi phục về dạng hiển thị?
- Điều gì xảy ra khi một cuộc trò chuyện có cả dữ liệu chưa qua mã hoá ngược từ trước và dữ liệu mới đã qua mã hoá ngược?
- Điều gì xảy ra khi nội dung tin nhắn rỗng, vượt giới hạn cho phép, hoặc chứa ký tự đặc biệt?
- Điều gì xảy ra khi khóa cấu hình bắt buộc bị thiếu ở môi trường backend hoặc frontend?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST gửi nội dung tin nhắn mới qua luồng mã hoá ngược dùng nhân Linux từ xa trước khi lưu trữ.
- **FR-002**: Hệ thống MUST chỉ lưu bản tin nhắn đã được biến đổi bởi luồng mã hoá ngược cho các tin nhắn nằm trong phạm vi áp dụng của tính năng.
- **FR-003**: Hệ thống MUST không trả trực tiếp nội dung đã mã hoá ngược cho giao diện người dùng trong các luồng hiển thị thông thường.
- **FR-004**: Hệ thống MUST khôi phục nội dung tin nhắn từ dạng đã mã hoá ngược về dạng hiển thị được trước khi trả dữ liệu cho giao diện.
- **FR-005**: Người dùng MUST nhìn thấy nội dung tin nhắn sau khi khôi phục đúng với nội dung đã gửi ban đầu trong các trường hợp xử lý thành công.
- **FR-006**: Hệ thống MUST áp dụng cùng một quy tắc xử lý cho luồng gửi mới và luồng đọc lại lịch sử để tránh hiển thị không nhất quán giữa các màn hình.
- **FR-007**: Hệ thống MUST trả về lỗi rõ ràng khi không thể mã hoá ngược hoặc khôi phục nội dung tin nhắn, và không được âm thầm lưu hoặc hiển thị dữ liệu sai trạng thái.
- **FR-008**: Hệ thống MUST cho phép đội vận hành khai báo các giá trị cấu hình bắt buộc cho tính năng trong tệp cấu hình mẫu của từng thành phần liên quan.
- **FR-009**: Hệ thống MUST cung cấp mô tả rõ ràng cho từng khóa cấu hình bắt buộc để đội vận hành có thể tự điền giá trị thật vào môi trường triển khai.
- **FR-010**: Hệ thống MUST đảm bảo dữ liệu đã lưu vẫn có thể được phân biệt về trạng thái xử lý để tránh áp dụng sai quy tắc cho dữ liệu cũ và dữ liệu mới.
- **FR-011**: Hệ thống MUST duy trì khả năng truy xuất lịch sử trò chuyện mà không buộc người dùng cuối phải thực hiện thêm thao tác thủ công nào để đọc nội dung.
- **FR-012**: Hệ thống MUST ghi nhận thất bại xử lý đủ rõ để đội vận hành có thể xác định nguyên nhân từ phía cấu hình hoặc kết nối dịch vụ xử lý từ xa.

### Key Entities *(include if feature involves data)*

- **Tin nhắn trò chuyện**: Đại diện cho một đơn vị nội dung do người dùng gửi đi; bao gồm nội dung gốc ở thời điểm nhập, nội dung đã biến đổi để lưu trữ, trạng thái xử lý và ngữ cảnh cuộc trò chuyện liên quan.
- **Bản ghi lưu trữ tin nhắn**: Đại diện cho dữ liệu tin nhắn được ghi trong hệ thống lưu trữ; cần phản ánh nội dung đã biến đổi, thời điểm tạo, nguồn gửi và trạng thái cho biết dữ liệu có thuộc cơ chế mã hoá ngược hay không.
- **Cấu hình mã hoá ngược**: Đại diện cho tập giá trị vận hành cần thiết để bật tính năng, kết nối luồng xử lý từ xa và quản lý các bí mật hoặc khóa cấu hình liên quan.
- **Kết quả hiển thị tin nhắn**: Đại diện cho dữ liệu đã được khôi phục để gửi về giao diện; phải chứa nội dung đọc được và không lộ bản lưu trữ đã biến đổi trong luồng hiển thị thông thường.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% tin nhắn mới thuộc phạm vi áp dụng được lưu dưới dạng đã biến đổi và không lưu nguyên văn nội dung người dùng vừa nhập.
- **SC-002**: 100% tin nhắn đã lưu bằng cơ chế mã hoá ngược có thể được khôi phục đúng để hiển thị cho người dùng trong các trường hợp xử lý thành công.
- **SC-003**: Ít nhất 95% yêu cầu tải lịch sử cuộc trò chuyện trả về nội dung sẵn sàng hiển thị mà không cần thao tác xử lý bổ sung từ người dùng cuối.
- **SC-004**: Khi cấu hình bắt buộc bị thiếu hoặc dịch vụ xử lý không sẵn sàng, 100% lỗi phải được phản hồi với thông điệp đủ rõ để đội vận hành xác định đây là lỗi cấu hình hoặc lỗi kết nối xử lý.
- **SC-005**: Đội vận hành có thể bật tính năng ở môi trường mới chỉ bằng cách điền các khóa trong tệp cấu hình mẫu mà không cần suy đoán thêm tên hay mục đích của từng giá trị.

## Assumptions

- Tính năng chỉ áp dụng cho các luồng tin nhắn được gửi và đọc sau khi chức năng này được bật; dữ liệu lịch sử cũ có thể cần cơ chế nhận diện riêng để tránh xử lý sai.
- Hệ thống hiện tại đã có luồng gửi tin nhắn, lưu trữ tin nhắn và trả lịch sử hội thoại cho giao diện.
- Dịch vụ xử lý từ xa qua môi trường Linux đã có thể được truy cập ổn định từ backend thông qua cấu hình vận hành phù hợp.
- Người dùng cuối không cần biết chi tiết về việc nội dung được biến đổi trước khi lưu; họ chỉ cần thấy nội dung dễ đọc khi sử dụng giao diện.
- Tệp cấu hình mẫu có thể được cập nhật để bổ sung khóa mới, nhưng giá trị thật sẽ do đội vận hành tự cung cấp ở môi trường triển khai.
