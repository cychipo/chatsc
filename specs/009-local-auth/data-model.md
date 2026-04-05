# Data Model: Xác thực bằng tài khoản thường

## 1. User

### Purpose
Đại diện cho hồ sơ người dùng thống nhất của hệ thống, có thể đăng nhập bằng Google, local account, hoặc cả hai nếu được hỗ trợ trong tương lai.

### Fields
- `id`: định danh duy nhất của người dùng.
- `email`: email duy nhất, được chuẩn hóa nhất quán để kiểm tra trùng và đăng nhập.
- `username`: định danh công khai duy nhất.
- `displayName`: tên hiển thị cho UI.
- `avatarUrl`: ảnh đại diện, có thể rỗng với tài khoản local.
- `status`: trạng thái tài khoản (`active`, `disabled`, hoặc trạng thái vận hành tương đương).
- `googleId`: định danh Google nếu tài khoản được liên kết với Google login.
- `localAuth`: metadata cho xác thực local nếu tài khoản hỗ trợ đăng nhập thường.

### localAuth subfields
- `enabled`: tài khoản có thể đăng nhập bằng local auth hay không.
- `passwordSha1`: digest dùng để xác thực local account.
- `passwordUpdatedAt`: thời điểm mật khẩu local được thiết lập/cập nhật gần nhất.
- `createdVia`: nguồn tạo thông tin local (`register`, `admin`, hoặc nguồn tương đương nếu cần mở rộng).

### Implemented notes
- User tạo từ Google login được phép không có `googleId` bắt buộc ở schema local-first và có thể mang `localAuth.enabled = false`.
- User local mới được tạo với `localAuth.enabled = true` và `createdVia = register`.

### Validation Rules
- `email` là bắt buộc và duy nhất sau chuẩn hóa.
- `username` là bắt buộc và duy nhất.
- `displayName` là bắt buộc.
- `status` phải cho phép xác định tài khoản có được đăng nhập hay không.
- Nếu `localAuth.enabled = true` thì `passwordSha1` bắt buộc phải có.
- Nếu user chỉ có Google login thì `localAuth` có thể отсутствует hoặc ở trạng thái disabled.

### Relationships
- Một `User` có thể có nhiều `RefreshSession`.
- Một `User` có thể xuất hiện trong nhiều `AuthAttempt`.

## 2. Local Registration Submission

### Purpose
Đại diện cho payload người dùng gửi lên khi đăng ký tài khoản thường.

### Fields
- `email`
- `username`
- `displayName`
- `password`
- `confirmPassword`

### Validation Rules
- Tất cả trường đều bắt buộc.
- `password` và `confirmPassword` phải khớp nhau.
- `email` phải ở định dạng hợp lệ.
- `username` và `displayName` không được rỗng sau khi loại bỏ khoảng trắng thừa.

## 3. Local Login Submission

### Purpose
Đại diện cho payload người dùng gửi lên khi đăng nhập bằng tài khoản thường.

### Fields
- `email`
- `password`

### Validation Rules
- Cả hai trường đều bắt buộc.
- `email` phải được chuẩn hóa trước khi tìm tài khoản.
- `password` luôn được xử lý như dữ liệu nhạy cảm và không trả ngược lại UI.

## 4. Auth Attempt

### Purpose
Ghi nhận mỗi lần bắt đầu/thành công/thất bại của đăng ký hoặc đăng nhập để phục vụ quan sát vận hành và điều tra sự cố.

### Fields
- `provider`: giá trị như `google`, `local-register`, `local-login`, `refresh-token`.
- `emailCandidate`: email người dùng cung cấp, nếu có.
- `result`: trạng thái như `started`, `succeeded`, `failed`, `issued`, `renewed`, `revoked`.
- `failureReason`: lý do thất bại chuẩn hóa.
- `userId`: người dùng liên quan nếu đã xác định được.
- `sessionId`: phiên liên quan nếu có.
- `createdAt`: thời điểm ghi nhận.

### Validation Rules
- `provider` và `result` là bắt buộc.
- `failureReason` chỉ có khi thất bại hoặc bị huỷ.

## 5. Refresh Session

### Purpose
Đại diện cho phiên refresh token được dùng chung cho mọi phương thức xác thực thành công.

### Fields
- Giữ nguyên mô hình hiện có: `userId`, `tokenHash`, `issuedAt`, `expiresAt`, `status`, `revokedAt`, `lastUsedAt`, `createdBy`.

### State Transitions
- `active` → `revoked`
- `active` → `expired`
- `active` → tiếp tục active khi được refresh hợp lệ

## 6. Local Auth Result Payload

### Purpose
Dữ liệu trả về khi đăng ký hoặc đăng nhập local thành công.

### Fields
- `accessToken`
- `expiresInSeconds`
- `user`
- refresh token được đặt qua cookie giống luồng auth hiện có

### Behavior
- Đăng ký thành công trả cùng loại payload với đăng nhập thành công.
- Đăng nhập thất bại không trả token hay session hợp lệ.
