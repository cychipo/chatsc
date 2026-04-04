# Feature Specification: Nền tảng codebase FE + BE

**Feature Branch**: `[004-fe-be-codebase]`  
**Created**: 2026-04-04  
**Status**: Draft  
**Input**: User description: "bây giờ bạn tạo secp cho phần code base cho fe + be nhé"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Bắt đầu làm việc với frontend và backend từ một nền tảng rõ ràng (Priority: P1)

Là một developer, tôi có thể truy cập một cấu trúc codebase frontend và backend sẵn sàng sử dụng để có thể bắt đầu triển khai tính năng mà không cần tự dựng nền tảng dự án từ đầu.

**Why this priority**: Một nền tảng codebase dùng được là điều kiện tiên quyết cho toàn bộ phần auth, chat và tích hợp phía sau. Nếu chưa có nền tảng này thì mọi phần việc khác đều bị chặn.

**Independent Test**: Có thể kiểm thử độc lập bằng cách mở repository, xác định được khu vực ứng dụng frontend và khu vực ứng dụng backend, đồng thời xác nhận mỗi bên đều có cấu trúc nền tảng phục vụ phát triển tính năng, cấu hình và chạy ứng dụng.

**Acceptance Scenarios**:

1. **Given** một developer mở repository lần đầu, **When** họ kiểm tra cấu trúc dự án, **Then** họ có thể nhận ra rõ khu vực ứng dụng frontend và khu vực ứng dụng backend.
2. **Given** nền tảng codebase đã được thiết lập, **When** một developer bắt đầu làm một tính năng mới, **Then** họ có thể đặt phần thay đổi của frontend và backend vào đúng vị trí dự đoán được mà không phải tự tạo cấu trúc riêng.

---

### User Story 2 - Làm việc nhất quán trên toàn bộ full stack (Priority: P2)

Là một developer, tôi có thể sử dụng các convention nhất quán giữa frontend và backend để có thể chuyển đổi qua lại giữa hai phần mà không bị rối.

**Why this priority**: Tính nhất quán giúp giảm chi phí onboarding, giảm công bảo trì và hỗ trợ làm việc song song giữa frontend với backend hiệu quả hơn.

**Independent Test**: Có thể kiểm thử độc lập bằng cách rà soát các convention về đặt tên, cấu hình, thiết lập môi trường và workflow chung, sau đó xác nhận chúng đồng nhất giữa cả hai khu vực ứng dụng.

**Acceptance Scenarios**:

1. **Given** một developer làm việc ở cả frontend và backend, **When** họ chuyển qua lại giữa hai phần codebase, **Then** họ gặp các convention nhất quán và workflow phát triển có thể dự đoán được.
2. **Given** một thành viên mới tham gia dự án, **When** họ xem cấu trúc repository và cách thiết lập, **Then** họ có thể hiểu frontend và backend gắn với nhau như thế nào mà không cần thêm kiến thức truyền miệng.

---

### User Story 3 - Hỗ trợ triển khai các tính năng auth và chat trên nền tảng chung (Priority: P3)

Là một thành viên của team sản phẩm, tôi có thể dựa vào nền tảng codebase chung để triển khai các tính năng auth và chat tiếp theo mà không cần tái cấu trúc lớn về sau.

**Why this priority**: Nền tảng này chỉ có giá trị nếu các phần việc kế tiếp có thể xây dựng lên trên nó một cách gọn gàng.

**Independent Test**: Có thể kiểm thử độc lập bằng cách đối chiếu các spec auth và chat hiện có vào nền tảng này, rồi xác nhận đã có vị trí rõ ràng cho luồng giao diện người dùng, xử lý phía server, cấu hình và các mối quan tâm dùng chung.

**Acceptance Scenarios**:

