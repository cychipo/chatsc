# Data Model: Nền tảng codebase FE + BE

## 1. Frontend Application Area
- **Purpose**: Chứa toàn bộ mã nguồn phía client cho web app React/Vite.
- **Key Fields / Attributes**:
  - `name`: frontend
  - `rootPath`: `frontend/`
  - `sourcePath`: `frontend/src/`
  - `uiLibrary`: Ant Design
  - `stateLibrary`: Zustand
  - `httpClient`: Axios 1.12
  - `iconLibrary`: Lucide
  - `themeMode`: glassstyle
- **Relationships**:
  - Gọi Backend Application Area qua HTTP API.
  - Phụ thuộc Project Convention cho script, naming và env.
- **Validation Rules**:
  - Chỉ chứa logic client-facing.
  - Toàn bộ icon UI phải dùng Lucide.
  - Theme toàn cục phải đi qua lớp cấu hình Ant Design.

## 2. Backend Application Area
- **Purpose**: Chứa mã nguồn phía server cho NestJS service.
- **Key Fields / Attributes**:
  - `name`: backend
  - `rootPath`: `backend/`
  - `sourcePath`: `backend/src/`
  - `framework`: NestJS
  - `database`: MongoDB
  - `odm`: Mongoose
- **Relationships**:
  - Expose API cho Frontend Application Area.
  - Phụ thuộc Environment Configuration cho kết nối DB và runtime.
- **Validation Rules**:
  - Logic server, schema dữ liệu và tích hợp persistence nằm trong backend.
  - Feature mới như auth/chat phải mở rộng bằng module rõ ràng.

## 3. Project Convention
- **Purpose**: Tập quy tắc giữ frontend và backend nhất quán.
- **Key Fields / Attributes**:
  - `packageManager`: Yarn
  - `directoryBoundary`: top-level `frontend/` và `backend/`
  - `scriptStyle`: script phát triển và kiểm tra đặt theo cùng naming pattern
  - `configOwnership`: cấu hình riêng cho từng app, tài nguyên chung ở root khi thật sự dùng chung
- **Relationships**:
  - Áp dụng cho cả Frontend Application Area và Backend Application Area.
- **Validation Rules**:
  - Không đặt lẫn file frontend trong backend hoặc ngược lại.
  - Tên script và cách chạy phải dễ đoán giữa hai app.

## 4. Environment Configuration
- **Purpose**: Quản lý biến môi trường cho từng ứng dụng và từng bối cảnh chạy.
- **Key Fields / Attributes**:
  - `backendEnvFile`: `backend/.env`
  - `backendEnvExample`: `backend/.env.example`
  - `frontendEnvFile`: `frontend/.env`
  - `frontendEnvExample`: `frontend/.env.example`
  - `frontendPublicPrefix`: `VITE_`
- **Relationships**:
  - Backend Application Area dùng cho DB URI, port, server config.
  - Frontend Application Area dùng cho API base URL và public runtime config.
- **Validation Rules**:
  - Không dùng biến backend trực tiếp trong frontend.
  - Biến public của frontend phải có prefix `VITE_`.
  - Giá trị development và deployment có thể thay đổi mà không đổi cấu trúc mã nguồn.

## 5. Frontend-Backend Communication Contract
- **Purpose**: Điểm tổ chức rõ ràng cho giao tiếp HTTP giữa hai ứng dụng.
- **Key Fields / Attributes**:
  - `frontendClientPath`: `frontend/src/services/`
  - `backendRoutePrefix`: `/api`
  - `transport`: HTTP/JSON
  - `clientConfig`: Axios instance + interceptors
- **Relationships**:
  - Frontend Application Area tiêu thụ contract này.
  - Backend Application Area cung cấp contract này.
- **Validation Rules**:
  - HTTP calls không được rải trực tiếp trong UI component nếu đã có service layer.
  - API base URL phải được cấu hình qua env.

## 6. Theme Configuration
- **Purpose**: Mô hình hóa lớp theme glassstyle cho frontend.
- **Key Fields / Attributes**:
  - `themePath`: `frontend/src/theme/`
  - `provider`: Ant Design `ConfigProvider`
  - `tokens`: màu nền, surface, border, shadow, radius, typography
  - `effects`: blur, translucent surface, gradient background
- **Relationships**:
  - Áp dụng cho Frontend Application Area.
  - Tuân theo Project Convention về UI consistency.
- **Validation Rules**:
  - Theme token toàn cục phải phản ánh glassstyle mockup.
  - Component overrides phải đi qua cấu hình theme trung tâm.

## State Transitions

### Application Bootstrap
1. Repository được clone.
2. Developer nhận diện `frontend/` và `backend/`.
3. Developer cài dependencies bằng Yarn cho từng app hoặc workspace root.
4. Developer cấu hình env riêng cho từng app.
5. Frontend và backend có thể chạy độc lập ở local.

### Feature Expansion
1. Tính năng mới được phân loại là frontend-only, backend-only hoặc full-stack.
2. Code được đặt vào app tương ứng theo convention.
3. Nếu là full-stack, frontend mở rộng service layer và backend mở rộng module/API tương ứng.
4. Test được chạy ở app liên quan trước khi tích hợp.

### Future Auth/Chat Readiness
1. Backend thêm `modules/auth` hoặc `modules/chat` với module/controller placeholders đã có sẵn.
2. Frontend thêm `features/auth` hoặc `features/chat` với entry pages và index exports tương ứng.
3. Giao tiếp giữa hai phía đi qua contract HTTP đã định vị sẵn trong `frontend/src/services/`.
4. Kiểu dữ liệu feature-facing được đặt trong `frontend/src/types/auth.ts` và `frontend/src/types/chat.ts`.