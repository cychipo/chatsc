# Quickstart: FE + BE Codebase Foundation

## 1. Mục tiêu
Thiết lập và chạy được hai ứng dụng web tách biệt trong cùng repository:
- `backend/`: NestJS + MongoDB + Mongoose
- `frontend/`: React + Vite + Ant Design + Zustand + Axios 1.12

## 2. Repository layout kỳ vọng
```text
backend/
frontend/
specs/
mockups/
```

## 3. Chuẩn bị môi trường
- Cài Node.js LTS phù hợp với NestJS/Vite
- Cài Yarn
- Có MongoDB local hoặc URI MongoDB dùng cho development

## 4. Thiết lập backend
1. Vào `backend/`
2. Cài dependency bằng Yarn
3. Tạo file `.env` từ `.env.example`
4. Cấu hình tối thiểu:
   - `PORT`
   - `MONGODB_URI`
5. Chạy backend ở chế độ phát triển bằng script Yarn của ứng dụng

## 5. Thiết lập frontend
1. Vào `frontend/`
2. Cài dependency bằng Yarn
3. Tạo file `.env` từ `.env.example`
4. Cấu hình tối thiểu:
   - `VITE_API_BASE_URL`
5. Chạy frontend ở chế độ phát triển bằng script Yarn của ứng dụng

## 6. Kiểm tra nhanh
- Xác nhận backend chạy độc lập và expose HTTP API cục bộ
- Xác nhận frontend chạy độc lập và render giao diện với Ant Design glassstyle
- Xác nhận frontend gọi đúng backend base URL qua Axios service layer

## 7. Quy ước làm việc
- Thêm UI, state và service phía client trong `frontend/`
- Thêm route, module, schema và business logic phía server trong `backend/`
- Không đặt lẫn file frontend vào backend hoặc ngược lại
- Icon UI dùng Lucide
- Theme toàn cục đi qua lớp cấu hình Ant Design

## 8. Vị trí mở rộng cho roadmap
- Auth frontend: `frontend/src/features/auth/`
- Auth backend: `backend/src/modules/auth/`
- Chat frontend: `frontend/src/features/chat/`
- Chat backend: `backend/src/modules/chat/`

## 9. Kiểm tra chất lượng
- Chạy test frontend trong `frontend/`
- Chạy test backend trong `backend/`
- Khi có thay đổi full-stack, chạy cả hai nhóm kiểm tra trước khi tích hợp