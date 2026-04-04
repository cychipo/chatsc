# Auth Interfaces Contract: Web Google Auth

## 1. Frontend Login Contract
- Frontend MUST cung cấp màn hình auth với nút đăng nhập Google.
- Frontend MUST chỉ hiển thị cơ chế Google login trong scope feature này.
- Frontend MUST dùng glassstyle theme và Lucide icons cho auth UI.
- Frontend login action SHOULD redirect người dùng tới backend auth endpoint.

## 2. Backend OAuth Endpoints Contract
- Backend MUST cung cấp endpoint bắt đầu Google OAuth flow.
- Backend MUST cung cấp callback endpoint để nhận kết quả xác thực từ Google.
- Backend MUST cung cấp endpoint để frontend lấy trạng thái người dùng hiện tại sau khi có session hợp lệ.
- Backend MUST cung cấp endpoint đăng xuất để chấm dứt session hiện tại.
- Các endpoint protected MUST từ chối truy cập khi không có session hợp lệ.

## 3. Session Contract
- Session MUST được tạo chỉ sau khi Google auth thành công và user profile hợp lệ.
- Session MUST được duy trì qua reload trang cho tới khi logout hoặc hết hạn.
- Session invalid/expired MUST dẫn tới response cho frontend biết cần đăng nhập lại.

## 4. User Profile Contract
- User profile MUST được tra cứu theo email hoặc Google identity ổn định.
- Lần đăng nhập đầu tiên với email chưa tồn tại MUST tạo profile mới.
- Username MUST lấy từ phần trước `@` của email Google.
- Nếu username bị trùng, hệ thống MUST áp dụng quy tắc phân giải nhất quán và dự đoán được.

## 5. Error Contract
- Login bị hủy hoặc xác thực thất bại MUST không tạo session.
- Tạo profile thất bại MUST trả lỗi rõ ràng cho frontend.
- Session không còn hợp lệ MUST dẫn tới trạng thái unauthenticated rõ ràng ở frontend.

## 6. Frontend State Contract
- Frontend auth store MUST giữ được tối thiểu:
  - `currentUser`
  - `isAuthenticated`
  - `isHydrating`
  - `errorMessage`
- Frontend MUST hydrate auth state từ backend qua `GET /auth/me` khi app khởi động hoặc reload.
- Frontend login action SHOULD redirect browser tới `GET /auth/google`.
- Frontend logout action MUST gọi `POST /auth/logout` và quay về unauthenticated state.
- Frontend MUST đọc `authError` từ query string sau OAuth redirect thất bại và hiển thị thông báo rõ ràng.
- Frontend protected routes/layout MUST chặn người dùng chưa có session hợp lệ.