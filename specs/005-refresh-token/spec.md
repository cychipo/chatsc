# Feature Specification: Gia hạn Refresh Token

**Feature Branch**: `[005-refresh-token]`  
**Created**: 2026-04-04  
**Status**: Draft  
**Input**: User description: "bạn tạo cho tôi spec cho phần refresh token cho hệ thống này giúp tôi nhé , token chính sẽ hết hạn trong 30p, refresh token sẽ là 1 tuần, khi call api mà hết hạn token sẽ tự call api để lấy refresh token và trả về token mới sau đó call lại api bị lỗi đó"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tiếp tục sử dụng sau khi gia hạn phiên (Priority: P1)

Với vai trò là người dùng đã đăng nhập, tôi muốn phiên của mình được tự động gia hạn khi access token chính hết hạn để tôi có thể tiếp tục sử dụng các tính năng được bảo vệ mà không bị buộc đăng nhập lại trong quá trình sử dụng bình thường.

**Why this priority**: Đây là giá trị cốt lõi của tính năng. Nếu không có cơ chế gia hạn tự động, người dùng sẽ bị gián đoạn ngay giữa quá trình sử dụng sản phẩm bình thường.

**Independent Test**: Có thể kiểm thử độc lập bằng cách sử dụng sản phẩm với access token chính đã hết hạn nhưng refresh token vẫn còn hiệu lực, sau đó xác nhận hành động được bảo vệ ban đầu vẫn hoàn tất thành công mà không cần đăng nhập lại thủ công.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập có refresh token hợp lệ và access token chính đã hết hạn, **When** người dùng thực hiện một hành động được bảo vệ, **Then** hệ thống gia hạn phiên ở chế độ nền, trả về access token chính mới và hoàn tất thành công hành động ban đầu.
2. **Given** người dùng đã đăng nhập có refresh token hợp lệ và access token chính đã hết hạn, **When** request được bảo vệ đầu tiên thất bại vì access token chính đã hết hạn, **Then** người dùng vẫn duy trì trạng thái đăng nhập và không cần thực hiện lại thao tác đó thủ công.

---

### User Story 2 - Đăng nhập lại khi refresh token hết hạn (Priority: P2)

Với vai trò là người dùng đã đăng nhập, tôi muốn hệ thống kết thúc phiên của tôi một cách rõ ràng khi cả hai token đều không còn hợp lệ để tôi biết mình cần đăng nhập lại thay vì gặp các lỗi request lặp đi lặp lại.

**Why this priority**: Người dùng cần một trải nghiệm kết thúc phiên rõ ràng, dễ đoán và an toàn khi không còn được phép gia hạn nữa.

**Independent Test**: Có thể kiểm thử độc lập bằng cách sử dụng sản phẩm khi cả hai token đều đã hết hạn và xác nhận người dùng bị đăng xuất hoặc được chuyển tới màn hình đăng nhập, đồng thời hành động được bảo vệ bị lỗi sẽ không bị retry vô hạn.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập có access token chính đã hết hạn và refresh token đã hết hạn, **When** người dùng thực hiện một hành động được bảo vệ, **Then** hệ thống không gia hạn phiên mà thay vào đó yêu cầu người dùng đăng nhập lại.
2. **Given** việc gia hạn phiên thất bại vì refresh token không hợp lệ, đã hết hạn hoặc bị thu hồi, **When** request được bảo vệ không thể được khôi phục, **Then** hệ thống xóa trạng thái phiên đã xác thực của người dùng và cung cấp đường dẫn rõ ràng để xác thực lại.

---

### User Story 3 - Duy trì quy tắc phiên nhất quán (Priority: P3)

Với vai trò là product owner, tôi muốn thời hạn hiệu lực của token được áp dụng nhất quán để thời lượng phiên có thể dự đoán được đối với người dùng và phù hợp với chính sách bảo mật mong muốn.

**Why this priority**: Hành vi hết hạn nhất quán là cần thiết để cân bằng giữa tính tiện lợi và bảo mật phiên.

**Independent Test**: Có thể kiểm thử độc lập bằng cách cấp mới thông tin xác thực, theo dõi khoảng thời gian hiệu lực của chúng, và xác nhận rằng access token chính ngừng hoạt động sau 30 phút trong khi refresh token ngừng cho phép gia hạn sau 7 ngày.

**Acceptance Scenarios**:

1. **Given** một access token chính vừa được cấp, **When** đã trôi qua 30 phút, **Then** hệ thống xem token đó là hết hạn đối với truy cập được bảo vệ.
2. **Given** một refresh token vừa được cấp, **When** đã trôi qua 7 ngày, **Then** hệ thống không còn cho phép gia hạn phiên bằng token đó.

### Edge Cases

