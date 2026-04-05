# Feature Specification: Xác thực bằng tài khoản thường

**Feature Branch**: `009-local-auth`  
**Created**: 2026-04-05  
**Status**: Draft  
**Input**: User description: "bạn lên spec cho phần auth bằng đnăg ký tài khoản bình thường nhé, bao gồm đnăg ký, đăng nhập nhé"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Đăng ký tài khoản mới (Priority: P1)

Người dùng mới có thể tạo tài khoản bằng thông tin cơ bản để bắt đầu sử dụng hệ thống mà không phụ thuộc vào đăng nhập Google.

**Why this priority**: Nếu không có đăng ký tài khoản thường thì người dùng chưa có tài khoản không thể tham gia hệ thống theo luồng auth mới.

**Independent Test**: Có thể kiểm thử độc lập bằng cách mở màn hình đăng ký, nhập thông tin hợp lệ và xác nhận người dùng được tạo tài khoản mới và có thể vào hệ thống.

**Acceptance Scenarios**:

1. **Given** người dùng chưa có tài khoản và nhập đầy đủ thông tin hợp lệ, **When** gửi biểu mẫu đăng ký, **Then** hệ thống tạo tài khoản mới và bắt đầu phiên đăng nhập cho người dùng đó.
2. **Given** email đã được dùng bởi tài khoản khác, **When** người dùng gửi đăng ký với email đó, **Then** hệ thống từ chối tạo tài khoản và thông báo rõ email đã tồn tại.
3. **Given** username đã được dùng bởi tài khoản khác, **When** người dùng gửi đăng ký với username đó, **Then** hệ thống từ chối tạo tài khoản và thông báo rõ username đã tồn tại.
4. **Given** người dùng nhập thiếu thông tin bắt buộc hoặc xác nhận mật khẩu không khớp, **When** gửi biểu mẫu đăng ký, **Then** hệ thống không tạo tài khoản và hiển thị lỗi tương ứng để người dùng sửa lại.

---

### User Story 2 - Đăng nhập bằng tài khoản thường (Priority: P2)

Người dùng đã có tài khoản thường có thể đăng nhập lại bằng thông tin đăng nhập của mình để truy cập hệ thống.

**Why this priority**: Sau khi có đăng ký, đăng nhập là bước cần thiết để người dùng quay lại hệ thống mà không phải tạo tài khoản mới.

**Independent Test**: Có thể kiểm thử độc lập bằng cách dùng tài khoản đã tồn tại, nhập thông tin đăng nhập hợp lệ và xác nhận người dùng vào được hệ thống với phiên đăng nhập mới.

**Acceptance Scenarios**:

1. **Given** người dùng đã có tài khoản thường hợp lệ, **When** nhập đúng thông tin đăng nhập và gửi biểu mẫu, **Then** hệ thống đăng nhập thành công và chuyển người dùng vào khu vực đã bảo vệ.
2. **Given** người dùng nhập sai thông tin đăng nhập, **When** gửi biểu mẫu đăng nhập, **Then** hệ thống từ chối đăng nhập và hiển thị thông báo thất bại rõ ràng mà không tiết lộ dữ liệu nhạy cảm.
3. **Given** tài khoản đã bị vô hiệu hóa hoặc không còn hợp lệ, **When** người dùng cố đăng nhập, **Then** hệ thống chặn truy cập và trả về thông báo phù hợp.

---

### User Story 3 - Chuyển đổi rõ ràng giữa các cách đăng nhập (Priority: P3)

Người dùng có thể nhìn thấy và chọn rõ ràng giữa đăng nhập bằng tài khoản thường và các cách đăng nhập đã có sẵn để không bị nhầm luồng truy cập.

**Why this priority**: Khi hệ thống có nhiều cách đăng nhập, giao diện rõ ràng giúp giảm nhầm lẫn và tăng tỷ lệ hoàn thành đăng nhập thành công.

**Independent Test**: Có thể kiểm thử độc lập bằng cách mở màn hình auth, xác nhận người dùng nhìn thấy lựa chọn đăng ký/đăng nhập thường và có thể chuyển qua lại đúng trạng thái mà không mất ngữ cảnh cần thiết.

**Acceptance Scenarios**:

1. **Given** người dùng mở màn hình xác thực, **When** muốn tạo tài khoản mới, **Then** người dùng thấy rõ đường dẫn sang luồng đăng ký tài khoản thường.
2. **Given** người dùng đang ở luồng đăng ký, **When** đã có tài khoản và muốn đăng nhập, **Then** người dùng có thể chuyển sang luồng đăng nhập mà không bị nhầm chức năng.
3. **Given** hệ thống vẫn hỗ trợ cách đăng nhập cũ, **When** người dùng truy cập màn hình xác thực, **Then** các lựa chọn đăng nhập được trình bày rõ ràng và không gây hiểu lầm về tác dụng của từng lựa chọn.

### Edge Cases

