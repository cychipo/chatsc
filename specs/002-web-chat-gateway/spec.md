# Feature Specification: Web Google Auth

**Feature Branch**: `[002-web-chat-gateway]`  
**Created**: 2026-04-04  
**Status**: Draft  
**Input**: User description: "bạn tạo spec cho case này giúp tôi nhé"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Đăng nhập bằng Google vào website (Priority: P1)

Người dùng có thể dùng tài khoản Google để đăng nhập từ giao diện web và truy cập được vào khu vực ứng dụng sau khi xác thực thành công.

**Why this priority**: Đây là luồng cốt lõi của phần auth. Nếu không đăng nhập được thì người dùng không thể sử dụng các phần chức năng còn lại của website.

**Independent Test**: Có thể kiểm thử độc lập bằng cách dùng một tài khoản Google hợp lệ đăng nhập từ web và xác nhận hệ thống tạo trạng thái truy cập hợp lệ.

**Acceptance Scenarios**:

1. **Given** người dùng chọn đăng nhập bằng Google với một tài khoản hợp lệ, **When** quá trình xác thực hoàn tất thành công, **Then** hệ thống cho phép họ truy cập vào khu vực ứng dụng dành cho người đã đăng nhập.
2. **Given** người dùng hủy hoặc không hoàn tất quá trình xác thực Google, **When** họ quay lại website, **Then** hệ thống không tạo phiên truy cập và hiển thị thông báo đăng nhập thất bại.

---

### User Story 2 - Tạo hồ sơ người dùng từ email Google (Priority: P2)

Người dùng đăng nhập lần đầu bằng Google sẽ được tạo hồ sơ sử dụng cho hệ thống, trong đó username được suy ra từ phần đứng trước ký tự @ trong email Google của họ.

**Why this priority**: Người dùng mới cần có danh tính nhất quán trong hệ thống mà không phải thực hiện bước đăng ký riêng, nhưng vẫn xếp sau đăng nhập vì giá trị đầu tiên là xác thực thành công.

**Independent Test**: Có thể kiểm thử độc lập bằng cách đăng nhập lần đầu với email Google mới và xác nhận hệ thống tạo hồ sơ thành công với username đúng theo quy tắc suy ra từ email.

**Acceptance Scenarios**:

1. **Given** người dùng đăng nhập lần đầu bằng email Google chưa tồn tại trong hệ thống, **When** quá trình xác thực hoàn tất, **Then** hệ thống tạo hồ sơ mới và gán username bằng phần trước ký tự @ của email đó.
2. **Given** người dùng đăng nhập bằng email `abc.123@gmail.com`, **When** hồ sơ được tạo hoặc nạp lại, **Then** username hiển thị trong hệ thống là `abc.123`.

---

### User Story 3 - Duy trì phiên truy cập hợp lệ (Priority: P3)

Người dùng đã đăng nhập có thể tiếp tục sử dụng website trong cùng một phiên truy cập cho đến khi đăng xuất, hết hạn hoặc xác thực không còn hợp lệ.

**Why this priority**: Đây là phần cần thiết để trải nghiệm đăng nhập dùng được trong thực tế, nhưng chỉ có ý nghĩa sau khi đăng nhập và tạo hồ sơ đã hoạt động.

**Independent Test**: Có thể kiểm thử độc lập bằng cách đăng nhập thành công, tải lại trang trong thời gian phiên còn hiệu lực và xác nhận người dùng vẫn ở trạng thái đã đăng nhập.

**Acceptance Scenarios**:

1. **Given** người dùng đã đăng nhập thành công, **When** họ tải lại website trong thời gian phiên còn hiệu lực, **Then** hệ thống vẫn nhận diện họ là người dùng đã đăng nhập.
2. **Given** phiên truy cập không còn hợp lệ, **When** người dùng mở lại website hoặc thực hiện thao tác yêu cầu xác thực, **Then** hệ thống yêu cầu họ đăng nhập lại.

---

### Edge Cases