- Điều gì xảy ra khi nhiều request được bảo vệ được gửi đồng thời sau khi access token chính đã hết hạn? Hệ thống cần tránh tạo ra các lần gia hạn xung đột nhau và phải khôi phục các request đang chờ một cách nhất quán.
- Hệ thống xử lý thế nào nếu một lần gia hạn thành công nhưng request ban đầu được retry vẫn thất bại vì một lý do khác? Người dùng cần nhìn thấy lỗi nghiệp vụ hoặc lỗi validation thực sự của hành động ban đầu.
- Điều gì xảy ra khi người dùng đăng xuất trong lúc quá trình gia hạn đang diễn ra? Hệ thống không được khôi phục lại trạng thái đã đăng nhập sau khi người dùng đã đăng xuất.
- Hệ thống xử lý thế nào khi refresh token bị thu hồi hoặc không còn hợp lệ trước mốc 7 ngày? Phiên phải kết thúc ngay lập tức và yêu cầu người dùng đăng nhập lại.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống PHẢI cấp access token chính với thời hạn hiệu lực là 30 phút sau khi xác thực thành công.
- **FR-002**: Hệ thống PHẢI cấp refresh token với thời hạn hiệu lực là 7 ngày sau khi xác thực thành công.
- **FR-003**: Hệ thống PHẢI cung cấp cách để người dùng đã đăng nhập yêu cầu access token chính mới bằng cách gửi refresh token hợp lệ.
- **FR-004**: Hệ thống PHẢI từ chối các request được bảo vệ được thực hiện bằng access token chính đã hết hạn cho đến khi phiên được gia hạn.
- **FR-005**: Khi một request được bảo vệ thất bại chỉ vì access token chính đã hết hạn và refresh token vẫn còn hợp lệ, hệ thống PHẢI tự động thử gia hạn phiên mà không yêu cầu người dùng thao tác.
- **FR-006**: Khi việc tự động gia hạn phiên thành công, hệ thống PHẢI cung cấp access token chính mới và retry request được bảo vệ ban đầu đúng một lần.
- **FR-007**: Request được bảo vệ được retry trong luồng khôi phục PHẢI giữ nguyên mục đích ban đầu và dữ liệu mà người dùng đã gửi.
- **FR-008**: Nếu việc tự động gia hạn phiên thất bại vì refresh token bị thiếu, không hợp lệ, đã hết hạn hoặc bị thu hồi, hệ thống PHẢI dừng retry request được bảo vệ và yêu cầu người dùng đăng nhập lại.
- **FR-009**: Hệ thống PHẢI bảo đảm việc tự động gia hạn chỉ được kích hoạt cho các lỗi hết hạn xác thực và không áp dụng cho các lỗi request không liên quan.
- **FR-010**: Hệ thống PHẢI ngăn chặn vòng lặp gia hạn hoặc retry vô hạn cho cùng một hành động được bảo vệ.
- **FR-011**: Hệ thống PHẢI thay thế access token chính đang được lưu của người dùng bằng access token chính mới được cấp sau khi gia hạn thành công.
- **FR-012**: Hệ thống PHẢI duy trì tính liên tục của phiên đã xác thực cho người dùng khi việc gia hạn thành công mà không làm gián đoạn việc sử dụng bình thường các tính năng được bảo vệ.
- **FR-013**: Hệ thống PHẢI ghi nhận kết quả gia hạn phiên theo cách cho phép quản trị viên xem lại các sự kiện gia hạn thành công và thất bại.

### Key Entities *(include if feature involves data)*

- **Main Access Token**: Thông tin xác thực có thời gian sống ngắn, được dùng để cho phép các request được bảo vệ trong tối đa 30 phút.
- **Refresh Token**: Thông tin xác thực có thời gian sống dài hơn, được dùng để lấy access token chính mới trong tối đa 7 ngày trừ khi mất hiệu lực sớm hơn.
- **Authenticated Session**: Trạng thái đăng nhập hiện tại của người dùng, bao gồm việc các hành động được bảo vệ có thể tiếp tục, được gia hạn, hay yêu cầu xác thực lại.
- **Protected Request Attempt**: Một hành động do người dùng khởi tạo cần phiên đã xác thực hợp lệ và có thể được retry đúng một lần sau khi gia hạn thành công.
- **Session Renewal Event**: Kết quả được ghi nhận cho biết một lần thử gia hạn thành công hay thất bại và lý do tương ứng.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ít nhất 95% các hành động được bảo vệ của người dùng được thực hiện với access token chính đã hết hạn nhưng refresh token vẫn hợp lệ sẽ hoàn tất thành công ngay trong lần thao tác đó mà không yêu cầu đăng nhập lại thủ công.
- **SC-002**: 100% các hành động được bảo vệ được thực hiện khi cả hai token đều không còn hợp lệ phải yêu cầu xác thực lại thay vì để người dùng rơi vào trạng thái nửa đăng nhập, nửa lỗi không rõ ràng.
- **SC-003**: 100% các phiên được gia hạn phải nhận được access token chính thay thế còn hiệu lực 30 phút kể từ thời điểm cấp mới, và 100% refresh token phải hết hạn sau 7 ngày trừ khi bị vô hiệu hóa sớm hơn.
- **SC-004**: 100% các luồng khôi phục tự động chỉ được retry hành động được bảo vệ bị lỗi tối đa một lần.
- **SC-005**: Số lượng yêu cầu hỗ trợ liên quan đến việc bị đăng xuất ngoài ý muốn trong quá trình sử dụng bình thường phải giảm ít nhất 30% trong 30 ngày đầu sau khi phát hành so với 30 ngày trước khi phát hành.

## Assumptions

- Hành vi đăng nhập hiện tại vẫn được giữ nguyên; tính năng này chỉ bổ sung cơ chế gia hạn phiên sau khi xác thực đã thành công.
- Tính năng này áp dụng cho các hành động được bảo vệ của sản phẩm phụ thuộc vào phiên đăng nhập hiện tại.
- Có thể phân biệt request được bảo vệ thất bại do token hết hạn với các lỗi gây ra bởi quyền truy cập, validation hoặc tính sẵn sàng của dịch vụ.
- Khi không thể gia hạn nữa, người dùng nên được yêu cầu đăng nhập lại thay vì tiếp tục ở trạng thái phiên đã xác thực nhưng bị suy giảm chức năng.
- Refresh token có thể mất hiệu lực trước mốc 7 ngày nếu hệ thống kết thúc phiên vì lý do bảo mật hoặc quản lý tài khoản.
