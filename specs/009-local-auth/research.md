# Research: Xác thực bằng tài khoản thường

## Decision 1: Hỗ trợ tài khoản thường song song với Google login trong cùng bảng người dùng
- **Decision**: Mở rộng thực thể người dùng hiện có để hỗ trợ cả tài khoản Google và tài khoản thường, thay vì tách bảng người dùng riêng.
- **Rationale**: Hệ thống đã có `User`, `RefreshSession`, `AuthAttempt` và luồng cấp phiên hoàn chỉnh. Dùng chung hồ sơ người dùng giúp tránh tách session, tránh nhân đôi logic `me`, `refresh`, `logout`, và giữ nguyên khả năng chat/search user.
- **Alternatives considered**:
  - Tạo bảng riêng cho local account: tăng độ phức tạp mapping danh tính và session.
  - Chỉ hỗ trợ một phương thức auth cho mỗi hệ thống: không phù hợp vì spec yêu cầu cùng tồn tại với Google login.

## Decision 2: Dùng email + mật khẩu cho đăng nhập thường, username chỉ dùng cho định danh công khai và kiểm tra trùng khi đăng ký
- **Decision**: Luồng đăng nhập thường dùng email + mật khẩu; đăng ký yêu cầu email, username, display name, password, confirm password.
- **Rationale**: Email là định danh đăng nhập ổn định và đã tồn tại trong hồ sơ người dùng hiện có. Username nên tiếp tục đóng vai trò định danh hiển thị và searchable handle.
- **Alternatives considered**:
  - Cho phép login bằng email hoặc username: linh hoạt hơn nhưng tăng nhánh xử lý và rủi ro thông báo lỗi mơ hồ trong MVP.
  - Dùng username làm định danh đăng nhập chính: ít phù hợp hơn vì email đang là dữ liệu định danh ổn định của user.

## Decision 3: Thông tin xác thực local được lưu như credential metadata riêng trên user
- **Decision**: Bổ sung nhóm dữ liệu credential cho tài khoản thường trên hồ sơ `User`, bao gồm cờ có thể đăng nhập local, secret băm, thời điểm thiết lập/cập nhật gần nhất và provider khả dụng.
- **Rationale**: Cần phân biệt rõ tài khoản tạo từ Google-only với tài khoản có mật khẩu local để chặn sai luồng đăng nhập mà vẫn giữ một user profile thống nhất.
- **Alternatives considered**:
  - Lưu password hash trực tiếp ở cấp cao nhất của `User`: đơn giản nhưng khó mở rộng khi nhiều auth provider cùng tồn tại.
  - Tạo collection credential riêng ngay từ đầu: linh hoạt hơn nhưng quá mức cần thiết cho phạm vi hiện tại.

## Decision 4: Đăng ký local thành công sẽ cấp phiên giống luồng Google hiện tại
- **Decision**: Sau khi đăng ký local thành công hoặc login local thành công, hệ thống cấp access token + refresh token bằng cùng cơ chế phiên hiện tại.
- **Rationale**: Auth store frontend và backend controller/service hiện đã xoay quanh cặp token + refresh cookie. Reuse cơ chế này giúp giảm thay đổi phạm vi rộng và giữ hành vi nhất quán.
- **Alternatives considered**:
  - Bắt người dùng đăng nhập lại sau khi đăng ký: làm tăng ma sát không cần thiết.
  - Tạo session tách biệt cho local auth: gây phân mảnh logic auth.

## Decision 5: Ghi nhận register/login thất bại bằng `AuthAttempt` với provider riêng cho local auth
- **Decision**: Dùng collection `AuthAttempt` hiện có để log cả đăng ký và đăng nhập local, với `provider`/`result`/`failureReason` mở rộng tương ứng.
- **Rationale**: Spec yêu cầu theo dõi vận hành; hệ thống đã có nơi lưu auth attempt nên chỉ cần chuẩn hóa thêm taxonomy cho local auth.
- **Alternatives considered**:
  - Không log đăng ký thất bại: không đáp ứng nhu cầu quan sát vận hành.
  - Tạo collection audit riêng: không cần thiết cho phạm vi feature.

## Decision 6: UI auth hợp nhất trên màn hình hiện tại với chế độ chuyển giữa Google / local login / local register
- **Decision**: Màn hình auth hiện tại sẽ được mở rộng để hiển thị rõ lựa chọn Google login, local login và local register, cùng khả năng chuyển đổi trạng thái ngay trên cùng khu vực.
- **Rationale**: App hiện chỉ có một `AuthPage`; mở rộng tại chỗ là cách nhỏ gọn nhất và giữ trải nghiệm nhất quán.
- **Alternatives considered**:
  - Tạo route auth riêng cho login/register: app hiện chưa dùng runtime router cho auth public flow.
  - Ẩn Google login khi thêm local auth: trái với spec vì cần đồng tồn tại.

## Decision 7: Chuẩn hóa dữ liệu nhận vào trước khi kiểm tra trùng và xác thực
- **Decision**: Chuẩn hóa email về dạng so khớp nhất quán, loại bỏ khoảng trắng thừa ở các trường text, và xử lý validation trước khi tạo tài khoản hoặc xác thực.
- **Rationale**: Spec nêu rõ edge cases về khoảng trắng và phân biệt hoa/thường của email; cần chốt từ plan để tránh trùng tài khoản logic.
- **Alternatives considered**:
  - Giữ nguyên input người dùng để lưu và so sánh: dễ gây duplicate logic và trải nghiệm khó hiểu.

## Decision 8: Áp dụng SHA1 Linux-backed cho mật khẩu local qua remote processor dùng chung
- **Decision**: Khi đăng ký hoặc đăng nhập local, backend sẽ gọi remote processor dùng chung hiện có với mode SHA1 để tạo digest dùng cho so khớp/lưu trữ thông qua `AuthProcessingService`, thay vì tự băm hoàn toàn trong Node.js.
- **Rationale**: Project đã có mục tiêu tận dụng thuật toán SHA1 trong code C/kernel qua remote processor. Local auth là use case phù hợp cho hash một chiều, không xung đột với luồng reverse-encryption của chat.
- **Alternatives considered**:
  - Dùng SHA-256/Bcrypt hoàn toàn trong ứng dụng web: đơn giản hơn về app code nhưng không tận dụng được năng lực Linux-backed processing mà người dùng đang muốn áp dụng.
  - Dùng SHA1 trực tiếp trong Node.js: bỏ qua yêu cầu tái sử dụng code C/kernel hiện có qua VPS.
