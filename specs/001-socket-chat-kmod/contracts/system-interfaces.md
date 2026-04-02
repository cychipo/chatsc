# System Interfaces Contract

## Purpose

Tài liệu này mô tả các giao diện bên ngoài và ranh giới tích hợp của hệ thống chat Socket với Linux Kernel Module ở mức hành vi, phục vụ thiết kế và kiểm thử.

## 1. Developer Environment Interface

### Actor
- Developer

### Contract
- Hệ thống phải cung cấp một môi trường phát triển chuẩn trên Ubuntu/Linux host.
- Môi trường này phải cho phép build các thành phần user-space của hệ thống mà không yêu cầu Docker.
- Source code phải sẵn sàng để developer chỉnh sửa và build trực tiếp trên host.

### Observable Outcomes
- Developer có thể xác nhận công cụ build sẵn sàng.
- Developer có thể hoàn tất một vòng build ứng dụng từ source.

## 2. Module Lifecycle Interface

### Actor
- Developer hoặc tester

### Contract
- Hệ thống phải cung cấp một quy trình nạp driver vào kernel đích.
- Hệ thống phải cung cấp một quy trình xác nhận driver đã hoạt động.
- Hệ thống phải cung cấp một quy trình gỡ driver an toàn.
- Khi việc gỡ chưa thể thực hiện, hệ thống phải trả về phản hồi rõ ràng.

### Observable Outcomes
- Người vận hành biết khi nào driver đã ở trạng thái sẵn sàng.
- Người vận hành biết khi nào thao tác gỡ thất bại và lý do ở mức đủ để xử lý tiếp.

## 3. Device Interaction Interface

### Actor
- Client application

### Contract
- Client phải có thể mở device node hợp lệ do driver cung cấp.
- Client phải có thể ghi message đầu vào vào device.
- Client phải có thể đọc lại kết quả xử lý từ device.
- Mỗi message gửi vào phải có tối đa một kết quả tương ứng trong phạm vi v1.

### Observable Outcomes
- Một request hợp lệ tạo ra một kết quả hợp lệ.
- Các request liên tiếp không được trộn lẫn kết quả.

## 4. Driver Processing Interface

### Actor
- Driver

### Contract
- Driver phải nhận dữ liệu đầu vào từ client thông qua device interaction.
- Driver phải xử lý message theo một chế độ nghiệp vụ được yêu cầu.
- Driver phải trả về kết quả nhất quán với cùng đầu vào và cùng chế độ xử lý.

### Supported Business Modes
- Substitution
- SHA1

### Observable Outcomes
- Với cùng message và cùng chế độ, kết quả luôn lặp lại nhất quán.
- Message không hợp lệ hoặc ngoài phạm vi hỗ trợ phải được phản hồi theo cách có thể chẩn đoán.

## 5. Chat Session Interface

### Actor
- End user

### Contract
- Client và server phải thiết lập được phiên chat qua socket trên host.
- Client phải gửi được message cho server và nhận phản hồi.
- Luồng chat hoàn chỉnh phải phản ánh kết quả sau bước xử lý của driver khi áp dụng.

### Observable Outcomes
- Người dùng thấy được message hoặc phản hồi tương ứng trong phiên chat.
- Mất kết nối hoặc lỗi tích hợp phải thể hiện thành trạng thái thất bại quan sát được.

## 6. Observability Interface

### Actor
- Tester, developer, thành viên mới

### Contract
- Hệ thống phải cung cấp log cho các sự kiện vận hành chính.
- Hệ thống phải cung cấp tài liệu đủ để một người mới có thể dựng môi trường và chạy demo.

### Observable Outcomes
- Tester có thể lần theo các bước vận hành chính qua log.
- Thành viên mới có thể dựng và demo hệ thống mà không cần hướng dẫn trực tiếp.
