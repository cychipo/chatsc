# Feature Specification: Hệ thống chat Socket với Linux Kernel Module

**Feature Branch**: `001-socket-chat-kmod`  
**Created**: 2026-04-02  
**Status**: Draft  
**Input**: User description: "bạn gen spec chi @user_stories.md nhé, không cần tạo nhánh mới làm gì đâu"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chuẩn bị môi trường phát triển thống nhất (Priority: P1)

Là một developer, tôi cần một môi trường Ubuntu/Linux host với đầy đủ công cụ build để có thể biên dịch, chạy và kiểm tra các thành phần của hệ thống chat mà không phụ thuộc vào Docker.

**Why this priority**: Đây là điều kiện tiên quyết để mọi thành viên có thể phát triển và kiểm thử hệ thống theo cùng một cách trên Ubuntu host hoặc VPS.

**Independent Test**: Có thể kiểm thử độc lập bằng cách xác nhận các công cụ cần thiết có sẵn trên host, và hoàn thành một lần build ứng dụng từ source code trên host.

**Acceptance Scenarios**:

1. **Given** một host Ubuntu với build tools đã cài, **When** developer chạy quy trình build ứng dụng, **Then** hệ thống phải tạo ra các tệp đầu ra cần thiết mà không yêu cầu container.
2. **Given** source code của hệ thống đã có trên host, **When** developer chạy quy trình build ứng dụng, **Then** developer có thể biên dịch lại toàn bộ client/server trực tiếp trên host.

---

### User Story 2 - Nạp driver và cung cấp điểm truy cập thiết bị (Priority: P1)

Là một developer, tôi cần nạp driver mã hóa vào host kernel và cung cấp device node để ứng dụng trên host có thể trao đổi dữ liệu với driver.

**Why this priority**: Nếu không có driver được nạp và device node sẵn sàng, luồng xử lý dữ liệu cốt lõi của hệ thống sẽ không hoạt động.

**Independent Test**: Có thể kiểm thử độc lập bằng cách nạp driver, xác nhận driver xuất hiện trong môi trường kernel đích, và xác nhận device node có thể được ứng dụng trên host truy cập.

**Acceptance Scenarios**:

1. **Given** driver đã được biên dịch hợp lệ, **When** developer thực hiện quy trình nạp driver, **Then** driver phải được nạp thành công vào host kernel.
2. **Given** driver đã được nạp thành công, **When** developer kiểm tra điểm truy cập thiết bị, **Then** device node phải tồn tại và cho phép ứng dụng hợp lệ trên host mở để đọc và ghi dữ liệu.
3. **Given** driver đang được sử dụng, **When** developer yêu cầu gỡ driver, **Then** hệ thống phải phản hồi an toàn và cung cấp thông tin lỗi rõ ràng nếu thao tác chưa thể thực hiện.

---

### User Story 3 - Xử lý dữ liệu qua driver và trả kết quả về client (Priority: P1)

Là một người dùng hệ thống, tôi muốn client gửi message vào device, để driver xử lý bằng phép thay thế ký tự hoặc tạo giá trị băm, rồi trả kết quả về lại client để hiển thị hoặc tiếp tục luồng chat.

**Why this priority**: Đây là giá trị cốt lõi của hệ thống vì chứng minh được luồng dữ liệu từ user space đến kernel space và quay trở lại ứng dụng.

**Independent Test**: Có thể kiểm thử độc lập bằng cách gửi một message từ client vào device, xác nhận driver xử lý đúng, và đối chiếu kết quả trả về với đầu ra mong đợi.

**Acceptance Scenarios**:

1. **Given** client có quyền truy cập device, **When** client gửi một message hợp lệ vào device, **Then** driver phải nhận được đầy đủ nội dung message.
2. **Given** driver nhận được message cần mã hóa, **When** driver thực hiện phép thay thế ký tự, **Then** client phải nhận lại được chuỗi đã mã hóa đúng theo quy tắc đã công bố.
3. **Given** driver nhận được message cần kiểm tra toàn vẹn, **When** driver tạo giá trị băm của message, **Then** client phải nhận lại được giá trị băm nhất quán với cùng đầu vào.
4. **Given** client gửi nhiều message liên tiếp, **When** driver xử lý tuần tự các yêu cầu, **Then** mỗi kết quả trả về phải tương ứng đúng với message đã gửi.

