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
   - `API_PREFIX`
5. Chạy backend bằng `yarn dev` hoặc từ root bằng `yarn dev:backend`
6. Kiểm tra readiness endpoint tại `/api/health`

## 5. Thiết lập frontend
1. Vào `frontend/`
2. Cài dependency bằng Yarn
3. Tạo file `.env` từ `.env.example`
4. Cấu hình tối thiểu:
   - `VITE_API_BASE_URL`
5. Chạy frontend bằng `yarn dev` hoặc từ root bằng `yarn dev:frontend`
6. Xác nhận app render shell Ant Design glassstyle ở màn hình chính

## 6. Kiểm tra nhanh
- Xác nhận `backend/src/main.ts` và `backend/src/app.module.ts` đã bootstrap NestJS app với prefix `/api`
- Xác nhận `backend/src/modules/health/health.controller.ts` expose readiness endpoint `/api/health`
- Xác nhận `frontend/src/main.tsx`, `frontend/src/App.tsx` và `frontend/src/app/providers.tsx` đã nối app shell với Ant Design theme
- Xác nhận `frontend/src/services/http.ts` đọc `VITE_API_BASE_URL` và là điểm vào chung cho service layer
- Xác nhận `frontend/src/features/auth/` và `frontend/src/features/chat/` đã có placeholder để mở rộng feature

## 7. Quy ước làm việc
- Thêm UI, state và service phía client trong `frontend/`
- Thêm route, module, schema và business logic phía server trong `backend/`
- Không đặt lẫn file frontend vào backend hoặc ngược lại
- Icon UI dùng Lucide qua `frontend/src/components/icon.tsx`
- Theme toàn cục đi qua lớp cấu hình Ant Design trong `frontend/src/theme/`

## 8. Vị trí mở rộng cho roadmap
- Auth frontend: `frontend/src/features/auth/`
- Auth backend: `backend/src/modules/auth/`
- Chat frontend: `frontend/src/features/chat/`
- Chat backend: `backend/src/modules/chat/`

## 9. Kiểm tra chất lượng
- Chạy test frontend trong `frontend/`
- Chạy test backend trong `backend/`
- Khi có thay đổi full-stack, chạy cả hai nhóm kiểm tra trước khi tích hợp