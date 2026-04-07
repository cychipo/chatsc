# Đặc tả tính năng: Deploy full stack bằng compose trên VPS

**Nhánh tính năng**: `011-deploy-compose-flow`  
**Ngày tạo**: 2026-04-06  
**Trạng thái**: Draft  
**Đầu vào**: Mô tả người dùng: "tôi muốn tạo một luồng deploy cho cả fe và be, phía vps sẽ clone về và dùng docker compose để chạy, tôi muốn port của be là 5634, port fe là 5734, db sẽ build trong docker luôn"

## User Scenarios & Testing *(bắt buộc)*

### User Story 1 - Khởi chạy toàn bộ hệ thống trên VPS (Ưu tiên: P1)

Là người duy trì dự án, tôi muốn VPS có thể khởi chạy frontend, backend và database cùng nhau từ repository để tôi có thể deploy một môi trường hoạt động bằng một quy trình thống nhất.

**Lý do ưu tiên**: Đây là giá trị cốt lõi của tính năng. Nếu không có một luồng deploy full-stack hoạt động được thì tính năng này chưa tạo ra giá trị sử dụng thực tế.

**Kiểm thử độc lập**: Trên một VPS sạch, clone repository, chạy quy trình deploy đã được mô tả, rồi xác nhận frontend, backend và database đều khởi động thành công và duy trì trạng thái hoạt động ổn định.

**Kịch bản chấp nhận**:

1. **Cho trước** một VPS đã có sẵn runtime container cần thiết và repository đã được clone, **Khi** người vận hành khởi chạy luồng deploy, **Thì** frontend, backend và database đều được tạo và chạy cùng nhau.
2. **Cho trước** luồng deploy đã hoàn tất, **Khi** người vận hành kiểm tra các dịch vụ được mở ra ngoài, **Thì** backend có thể truy cập qua cổng 5634 và frontend có thể truy cập qua cổng 5734.
3. **Cho trước** toàn bộ hệ thống đang chạy, **Khi** người vận hành khởi động lại luồng deploy, **Thì** các dịch vụ phải được đưa lên lại một cách ổn định mà không cần dựng lại môi trường thủ công.

---

### User Story 2 - Dùng workflow triển khai bám theo repository trên VPS (Ưu tiên: P2)

Là người duy trì dự án, tôi muốn quy trình trên VPS hoạt động trực tiếp từ repository đã clone để tôi có thể cập nhật và deploy lại bằng đúng quy trình đã được quản lý trong source control.

**Lý do ưu tiên**: Một luồng triển khai lặp lại được và bám theo repository sẽ giảm sai lệch do thao tác thủ công, đồng thời giúp việc vận hành môi trường thật dễ kiểm soát hơn.

**Kiểm thử độc lập**: Clone repository vào một vị trí mới trên VPS, làm theo tài liệu deploy, sau đó cập nhật sang revision mới hơn và lặp lại đúng các bước đó thành công.

**Kịch bản chấp nhận**:

1. **Cho trước** người vận hành đã clone repository trên VPS, **Khi** họ làm theo tài liệu deploy, **Thì** họ có thể hoàn tất việc triển khai mà không cần sao chép file thủ công ra ngoài repository.
2. **Cho trước** có một revision ứng dụng mới hơn, **Khi** người vận hành cập nhật repository và chạy lại luồng deploy, **Thì** hệ thống được cập nhật thông qua đúng quy trình đã được tài liệu hoá.

---

### User Story 3 - Chạy database như một phần của cùng stack (Ưu tiên: P3)

Là người duy trì dự án, tôi muốn database được dựng như một phần của cùng stack deploy để tôi không cần chuẩn bị riêng database trước khi chạy ứng dụng.

**Lý do ưu tiên**: Đưa database vào cùng luồng deploy sẽ giảm số bước cài đặt và giúp việc provision ban đầu đơn giản hơn.

**Kiểm thử độc lập**: Chạy luồng deploy trên một VPS chưa được chuẩn bị database riêng, rồi xác nhận toàn bộ hệ thống vẫn khởi động thành công.

**Kịch bản chấp nhận**:

1. **Cho trước** VPS chưa cài sẵn một database độc lập bằng thao tác thủ công, **Khi** người vận hành khởi chạy luồng deploy, **Thì** database được tạo trong cùng stack và sẵn sàng cho backend sử dụng.
2. **Cho trước** toàn bộ hệ thống đang chạy, **Khi** backend khởi động, **Thì** backend có thể kết nối tới database đã được tạo trong stack deploy.

---

### Edge Cases