---

### User Story 4 - Truyền message chat giữa client và server qua socket trên host (Priority: P2)

Là một người dùng chat, tôi muốn client và server trao đổi message qua kết nối socket trên host để chứng minh hệ thống chat hoạt động như một ứng dụng hoàn chỉnh thay vì chỉ là bài kiểm thử device.

**Why this priority**: Sau khi luồng xử lý cốt lõi hoạt động, việc tích hợp socket hoàn thiện trải nghiệm hệ thống chat đầu cuối.

**Independent Test**: Có thể kiểm thử độc lập bằng cách khởi động server, kết nối client đến server, gửi message, và xác nhận dữ liệu được truyền và phản hồi thành công qua socket.

**Acceptance Scenarios**:

1. **Given** server đang lắng nghe kết nối trên host, **When** client yêu cầu kết nối, **Then** kết nối phải được thiết lập thành công.
2. **Given** client và server đã kết nối, **When** client gửi một message chat, **Then** server phải nhận được message và có thể gửi phản hồi về lại client.
3. **Given** thiết kế hệ thống yêu cầu dữ liệu đi qua driver, **When** message được xử lý trong phiên chat, **Then** kết quả hiển thị ở client phải phản ánh dữ liệu đã qua bước xử lý của driver.

---

### User Story 5 - Quan sát, kiểm thử và bàn giao hệ thống (Priority: P3)

Là một tester hoặc thành viên mới, tôi muốn có log vận hành và tài liệu chạy hệ thống để có thể kiểm tra, chẩn đoán lỗi và demo toàn bộ luồng từ đầu đến cuối trên Ubuntu host hoặc VPS.

**Why this priority**: Tính quan sát và tài liệu giúp nhóm xác minh kết quả, giảm thời gian debug và hỗ trợ bàn giao dự án.

**Independent Test**: Có thể kiểm thử độc lập bằng cách thực hiện demo end-to-end, đối chiếu log của các thao tác chính và làm theo tài liệu để dựng lại hệ thống trên môi trường Ubuntu mới.

**Acceptance Scenarios**:

1. **Given** hệ thống đang chạy, **When** tester thực hiện các thao tác load, gửi dữ liệu, đọc kết quả và unload, **Then** các sự kiện chính phải được ghi nhận trong log để hỗ trợ kiểm tra.
2. **Given** một thành viên mới của nhóm, **When** họ làm theo tài liệu dự án, **Then** họ phải có thể dựng môi trường và chạy được luồng demo hoàn chỉnh mà không cần hướng dẫn miệng bổ sung.

### Edge Cases

