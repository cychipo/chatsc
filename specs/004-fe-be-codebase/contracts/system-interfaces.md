# System Interfaces Contract: FE + BE Codebase Foundation

## 1. Repository Boundary Contract
- Repository MUST có hai ứng dụng top-level:
  - `backend/`
  - `frontend/`
- Developer mở repo phải nhận diện ngay đâu là frontend và đâu là backend.
- Tài nguyên cấp repository chỉ giữ phần dùng chung thực sự như `specs/`, `mockups/`, cấu hình git và script phối hợp.

## 2. Backend Application Contract
- Backend MUST dùng NestJS.
- Backend MUST có vị trí rõ ràng cho:
  - bootstrap application
  - feature modules
  - cấu hình runtime
  - database integration với MongoDB/Mongoose
  - test files
- Backend MUST hỗ trợ chạy độc lập trong local development.
- Backend SHOULD public HTTP API dưới một route prefix nhất quán, ưu tiên `/api`.

## 3. Frontend Application Contract
- Frontend MUST dùng React + Vite.
- Frontend MUST có vị trí rõ ràng cho:
  - app bootstrap
  - pages/features/components
  - state management bằng Zustand
  - HTTP services bằng Axios 1.12
  - theme configuration
  - test files
- Frontend MUST hỗ trợ chạy độc lập trong local development.
- Frontend MUST chỉ dùng Lucide cho icon sản phẩm.

## 4. Environment Contract
- Mỗi ứng dụng MUST có env ownership riêng.
- Backend env dùng cho server port, Mongo connection và config nội bộ.
- Frontend env dùng cho public client config và MUST prefix bằng `VITE_` nếu được bundle vào client.
- Development config và deployment config MUST có thể thay đổi mà không cần đổi cấu trúc codebase.

## 5. Frontend-to-Backend Communication Contract
- Frontend MUST gọi backend qua một service layer tập trung.
- Axios instance/base configuration MUST nằm ở vị trí dự đoán được trong frontend codebase.
- Backend MUST cung cấp HTTP/JSON interface rõ ràng cho các feature hiện tại và tương lai.
- Full-stack feature mới MUST có mapping rõ: frontend UI/state/service ↔ backend route/module/schema.

## 6. Theme Contract
- Frontend MUST áp dụng glassstyle theme ở lớp cấu hình toàn cục.
- Theme MUST phản ánh các đặc trưng từ mockup/design system:
  - translucent surfaces
  - soft border kính
  - blur effect
  - warm orange gradient palette
  - component-level token overrides
- Ant Design `ConfigProvider` là integration point mặc định cho theme toàn cục.

## 7. Testing Contract
- Backend MUST có lối chạy kiểm tra riêng cho unit/integration phù hợp với NestJS.
- Backend test entry mặc định được đặt trong `backend/test/jest-e2e.json` và `backend/test/app.e2e-spec.ts`.
- Frontend MUST có lối chạy kiểm tra riêng cho unit/component phù hợp với React/Vite.
- Frontend test entry mặc định được đặt trong `frontend/vitest.config.ts` và `frontend/src/test/setup.ts`.
- Developer MUST xác định được nơi đặt test của từng app mà không cần knowledge truyền miệng.

## 8. Extensibility Contract
- Auth và chat MUST được thêm vào mà không cần tổ chức lại root structure.
- Frontend-only feature được thêm trong `frontend/`.
- Backend-only capability được thêm trong `backend/`.
- Full-stack feature được mở rộng song song trên hai app nhưng vẫn giữ ranh giới rõ ràng.