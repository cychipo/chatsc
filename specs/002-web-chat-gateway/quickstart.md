# Quickstart: Web Google Auth

## 1. Mục tiêu
Thiết lập và kiểm tra được luồng đăng nhập Google cho website với:
- backend NestJS xử lý OAuth callback, session và user profile
- frontend React/Vite hiển thị auth UI, hydrate session và bảo vệ route

## 2. Điều kiện tiên quyết
- Đã có scaffold codebase `backend/` và `frontend/`
- Có Google OAuth credentials cho môi trường development
- Có MongoDB local hoặc URI MongoDB dùng cho development
- Có Yarn và Node.js LTS

## 3. Thiết lập backend
1. Cập nhật `backend/.env` từ `.env.example`
2. Bổ sung các biến tối thiểu:
   - `PORT`
   - `MONGODB_URI`
   - `API_PREFIX`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL`
   - `SESSION_SECRET`
   - `FRONTEND_APP_URL`
3. Chạy backend bằng `yarn dev` hoặc `yarn dev:backend`

## 4. Thiết lập frontend
1. Cập nhật `frontend/.env` từ `.env.example`
2. Bổ sung các biến tối thiểu:
   - `VITE_API_BASE_URL`
3. Chạy frontend bằng `yarn dev` hoặc `yarn dev:frontend`

## 5. Kiểm tra nhanh
- Mở frontend app và xác nhận unauthenticated state hiển thị màn hình `Sign in with Google`
- Bấm CTA và xác nhận browser redirect tới `GET /auth/google`
- Hoàn tất Google login bằng tài khoản hợp lệ
- Xác nhận backend callback redirect về frontend và `GET /auth/me` trả current user hợp lệ
- Xác nhận backend tạo hoặc nạp User Profile với username đúng theo local-part email
- Reload frontend và xác nhận session vẫn được hydrate
- Logout và xác nhận `POST /auth/logout` thành công và protected area không còn truy cập được

## 6. Edge Case Validation
- Hủy Google login giữa chừng và xác nhận không có session hợp lệ
- Mô phỏng lỗi tạo profile và xác nhận frontend nhận lỗi rõ ràng
- Kiểm thử email gây trùng username và xác nhận quy tắc suffix hoạt động nhất quán
- Chờ session hết hạn hoặc làm session invalid rồi reload để xác nhận frontend yêu cầu login lại