- Driver chưa được nạp nhưng client cố mở device để gửi dữ liệu.
- Device node tồn tại nhưng tiến trình hiện tại không có quyền đọc hoặc ghi.
- Driver nhận message rỗng, message vượt quá giới hạn hỗ trợ hoặc message chứa ký tự ngoài tập thay thế.
- Developer cố gỡ driver khi vẫn còn tiến trình đang giữ device mở.
- Phiên bản môi trường build của driver không tương thích với host kernel, khiến driver không thể nạp.
- Client hoặc server mất kết nối socket trong khi một yêu cầu chat đang được xử lý.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST cung cấp môi trường Ubuntu/Linux host để phát triển và kiểm thử ứng dụng chat.
- **FR-002**: Môi trường phát triển trên host MUST bao gồm đầy đủ công cụ cần thiết để biên dịch các thành phần ứng dụng trong không gian người dùng.
- **FR-003**: Hệ thống MUST cho phép developer biên dịch ứng dụng client và server trực tiếp trên host.
- **FR-004**: Hệ thống MUST cung cấp quy trình biên dịch driver để tạo ra một gói module sẵn sàng nạp vào host kernel.
- **FR-005**: Hệ thống MUST cung cấp quy trình nạp driver từ host vào host kernel.
- **FR-006**: Hệ thống MUST cung cấp cách xác nhận rằng driver đã được nạp thành công vào kernel đích.
- **FR-007**: Sau khi driver được nạp, hệ thống MUST cung cấp một device node để ứng dụng trên host có thể trao đổi dữ liệu với driver.
- **FR-008**: Hệ thống MUST cho phép client ghi message vào device node để gửi dữ liệu đến driver.
- **FR-009**: Driver MUST nhận dữ liệu từ client và xử lý theo một trong hai chế độ nghiệp vụ đã xác định: thay thế ký tự hoặc tạo giá trị băm.
- **FR-010**: Khi xử lý theo chế độ thay thế ký tự, hệ thống MUST trả về kết quả nhất quán với cùng đầu vào và cùng quy tắc thay thế.
- **FR-011**: Khi xử lý theo chế độ tạo giá trị băm, hệ thống MUST trả về cùng một giá trị băm cho cùng một đầu vào.
- **FR-012**: Hệ thống MUST cho phép client đọc lại kết quả đã được driver xử lý thông qua device node.
- **FR-013**: Hệ thống MUST duy trì tính tương ứng một-một giữa mỗi message đầu vào và kết quả trả về cho client.
- **FR-014**: Hệ thống MUST cho phép client và server thiết lập kết nối chat qua socket trên host.
- **FR-015**: Hệ thống MUST hỗ trợ truyền message chat giữa client và server sau khi kết nối được thiết lập.
- **FR-016**: Hệ thống MUST hỗ trợ một luồng demo đầu-cuối trong đó message đi từ client, qua device node, được driver xử lý và trả kết quả về lại client.
- **FR-017**: Hệ thống MUST cung cấp log cho các sự kiện vận hành chính của driver để phục vụ kiểm thử và chẩn đoán lỗi.
- **FR-018**: Hệ thống MUST cung cấp quy trình gỡ driver an toàn và phản hồi rõ ràng khi chưa thể gỡ.
- **FR-019**: Hệ thống MUST cung cấp tài liệu hướng dẫn dựng môi trường, chạy hệ thống và kiểm thử luồng chính trên Ubuntu/Linux host.

### Key Entities *(include if feature involves data)*

- **Chat Message**: Nội dung do client gửi để chat hoặc yêu cầu xử lý, bao gồm dữ liệu đầu vào và kết quả trả về tương ứng.
- **Client Session**: Phiên làm việc của client với server và device, đại diện cho ngữ cảnh gửi nhận message của một người dùng.
- **Device Request**: Một yêu cầu ghi hoặc đọc giữa client và device node, gắn với đúng một message được xử lý.
- **Driver Processing Result**: Kết quả do driver sinh ra từ một message đầu vào, có thể là dữ liệu đã thay thế ký tự hoặc giá trị băm.
- **Module Lifecycle Event**: Sự kiện vận hành liên quan đến nạp, gỡ và truy cập driver, phục vụ theo dõi trạng thái hệ thống.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% thành viên dự án có thể dựng được môi trường phát triển chuẩn và hoàn thành lần build ứng dụng đầu tiên chỉ bằng tài liệu dự án.
- **SC-002**: 100% lần thử nạp driver hợp lệ trong môi trường mục tiêu đều tạo ra trạng thái sẵn sàng để ứng dụng trên host truy cập device node.
- **SC-003**: Trong bộ kiểm thử chấp nhận, 100% message mẫu hợp lệ gửi từ client đến driver đều nhận lại được kết quả xử lý đúng với đầu ra mong đợi.
- **SC-004**: Trong bộ kiểm thử chấp nhận, 100% message giống nhau tạo ra kết quả thay thế ký tự và giá trị băm nhất quán qua nhiều lần chạy.
- **SC-005**: Người kiểm thử có thể hoàn thành demo đầu-cuối từ gửi message đến nhận kết quả trong không quá 5 phút bằng tài liệu hướng dẫn.
- **SC-006**: Ít nhất 90% lỗi tích hợp phổ biến trong quá trình dựng môi trường hoặc nạp driver có thể được chẩn đoán từ log và hướng dẫn đi kèm mà không cần hỗ trợ trực tiếp từ tác giả hệ thống.

## Assumptions

- Hệ thống được chạy trên Ubuntu host hoặc VPS Ubuntu có quyền cài kernel headers phù hợp.
- Developer hoặc tester có quyền root khi cần load/unload kernel module.
- Môi trường mục tiêu ưu tiên host-native demo thay vì containerized workflow.
