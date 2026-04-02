# Research: Hệ thống chat Socket với Docker và Kernel Module

## Decision 1: Tách môi trường thành user-space containers và kernel-space driver trên Docker Desktop VM

**Decision**: Thiết kế hệ thống theo mô hình hai lớp: client/server chạy trong container Ubuntu, còn driver chạy trong kernel của Docker Desktop VM và được expose lại cho container qua device node.

**Rationale**: Kiến trúc này bám đúng mục tiêu học tập của dự án: chứng minh được ranh giới giữa user space trong container và kernel space của môi trường Docker Desktop. Nó cũng làm rõ trách nhiệm của từng thành phần: ứng dụng chat lo giao tiếp socket và điều phối, driver lo xử lý dữ liệu mức kernel.

**Alternatives considered**:
- Chạy toàn bộ logic trong user space: đơn giản hơn nhưng không đạt mục tiêu tích hợp kernel module.
- Chạy cả ứng dụng và driver trực tiếp trên host VM: gần kernel hơn nhưng không đáp ứng yêu cầu phát triển trong container.

## Decision 2: Dùng container Ubuntu làm môi trường phát triển và build thống nhất

**Decision**: Mọi thao tác build và chạy ứng dụng user-space được chuẩn hóa trong container Ubuntu có sẵn công cụ build.

**Rationale**: Điều này giảm chênh lệch môi trường giữa các máy phát triển, giúp onboarding dễ hơn, và phù hợp với yêu cầu của spec về việc không phụ thuộc toolchain trên host.

**Alternatives considered**:
- Build trên máy host rồi chỉ chạy trong container: nhanh hơn lúc đầu nhưng dễ lệch môi trường.
- Dùng nhiều image khác nhau cho build và run: linh hoạt hơn nhưng tăng độ phức tạp không cần thiết cho dự án demo.

## Decision 3: Quy trình nạp module phải đi qua một context có quyền truy cập kernel của Docker Desktop VM

**Decision**: Quy trình load/unload module được thiết kế như một bước vận hành có kiểm soát từ container có đủ quyền hoặc từ một container chuyên trách được cấu hình để truy cập kernel VM.

**Rationale**: Kernel module không thể được xử lý như một tiến trình user-space thông thường. Việc tách đây thành một workflow riêng giúp mô tả đúng quyền hạn, giảm nhầm lẫn cho người dùng, và phù hợp với tiêu chí kiểm thử load/unload rõ ràng.

**Alternatives considered**:
- Cho mọi container ứng dụng đều có quyền nạp module: dễ thao tác nhưng tăng blast radius và làm mờ ranh giới trách nhiệm.
- Nạp thủ công hoàn toàn ngoài container: khả thi nhưng không phản ánh mục tiêu “load từ container”.

## Decision 4: Chuẩn hóa một device node duy nhất cho luồng request/response

**Decision**: Hệ thống dùng một device node logic duy nhất để client gửi dữ liệu vào driver và nhận kết quả xử lý trả về.

**Rationale**: Với phạm vi demo, một điểm truy cập duy nhất giúp tài liệu hóa, kiểm thử và quan sát đơn giản hơn. Nó cũng phù hợp với spec hiện tại vốn mô tả rõ luồng `Client -> /dev/device -> Driver -> Client`.

**Alternatives considered**:
- Tách nhiều device node theo từng chức năng: linh hoạt hơn nhưng phức tạp hóa trải nghiệm demo.
- Dùng giao tiếp gián tiếp qua file trung gian hoặc service proxy: dễ triển khai ở user space nhưng làm yếu mục tiêu minh họa device-driver interaction.

## Decision 5: Hỗ trợ hai chế độ xử lý dữ liệu tách biệt ở mức nghiệp vụ

**Decision**: Driver hỗ trợ hai loại kết quả nghiệp vụ độc lập: thay thế ký tự và tạo giá trị băm; mỗi request chỉ cần đi theo một chế độ xử lý chính.

**Rationale**: Quy ước này khớp với assumptions trong spec, giữ cho kết quả dễ dự đoán và dễ kiểm thử. Nó cũng tránh mơ hồ về việc một request có phải trả đồng thời nhiều kiểu output hay không.

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
- Phạm vi được giữ ở mức local development/demo trên Docker Desktop, không mở rộng sang production deployment hay multi-host orchestration.
