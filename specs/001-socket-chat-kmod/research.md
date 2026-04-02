# Research: Hệ thống chat Socket với Linux Kernel Module

## Decision 1: Chạy user-space app và driver trực tiếp trên host Linux

**Decision**: Thiết kế hệ thống theo mô hình native Linux: client/server chạy trực tiếp trên Ubuntu host hoặc VPS, còn driver chạy trong host kernel và được expose lại qua device node.

**Rationale**: Kiến trúc này bám đúng môi trường triển khai thật của dự án: pull code trên Ubuntu VPS rồi build/test trực tiếp. Nó làm rõ trách nhiệm của từng thành phần: ứng dụng chat lo giao tiếp socket và điều phối, driver lo xử lý dữ liệu mức kernel.

**Alternatives considered**:
- Chạy toàn bộ logic trong user space: đơn giản hơn nhưng không đạt mục tiêu tích hợp kernel module.
- Tiếp tục dùng Docker làm flow chính: đồng nhất môi trường hơn nhưng lệch khỏi target runtime thực tế.

## Decision 2: Chuẩn hóa build và runtime trên Ubuntu host

**Decision**: Mọi thao tác build và chạy ứng dụng user-space được chuẩn hóa trực tiếp trên Ubuntu/Linux host.

**Rationale**: Điều này giúp workflow trên local và VPS thống nhất, giảm phụ thuộc vào Docker, và phù hợp với yêu cầu mới của user.

**Alternatives considered**:
- Dùng container cho build rồi chạy trên host: vẫn còn hai môi trường khác nhau.
- Giữ cả Docker và host-native như hai flow ngang nhau: tăng maintenance cost không cần thiết.

## Decision 3: Quy trình nạp module đi trực tiếp qua host kernel lifecycle

**Decision**: Quy trình load/unload module được thiết kế như một bước vận hành trực tiếp trên host Linux với quyền root phù hợp.

**Rationale**: Kernel module là concern của host kernel. Thiết kế host-native giúp build, load, verify và troubleshoot khớp hẳn với môi trường mục tiêu.

**Alternatives considered**:
- Giữ privileged container để load module: phức tạp hóa unnecessarily và không phản ánh target VPS.
- Chỉ mô tả load/unload thủ công không có helper: khả thi nhưng trải nghiệm vận hành kém hơn.

## Decision 4: Chuẩn hóa một device node duy nhất cho luồng request/response

**Decision**: Hệ thống dùng một device node logic duy nhất để client gửi dữ liệu vào driver và nhận kết quả xử lý trả về.

**Rationale**: Với phạm vi demo, một điểm truy cập duy nhất giúp tài liệu hóa, kiểm thử và quan sát đơn giản hơn. Nó cũng phù hợp với luồng `Client -> /dev/device -> Driver -> Client`.

**Alternatives considered**:
- Tách nhiều device node theo từng chức năng: linh hoạt hơn nhưng phức tạp hóa trải nghiệm demo.
- Dùng giao tiếp gián tiếp qua file trung gian hoặc service proxy: dễ triển khai ở user space nhưng làm yếu mục tiêu minh họa device-driver interaction.

## Decision 5: Hỗ trợ hai chế độ xử lý dữ liệu tách biệt ở mức nghiệp vụ

**Decision**: Driver hỗ trợ hai loại kết quả nghiệp vụ độc lập: thay thế ký tự và tạo giá trị băm; mỗi request chỉ cần đi theo một chế độ xử lý chính.

**Rationale**: Quy ước này giữ cho kết quả dễ dự đoán và dễ kiểm thử. Nó cũng tránh mơ hồ về việc một request có phải trả đồng thời nhiều kiểu output hay không.

**Alternatives considered**:
- Luôn trả cả chuỗi thay thế và giá trị băm: giàu thông tin hơn nhưng làm giao diện kết quả phức tạp hơn.
- Cho phép pipeline nhiều bước trong một request: mở rộng tốt hơn nhưng vượt quá phạm vi demo v1.

## Decision 6: Socket chat là lớp tích hợp trên luồng device-driver đã ổn định

**Decision**: Luồng socket client/server được xem là lớp tích hợp phía trên, được kiểm thử sau khi device-driver loop hoạt động ổn định.

**Rationale**: Giá trị cốt lõi của hệ thống là chứng minh được vòng lặp user space → kernel space → user space. Nếu ưu tiên socket trước, việc debug sẽ khó hơn do trộn lẫn lỗi mạng và lỗi driver.

**Alternatives considered**:
- Thiết kế socket là luồng chính từ đầu: phù hợp với sản phẩm chat hoàn chỉnh nhưng không tối ưu cho kiểm thử từng lớp.
- Bỏ socket khỏi scope v1: đơn giản hơn nhưng không đáp ứng đầy đủ spec.

## Decision 7: Logging và quickstart là deliverable bắt buộc của giai đoạn thiết kế

**Decision**: Tài liệu quickstart và danh sách log cần có được xem là một phần của thiết kế, không phải phần bổ sung sau cùng.

**Rationale**: Spec yêu cầu rõ khả năng demo, kiểm thử và bàn giao. Nếu không thiết kế sớm các điểm quan sát và thao tác chạy hệ thống, nhóm sẽ khó đạt các tiêu chí thành công về demo và self-service troubleshooting.

**Alternatives considered**:
- Viết tài liệu sau khi code xong: nhanh hơn trong ngắn hạn nhưng thường bỏ sót điều kiện chạy thực tế.
- Chỉ ghi acceptance test mà không có quickstart: đủ cho dev chính nhưng chưa đủ cho tester hoặc thành viên mới.

## Resolved Clarifications

- Không còn mục nào cần `NEEDS CLARIFICATION` cho phạm vi plan hiện tại.
- Phạm vi được giữ ở mức local development/demo trên Ubuntu/Linux host hoặc VPS, không mở rộng sang production deployment hay multi-host orchestration.