- Điều gì xảy ra khi một service khởi động chậm hơn các service còn lại trong lần deploy đầu tiên?
- Luồng deploy xử lý ra sao nếu cổng 5634 hoặc 5734 đã bị chiếm trên VPS?
- Luồng deploy phục hồi thế nào nếu backend khởi động trước khi database sẵn sàng nhận kết nối?
- Điều gì xảy ra khi VPS được khởi động lại và người vận hành cần đưa stack chạy lên lại?
- Các runtime setting bắt buộc sẽ được xử lý thế nào khi repository được clone lên một VPS mới lần đầu?

## Requirements *(bắt buộc)*

### Functional Requirements

- **FR-001**: Hệ thống PHẢI cung cấp một luồng deploy bám theo repository để frontend, backend và database có thể được khởi chạy cùng nhau trên một VPS.
- **FR-002**: Luồng deploy PHẢI thực thi được sau khi repository được clone lên VPS mà không yêu cầu người vận hành phải tự lắp ghép các service thủ công bên ngoài repository.
- **FR-003**: Luồng deploy PHẢI expose backend qua cổng 5634.
- **FR-004**: Luồng deploy PHẢI expose frontend qua cổng 5734.
- **FR-005**: Luồng deploy PHẢI provision database như một phần của cùng stack deploy, thay vì giả định database được quản lý riêng ở ngoài.
- **FR-006**: Luồng deploy PHẢI xác định rõ cách backend tìm thấy và kết nối tới database được tạo trong cùng stack.
- **FR-007**: Luồng deploy PHẢI tài liệu hoá các bước người vận hành cần thực hiện để deploy lần đầu trên VPS.
- **FR-008**: Luồng deploy PHẢI tài liệu hoá các bước người vận hành cần thực hiện để redeploy mã nguồn đã được cập nhật từ repository đã clone.
- **FR-009**: Luồng deploy PHẢI mô tả các runtime setting hoặc secrets cần được cung cấp trên VPS trước khi stack được khởi động.
- **FR-010**: Luồng deploy PHẢI thất bại với thông báo có thể hành động được khi thiếu runtime setting bắt buộc hoặc khi không thể bind các cổng yêu cầu.
- **FR-011**: Luồng deploy PHẢI hỗ trợ việc hạ toàn bộ stack xuống và đưa stack chạy lại bằng chính quy trình đã được tài liệu hoá.
- **FR-012**: Hệ thống PHẢI giữ lại dữ liệu ứng dụng qua các lần restart service thông thường, trừ khi người vận hành chủ động xoá dữ liệu đã lưu.

### Key Entities *(bao gồm nếu tính năng có dữ liệu)*

- **Deployment Stack**: Toàn bộ môi trường ứng dụng có thể chạy được trên VPS, bao gồm frontend, backend, database, các ràng buộc mạng và kỳ vọng về dữ liệu bền vững.
- **Service Runtime Configuration**: Tập hợp các giá trị theo môi trường và secrets cần thiết để các service khởi động đúng trên VPS.
- **Persistent Application Data**: Trạng thái ứng dụng được lưu trong database và phải được giữ lại qua các lần restart hoặc redeploy thông thường.
- **Operator Deployment Procedure**: Trình tự các bước được tài liệu hoá mà người duy trì sử dụng để deploy, cập nhật, restart và xử lý sự cố của stack trên VPS.

## Success Criteria *(bắt buộc)*

### Measurable Outcomes

- **SC-001**: Người duy trì có thể deploy toàn bộ stack từ một repository mới được clone trên VPS bằng một luồng đã được tài liệu hoá mà không cần thêm bước thủ công ngoài tài liệu.
- **SC-002**: Sau khi deploy, frontend truy cập được qua cổng 5734 và backend truy cập được qua cổng 5634 trong 100% các lần kiểm tra bám theo quy trình đã mô tả.
- **SC-003**: Trong ít nhất 3 lần kiểm tra liên tiếp với thao tác restart hoặc redeploy, toàn bộ stack trở lại trạng thái hoạt động mà không cần tạo lại database thủ công.
- **SC-004**: Người duy trì có thể làm theo tài liệu deploy trên một VPS mới và hoàn tất triển khai mà không cần hỏi thêm chi tiết vận hành còn thiếu.

## Assumptions

- VPS đích đã được cài sẵn container runtime và công cụ quản lý source code cần thiết.
- Luồng deploy này nhắm tới một VPS đơn lẻ, không phải nền tảng orchestration nhiều node.
- DNS ngoài, TLS termination và reverse proxy nằm ngoài phạm vi của phiên bản đầu tiên, trừ khi được yêu cầu thêm sau.
- Hành vi hiện có của ứng dụng không thay đổi; tính năng này chỉ tập trung vào đóng gói và luồng deploy.
- Các secrets bắt buộc và giá trị theo môi trường sẽ do người vận hành cung cấp trên VPS trước khi khởi động.
- Dữ liệu database được kỳ vọng sẽ tồn tại qua các lần stop/start và redeploy thông thường trên cùng một VPS.