1. **Given** roadmap sản phẩm có Google authentication và chat, **When** các tính năng này được quy hoạch trên nền tảng codebase, **Then** cấu trúc hiện có đã bao quát được cả luồng phía frontend và xử lý phía backend.
2. **Given** team muốn bổ sung thêm tính năng sản phẩm sau này, **When** họ mở rộng codebase, **Then** họ có thể làm trong cấu trúc hiện tại mà không cần tổ chức lại lớn.

### Edge Cases

- Điều gì xảy ra khi một developer chỉ cần làm việc ở frontend hoặc chỉ ở backend?
- Dự án xử lý thế nào với các cấu hình dùng chung ảnh hưởng tới cả hai khu vực ứng dụng?
- Điều gì xảy ra khi một phía của codebase phát triển nhanh hơn phía còn lại?
- Cấu trúc hiện tại tránh lặp lại các pattern thiết lập giữa frontend và backend như thế nào?
- Điều gì xảy ra khi một tính năng mới chạm tới cả hai ứng dụng và cần thay đổi phối hợp?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Giải pháp MUST cung cấp một khu vực ứng dụng frontend riêng biệt và một khu vực ứng dụng backend riêng biệt trong cùng một nền tảng codebase.
- **FR-002**: Codebase MUST thể hiện rõ file và thư mục nào thuộc frontend, file và thư mục nào thuộc backend.
- **FR-003**: Codebase MUST cung cấp vị trí có thể dự đoán được cho logic ứng dụng, cấu hình và thiết lập môi trường của cả frontend lẫn backend.
- **FR-004**: Codebase MUST hỗ trợ workflow phát triển cục bộ cho cả ứng dụng frontend và backend.
- **FR-005**: Codebase MUST hỗ trợ việc chạy độc lập frontend và backend trong quá trình phát triển.
- **FR-006**: Codebase MUST định nghĩa một cách tiếp cận nhất quán để quản lý các convention dùng chung giữa frontend và backend.
- **FR-007**: Codebase MUST hỗ trợ thêm các tính năng hướng người dùng ở frontend mà không cần tái cấu trúc nền tảng dự án.
- **FR-008**: Codebase MUST hỗ trợ thêm các khả năng xử lý phía server ở backend mà không cần tái cấu trúc nền tảng dự án.
- **FR-009**: Codebase MUST cung cấp một hướng tổ chức rõ ràng cho giao tiếp từ frontend sang backend trong phạm vi cấu trúc dự án.
- **FR-010**: Codebase MUST hỗ trợ cấu hình môi trường có thể khác nhau giữa lúc phát triển và các bối cảnh triển khai về sau.
- **FR-011**: Codebase MUST cho phép developer xác định và chạy các bước kiểm tra phù hợp cho từng khu vực ứng dụng.
- **FR-012**: Codebase MUST được tổ chức sao cho các tính năng auth và chat trong tương lai có thể được thêm vào với mức rework tối thiểu.
- **FR-013**: Codebase MUST giảm tối đa sự mơ hồ cho thành viên mới về nơi đặt file frontend mới, file backend mới và các tài nguyên dùng chung ở cấp dự án.
- **FR-014**: Mã nguồn web MUST được tổ chức thành hai ứng dụng riêng biệt trong hai thư mục `backend` và `frontend`.
- **FR-015**: Ứng dụng backend MUST sử dụng NestJS làm nền tảng dịch vụ, MongoDB làm nơi lưu trữ dữ liệu và Mongoose làm lớp ánh xạ dữ liệu.
- **FR-016**: Ứng dụng frontend MUST sử dụng React và Vite cho giao diện web, Ant Design cho thành phần giao diện, Zustand cho quản lý trạng thái phía client và Axios 1.12 cho giao tiếp yêu cầu dữ liệu.
- **FR-017**: Giao diện frontend MUST áp dụng theme glassstyle dựa trên Ant Design cho các thành phần giao diện chính của ứng dụng.
- **FR-018**: Theme glassstyle MUST được cấu hình theo mẫu thư viện mà người dùng đã cung cấp, bao gồm hiệu ứng nền mờ, viền kính, tuỳ biến thành phần và tích hợp ở lớp cấu hình giao diện toàn cục.
- **FR-019**: Giao diện frontend MUST chỉ sử dụng bộ icon Lucide cho toàn bộ icon trong sản phẩm để đảm bảo tính nhất quán thị giác.
- **FR-020**: Cả ứng dụng backend và frontend MUST sử dụng Yarn làm trình quản lý gói và cách chạy tác vụ phát triển.
- **FR-021**: Môi trường phát triển MUST hỗ trợ frontend và backend chạy trên máy phát triển cục bộ với cấu hình riêng cho từng ứng dụng.