- Điều gì xảy ra khi người dùng hủy đăng nhập Google giữa chừng hoặc không cấp đủ thông tin tài khoản cần thiết.
- Điều gì xảy ra khi Google xác thực thành công nhưng hệ thống không tạo được hồ sơ người dùng.
- Điều gì xảy ra khi hai người dùng khác nhau có phần trước ký tự @ trong email trùng nhau và cùng cần một username duy nhất trong hệ thống.
- Điều gì xảy ra khi phiên truy cập hết hạn trong lúc người dùng đang sử dụng website.
- Điều gì xảy ra khi người dùng cố truy cập khu vực yêu cầu đăng nhập nhưng chưa có phiên hợp lệ.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST cung cấp giao diện web để người dùng đăng nhập bằng Google.
- **FR-002**: Hệ thống MUST chỉ chấp nhận cơ chế đăng nhập bằng Google cho người dùng cuối trong phạm vi tính năng này.
- **FR-003**: Hệ thống MUST xác thực thông tin đăng nhập Google trước khi cho phép người dùng truy cập khu vực dành cho người đã đăng nhập.
- **FR-004**: Hệ thống MUST tạo hồ sơ người dùng khi một tài khoản Google hợp lệ đăng nhập lần đầu và chưa tồn tại trong hệ thống.
- **FR-005**: Hệ thống MUST suy ra username từ phần đứng trước ký tự @ trong email Google của người dùng.
- **FR-006**: Hệ thống MUST xử lý trường hợp username suy ra từ email không thể dùng trực tiếp trong hệ thống theo một quy tắc nhất quán và có thể dự đoán được.
- **FR-007**: Hệ thống MUST duy trì trạng thái truy cập hợp lệ trong suốt phiên sử dụng website cho đến khi người dùng đăng xuất, hết hạn hoặc mất hiệu lực xác thực.
- **FR-008**: Hệ thống MUST chỉ cho phép người dùng đã xác thực mở và sử dụng các khu vực yêu cầu đăng nhập.
- **FR-009**: Hệ thống MUST thông báo rõ ràng cho người dùng khi đăng nhập thất bại, tạo hồ sơ thất bại hoặc phiên truy cập không còn hợp lệ.
- **FR-010**: Hệ thống MUST cho phép người dùng đăng xuất và chấm dứt trạng thái truy cập hiện tại.
- **FR-011**: Giải pháp MUST tổ chức mã nguồn web thành hai ứng dụng riêng biệt trong hai thư mục `backend` và `frontend`.
- **FR-012**: Ứng dụng backend MUST sử dụng NestJS làm nền tảng dịch vụ, MongoDB làm nơi lưu trữ dữ liệu người dùng và Mongoose làm lớp ánh xạ dữ liệu.
- **FR-013**: Ứng dụng frontend MUST sử dụng React và Vite cho giao diện web, Ant Design cho thành phần giao diện, Zustand cho quản lý trạng thái phía người dùng và Axios 1.12 cho giao tiếp yêu cầu dữ liệu.
- **FR-014**: Giao diện frontend MUST áp dụng theme glassstyle dựa trên Ant Design cho các thành phần giao diện chính của ứng dụng.
- **FR-015**: Theme glassstyle MUST được cấu hình theo mẫu thư viện mà người dùng đã cung cấp, bao gồm hiệu ứng nền mờ, viền kính, tùy biến thành phần và tích hợp ở lớp cấu hình giao diện toàn cục.
- **FR-016**: Giao diện frontend MUST chỉ sử dụng bộ icon Lucide cho các icon trong sản phẩm để đảm bảo tính nhất quán thị giác.
- **FR-017**: Cả ứng dụng backend và frontend MUST sử dụng Yarn làm trình quản lý gói và cách chạy tác vụ phát triển.

### Key Entities *(include if feature involves data)*

- **User Profile**: Đại diện cho người dùng đăng nhập bằng Google, bao gồm email Google, username được suy ra từ email, danh tính hiển thị và trạng thái sử dụng.
- **Authenticated Session**: Đại diện cho trạng thái truy cập hợp lệ của một người dùng trên website trong một khoảng thời gian sử dụng cụ thể.
- **Auth Attempt**: Đại diện cho một lần người dùng bắt đầu, hoàn tất hoặc hủy luồng đăng nhập bằng Google, bao gồm kết quả xác thực và thông tin lỗi nếu có.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ít nhất 95% lượt đăng nhập Google hợp lệ đưa người dùng vào khu vực đã đăng nhập thành công ngay ở lần thử đầu tiên.
- **SC-002**: 100% hồ sơ người dùng được tạo mới từ email Google trong kịch bản kiểm thử chấp nhận đều có username đúng theo quy tắc lấy phần trước ký tự @.
- **SC-003**: 100% người dùng hủy hoặc thất bại ở bước xác thực Google không được tạo phiên truy cập hợp lệ.
- **SC-004**: 95% người dùng trong kịch bản kiểm thử có thể tải lại website trong thời gian phiên còn hiệu lực mà không phải đăng nhập lại.
- **SC-005**: 100% màn hình trong phạm vi phần auth của phiên bản đầu tiên áp dụng nhất quán theme glassstyle đã được chỉ định.

## Assumptions

- Website hướng đến người dùng sử dụng trình duyệt hiện đại trên máy tính; tối ưu riêng cho di động chưa nằm trong phạm vi của phiên bản đầu tiên.
- Username dùng trong hệ thống sẽ được suy ra từ phần trước ký tự @ của email Google, ví dụ `abc.123@gmail.com` thành `abc.123`.
- Nếu phát sinh xung đột hoặc ràng buộc định danh từ username suy ra, hệ thống sẽ áp dụng một quy tắc xử lý nhất quán mà vẫn giữ liên hệ rõ ràng với email gốc.
- Mã nguồn website sẽ được tách thành hai thư mục ứng dụng riêng là `backend` và `frontend`.
- Phần backend sẽ dùng NestJS, MongoDB, Mongoose và Yarn.
- Phần frontend sẽ dùng React, Vite, Ant Design, Zustand, Axios 1.12 và Yarn.
- Theme giao diện sẽ dùng glassstyle theo mẫu cấu hình Ant Design mà người dùng đã cung cấp.
- Toàn bộ icon trong giao diện sẽ dùng Lucide để giữ một hệ icon thống nhất.
- Các chức năng chat 1-1, chat nhóm, gửi nhận tin nhắn và lịch sử thành viên được tách sang specification riêng cho phần chat.