- Người dùng gửi biểu mẫu với khoảng trắng thừa ở email, username hoặc tên hiển thị thì hệ thống cần chuẩn hóa hợp lý trước khi kiểm tra trùng lặp hoặc lưu dữ liệu.
- Người dùng nhập email đúng định dạng nhìn giống nhau nhưng khác chữ hoa/chữ thường thì hệ thống cần xử lý nhất quán để tránh tạo trùng tài khoản.
- Người dùng thử đăng nhập bằng tài khoản được tạo theo phương thức khác nhưng chưa có thông tin đăng nhập thường thì hệ thống phải trả thông báo rõ ràng thay vì đăng nhập sai luồng.
- Người dùng làm mới trang hoặc rời màn hình giữa lúc đang nhập biểu mẫu thì hệ thống không được tự tạo tài khoản hoặc tạo phiên đăng nhập dở dang.
- Người dùng gửi biểu mẫu nhiều lần liên tiếp do mạng chậm thì hệ thống không được tạo trùng nhiều tài khoản cho cùng một thông tin hợp lệ.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST cho phép người dùng tạo tài khoản thường bằng ít nhất email, username, tên hiển thị và mật khẩu.
- **FR-002**: System MUST yêu cầu người dùng xác nhận mật khẩu khi đăng ký và từ chối nếu hai giá trị không khớp.
- **FR-003**: System MUST kiểm tra tính hợp lệ của các trường bắt buộc trước khi tạo tài khoản.
- **FR-004**: System MUST từ chối đăng ký nếu email đã thuộc về một tài khoản hiện có.
- **FR-005**: System MUST từ chối đăng ký nếu username đã thuộc về một tài khoản hiện có.
- **FR-006**: System MUST tạo hồ sơ người dùng mới với trạng thái có thể đăng nhập sau khi đăng ký thành công.
- **FR-007**: System MUST cho phép người dùng đăng nhập bằng thông tin đăng nhập của tài khoản thường đã tồn tại.
- **FR-008**: System MUST bắt đầu phiên đăng nhập hợp lệ sau khi người dùng đăng ký thành công hoặc đăng nhập thành công.
- **FR-009**: System MUST từ chối đăng nhập khi thông tin đăng nhập không đúng và trả về thông báo lỗi chung, không tiết lộ trường nào sai.
- **FR-010**: System MUST ngăn người dùng đã bị vô hiệu hóa hoặc không còn hợp lệ đăng nhập vào hệ thống.
- **FR-011**: System MUST cung cấp giao diện rõ ràng để người dùng chuyển giữa luồng đăng ký tài khoản thường và luồng đăng nhập tài khoản thường.
- **FR-012**: System MUST thể hiện rõ sự khác biệt giữa đăng nhập tài khoản thường và các phương thức đăng nhập khác đang tồn tại trong hệ thống.
- **FR-013**: System MUST ghi nhận các lần đăng ký thất bại và đăng nhập thất bại để phục vụ theo dõi và xử lý vận hành.
- **FR-014**: System MUST giữ nguyên trải nghiệm đăng nhập hiện có cho những người dùng không sử dụng tài khoản thường.

### Key Entities *(include if feature involves data)*

- **Tài khoản thường**: Đại diện cho một người dùng có thể đăng ký và đăng nhập bằng thông tin tự tạo, bao gồm email, username, tên hiển thị, trạng thái tài khoản và thông tin xác thực dùng cho đăng nhập thường.
- **Thông tin đăng nhập**: Đại diện cho tập dữ liệu mà người dùng nhập để đăng ký hoặc đăng nhập, bao gồm các trường nhận diện, bí mật xác thực và trạng thái hợp lệ của từng lần gửi.
- **Phiên đăng nhập**: Đại diện cho quyền truy cập đang có hiệu lực sau khi xác thực thành công, gắn với một người dùng và có thời điểm bắt đầu, hết hạn hoặc bị thu hồi.
- **Bản ghi nỗ lực xác thực**: Đại diện cho mỗi lần đăng ký hoặc đăng nhập thành công/thất bại, phục vụ quan sát vận hành và điều tra sự cố.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng mới có thể hoàn tất đăng ký tài khoản thường và vào được hệ thống trong dưới 3 phút ở luồng bình thường.
- **SC-002**: Ít nhất 95% lần đăng ký với dữ liệu hợp lệ tạo tài khoản thành công ngay ở lần gửi đầu tiên.
- **SC-003**: Ít nhất 95% lần đăng nhập với thông tin hợp lệ đưa người dùng vào khu vực đã bảo vệ mà không cần thử lại.
- **SC-004**: 100% trường hợp email hoặc username trùng được chặn trước khi tạo tài khoản mới.
- **SC-005**: 100% trường hợp đăng nhập sai thông tin trả về thông báo thất bại an toàn, không làm lộ dữ liệu xác thực nhạy cảm.

## Assumptions

- Hệ thống sẽ tiếp tục hỗ trợ phương thức đăng nhập Google hiện có song song với tài khoản thường trong giai đoạn đầu.
- Luồng đầu tiên chỉ bao gồm đăng ký và đăng nhập; các chức năng như quên mật khẩu, xác minh email hoặc đổi mật khẩu chưa nằm trong phạm vi spec này.
- Người dùng tài khoản thường vẫn sử dụng cùng khu vực ứng dụng và cùng cơ chế duy trì phiên như các người dùng đã xác thực bằng phương thức khác.
- Hệ thống đã có nơi lưu hồ sơ người dùng và bản ghi xác thực, nên tính năng mới sẽ mở rộng trên nền trải nghiệm xác thực hiện có thay vì tạo sản phẩm tách biệt.