### Key Entities *(include if feature involves data)*

- **Khu vực ứng dụng Frontend**: Phần của codebase chịu trách nhiệm cho màn hình, tương tác và hành vi phía client.
- **Khu vực ứng dụng Backend**: Phần của codebase chịu trách nhiệm cho xử lý phía server, business logic, tích hợp và truy cập dữ liệu.
- **Convention dự án**: Một quy tắc dùng chung về đặt tên, vị trí, thiết lập hoặc cách chạy để giữ frontend và backend nhất quán.
- **Cấu hình môi trường**: Tập hợp giá trị và thiết lập giúp codebase vận hành đúng trong môi trường phát triển và các bối cảnh chạy khác.
- **Tài nguyên dùng chung cấp dự án**: Tài nguyên ở cấp repository được cả hai khu vực ứng dụng sử dụng, ví dụ hướng dẫn thiết lập, script hoặc cấu hình cắt ngang.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% developer trong bài review onboarding có thể xác định đúng nơi đặt phần việc frontend và backend trong repository.
- **SC-002**: 90% các tác vụ thiết lập phát triển phổ biến cho frontend và backend có thể được hoàn thành chỉ bằng cách làm theo cấu trúc dự án và hướng dẫn sẵn có, không cần thêm hướng dẫn miệng.
- **SC-003**: Các tính năng sản phẩm mới chỉ ảnh hưởng tới một khu vực ứng dụng có thể được thêm vào mà không cần thay đổi cấu trúc codebase cấp cao nhất.
- **SC-004**: Các tính năng full-stack chạm tới cả frontend và backend luôn có thể được ánh xạ vào các vị trí rõ ràng trong repository ở mọi buổi review planning.
- **SC-005**: Nền tảng này hỗ trợ được scope auth và chat đã xác định trước đó mà không cần reset lại cấu trúc repository.

## Assumptions

- Phiên bản đầu tiên của nền tảng chỉ bao phủ ứng dụng web frontend và backend.
- Frontend và backend tiếp tục nằm chung trong một repository thay vì tách thành hai repository riêng.
- Mã nguồn web sẽ được tách thành hai thư mục ứng dụng riêng là `backend` và `frontend`.
- Phần backend sẽ dùng NestJS, MongoDB, Mongoose và Yarn.
- Phần frontend sẽ dùng React, Vite, Ant Design, Zustand, Axios 1.12 và Yarn.
- Theme giao diện sẽ dùng glassstyle theo mẫu cấu hình Ant Design mà người dùng đã cung cấp.
- Toàn bộ icon trong giao diện sẽ dùng Lucide để giữ một hệ icon thống nhất.
- Môi trường phát triển chính là máy local của developer, nơi frontend và backend có thể được cấu hình và chạy độc lập trong quá trình phát triển.
- Các phần việc auth và chat hiện có sẽ được xây dựng trên nền tảng này thay vì thay thế nó sau này.
- Ngoài hai khu vực ứng dụng chính, vẫn có thể tồn tại hướng dẫn cấp repository và các tài nguyên thiết lập dùng chung.
- Chi tiết về triển khai hạ tầng và tự động hóa deployment nằm ngoài phạm vi của spec này, trừ khi chúng là điều kiện bắt buộc để hỗ trợ nền tảng phát triển cục bộ.