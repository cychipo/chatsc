# Contract: Xác thực bằng tài khoản thường

## 1. POST /auth/register

### Purpose
Tạo tài khoản thường mới và khởi tạo phiên đăng nhập ngay sau khi đăng ký thành công.

### Request Body
```json
{
  "email": "user@example.com",
  "username": "alice",
  "displayName": "Alice",
  "password": "secret-value",
  "confirmPassword": "secret-value"
}
```

### Success Response
- HTTP success.
- Body trả về cùng shape với session auth hiện có:
```json
{
  "accessToken": "jwt-access-token",
  "expiresInSeconds": 900,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "username": "alice",
    "displayName": "Alice",
    "avatarUrl": null
  }
}
```
- Refresh token được set qua cookie giống luồng đăng nhập thành công hiện tại.

### Failure Cases
- Email trùng → mã lỗi rõ ràng cho email đã tồn tại.
- Username trùng → mã lỗi rõ ràng cho username đã tồn tại.
- Dữ liệu bắt buộc thiếu / confirm password không khớp / dữ liệu sai định dạng → mã lỗi validation tương ứng.
- Không thể xử lý SHA1 remote hoặc không thể tạo phiên → đăng ký thất bại rõ ràng, không tạo tài khoản nửa chừng.

## 2. POST /auth/login

### Purpose
Đăng nhập bằng tài khoản thường đã tồn tại.

### Request Body
```json
{
  "email": "user@example.com",
  "password": "secret-value"
}
```

### Success Response
- HTTP success.
- Body cùng shape với response session auth hiện có:
```json
{
  "accessToken": "jwt-access-token",
  "expiresInSeconds": 900,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "username": "alice",
    "displayName": "Alice",
    "avatarUrl": null
  }
}
```
- Refresh token được set qua cookie.

### Failure Cases
- Email không tồn tại hoặc mật khẩu sai → lỗi xác thực chung, không tiết lộ field nào sai.
- Tài khoản không có local credential nhưng người dùng cố login local → lỗi xác thực rõ ràng theo đúng luồng.
- Tài khoản bị disabled/inactive → lỗi chặn truy cập.
- Không thể xử lý SHA1 remote → lỗi xác thực/dịch vụ rõ ràng, không tạo phiên.

## 3. GET /auth/me

### Purpose
Giữ nguyên contract hiện có cho mọi phương thức đăng nhập thành công.

### Expected Behavior
- Sau khi login/register local thành công, endpoint này trả user profile cùng shape hiện tại.
- Không expose credential metadata local về frontend.

## 4. POST /auth/refresh

### Purpose
Giữ nguyên contract refresh hiện có cho người dùng local auth.

### Expected Behavior
- Người dùng local auth dùng cùng refresh cookie name, same-site policy và response body như người dùng Google login.
- Nếu refresh session không hợp lệ thì xử lý như contract auth hiện tại.

## 5. POST /auth/logout

### Purpose
Giữ nguyên contract logout hiện có.

### Expected Behavior
- Thu hồi refresh token, xoá cookie và kết thúc phiên local auth giống các phiên auth khác.

## 6. Auth UI Contract

### Auth Screen States
- `google`: hiển thị CTA đăng nhập Google.
- `login`: hiển thị form đăng nhập local.
- `register`: hiển thị form đăng ký local.

### UI Rules
- Người dùng có thể chuyển giữa `login` và `register` mà không nhầm ý nghĩa hành động.
- Nếu hệ thống vẫn hỗ trợ Google login, CTA Google vẫn hiển thị rõ ràng và tách biệt với form local auth.
- Lỗi validation field-level và lỗi submit-level phải hiển thị đủ rõ để người dùng sửa dữ liệu.
- Form local auth dùng cùng màn hình auth hiện tại, chuyển mode ngay trên card auth thay vì route mới.
- Thành công ở `register` hoặc `login` phải đưa auth store về trạng thái authenticated giống luồng hiện tại.

## 7. Audit / Auth Attempt Contract

### Expected Logging
- `local-register` + `started|succeeded|failed`
- `local-login` + `started|succeeded|failed`
- `failureReason` chuẩn hoá cho các tình huống như `email-already-exists`, `username-already-exists`, `password-confirm-mismatch`, `invalid-local-credentials`, `local-auth-not-enabled`, `account-disabled`, `sha1-processing-unavailable`

### Rules
- Không log plaintext password.
- Có thể log `emailCandidate`, `userId`, `sessionId` khi phù hợp.
