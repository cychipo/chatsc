# Quickstart: Refresh Token Renewal

## 1. Mục tiêu
Triển khai cơ chế access token 30 phút, refresh token 7 ngày và auto-refresh request cho hệ thống auth hiện tại.

## 2. Phạm vi code chính
```text
backend/src/modules/auth/
frontend/src/services/
frontend/src/store/
frontend/src/test/
backend/test/
```

## 3. Chuẩn bị backend
1. Bổ sung cấu hình môi trường cho secret ký token, thời lượng access token, thời lượng refresh token và cấu hình cookie frontend/backend nếu cần.
2. Cập nhật `backend/src/modules/auth/` để:
   - phát hành access token + refresh token sau login thành công
   - lưu refresh session trong database
   - cung cấp endpoint refresh
   - thu hồi refresh session khi logout
3. Cập nhật protected auth guard cho các API cần bearer access token.
4. Bảo đảm log/audit renewal event được ghi nhận khi refresh thành công hoặc thất bại.

## 4. Chuẩn bị frontend
1. Cập nhật `frontend/src/store/auth.store.ts` để lưu access token runtime cùng trạng thái authenticated hiện có.
2. Cập nhật `frontend/src/services/http.ts` để:
   - gắn access token vào request
   - bắt lỗi access token hết hạn
   - gọi refresh endpoint
   - retry request đúng một lần sau refresh thành công
3. Cập nhật `frontend/src/services/auth.service.ts` để hỗ trợ refresh session và bootstrap auth state.
4. Đảm bảo logout xóa access token cục bộ và không cho refresh lại sau đó.

## 5. Trình tự kiểm tra chính
1. Đăng nhập thành công qua Google.
2. Xác nhận frontend có authenticated state và gọi được protected API.
3. Giả lập access token hết hạn trong khi refresh token còn hiệu lực.
4. Gửi protected request và xác nhận:
   - request đầu tiên bị từ chối do token hết hạn
   - frontend tự gọi refresh
   - access token mới được lưu
   - request ban đầu được retry thành công đúng một lần
5. Giả lập refresh token hết hạn hoặc bị revoke.
6. Gửi protected request và xác nhận người dùng bị đưa về luồng đăng nhập lại.
7. Gửi nhiều protected requests cùng lúc khi access token vừa hết hạn và xác nhận chỉ có một refresh flow hoạt động.

## 6. Test kỳ vọng
- Backend e2e:
  - login issue token pair
  - refresh thành công với refresh token hợp lệ
  - refresh thất bại khi token hết hạn/revoked
  - logout revoke refresh session
- Frontend unit/integration:
  - bootstrap khôi phục session qua refresh
  - interceptor refresh + retry một lần
  - refresh thất bại chuyển store về unauthenticated
  - nhiều request đồng thời chỉ dùng một refresh promise

## 7. Hoàn tất
- Backend build pass
- Backend test pass
- Frontend build pass
- Frontend test pass
- Luồng chính đã được xác thực: login callback phát hành token pair, refresh thành công/thất bại, logout revoke refresh session, shared refresh promise, và fallback về màn hình đăng nhập khi refresh không còn hợp lệ.

Feature đã được triển khai theo scope hiện tại.
