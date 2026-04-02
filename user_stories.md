# User Stories — Hệ thống chat Socket sử dụng Linux Kernel Module

## Epic 1: Thiết lập môi trường phát triển trên Ubuntu/Linux

### US-01: Chuẩn bị môi trường Ubuntu cho phát triển
**Là một** developer  
**Tôi muốn** có môi trường Ubuntu/Linux host được cấu hình sẵn cho phát triển  
**Để** tôi có thể build, chạy và debug Client/Server trực tiếp trên host.

**Acceptance Criteria**
- Host Ubuntu có đầy đủ công cụ: `make`, `gcc`, `g++`, `libc`, `bash`, `iproute2`, `net-tools`.
- Có thể chạy lệnh kiểm tra phiên bản như `gcc --version`, `make --version`.
- Source code dự án sẵn sàng trên host để phát triển.

### US-02: Build mã nguồn ứng dụng trên host
**Là một** developer  
**Tôi muốn** build Client và Server trực tiếp trên host  
**Để** đảm bảo môi trường build thống nhất giữa các máy Ubuntu/VPS.

**Acceptance Criteria**
- Có `Makefile` hoặc script build cho Client/Server.
- Lệnh build chạy thành công trên Ubuntu host.
- Binary đầu ra được tạo đúng vị trí.
- Không phụ thuộc Docker để build ứng dụng.

### US-03: Build mã nguồn Linux Kernel Module trong môi trường phù hợp
**Là một** developer  
**Tôi muốn** build driver kernel module với đúng header/kernel dependency  
**Để** module có thể nạp vào host kernel.

**Acceptance Criteria**
- Có hướng dẫn hoặc script build module.
- Module build ra file `.ko`.
- Phiên bản kernel headers tương thích với kernel đích.
- Có mô tả rõ yêu cầu môi trường build trên host.

## Epic 2: Nạp Linux Kernel Module trên host

### US-04: Nạp module vào host kernel
**Là một** developer  
**Tôi muốn** nạp driver kernel module trên host  
**Để** ứng dụng có thể giao tiếp với driver chạy trong nhân Linux.

**Acceptance Criteria**
- Có cơ chế `insmod`/`modprobe` trên host.
- Người dùng biết cần quyền root phù hợp.
- Sau khi nạp, có thể kiểm tra module bằng `lsmod`.
- Có thể xem log kernel bằng `dmesg` để xác nhận module đã load thành công.

### US-05: Gỡ module an toàn
**Là một** developer  
**Tôi muốn** unload kernel module khi cần  
**Để** cập nhật, sửa lỗi hoặc shutdown hệ thống an toàn.

**Acceptance Criteria**
- Có lệnh/script `rmmod` hoặc tương đương.
- Module được unload mà không làm treo hệ thống.
- Có log xác nhận unload thành công.
- Nếu device đang được sử dụng, hệ thống trả về lỗi rõ ràng.

### US-06: Tạo device file để user-space truy cập driver
**Là một** developer  
**Tôi muốn** driver tạo hoặc expose device node như `/dev/device`  
**Để** Client có thể đọc/ghi dữ liệu qua character device.

**Acceptance Criteria**
- Sau khi module load, tồn tại device node `/dev/device` hoặc node tương đương.
- Client có thể truy cập device node này.
- Quyền đọc/ghi của device được cấu hình hợp lý.
- Có thể kiểm tra bằng `ls -l /dev/device`.

## Epic 3: Luồng dữ liệu Client → Device → Driver → Client

### US-07: Gửi dữ liệu từ Client đến device driver
**Là một** người dùng hệ thống  
**Tôi muốn** Client gửi message vào `/dev/device`  
**Để** driver xử lý dữ liệu trước khi trả kết quả.

**Acceptance Criteria**
- Client mở được `/dev/device`.
- Client ghi được chuỗi đầu vào xuống device.
- Driver nhận đúng dữ liệu từ user space.
- Có log hoặc cơ chế kiểm tra dữ liệu đã đi vào driver.

### US-08: Driver mã hóa bằng Substitution Cipher
**Là một** người dùng hệ thống  
**Tôi muốn** driver thực hiện mã hóa kiểu Substitution  
**Để** nội dung chat được biến đổi trước khi gửi/hiển thị.

**Acceptance Criteria**
- Driver nhận dữ liệu plaintext từ Client.
- Driver áp dụng quy tắc substitution đã định nghĩa.
- Kết quả mã hóa được trả về đúng định dạng.
- Với cùng đầu vào, kết quả luôn nhất quán theo bảng thay thế.

### US-09: Driver băm dữ liệu bằng SHA1
**Là một** người dùng hệ thống  
**Tôi muốn** driver tạo giá trị SHA1 của message  
**Để** kiểm tra tính toàn vẹn hoặc đối chiếu nội dung.

**Acceptance Criteria**
- Driver hỗ trợ tính SHA1 cho dữ liệu nhận vào.
- Kết quả SHA1 có độ dài đúng chuẩn.
- Client nhận được chuỗi hash từ driver.
- Có thể kiểm tra kết quả với bộ test known input/known output.

### US-10: Trả kết quả xử lý từ driver về lại Client
**Là một** người dùng hệ thống  
**Tôi muốn** nhận lại dữ liệu đã được driver xử lý  
**Để** Client có thể hiển thị kết quả mã hóa hoặc hash.

**Acceptance Criteria**
- Sau khi Client ghi dữ liệu vào `/dev/device`, Client đọc lại được kết quả.
- Kết quả trả về có thể là text mã hóa, SHA1 hoặc cả hai.
- Không mất dữ liệu trong quá trình read/write.
- Driver xử lý đúng nhiều request liên tiếp.

### US-11: Tích hợp luồng chat với socket giữa Client và Server
**Là một** người dùng chat  
**Tôi muốn** message được truyền qua socket giữa Client và Server  
**Để** hai đầu cuối có thể trao đổi dữ liệu qua mạng host.

**Acceptance Criteria**
- Server lắng nghe trên một cổng xác định.
- Client kết nối được đến Server trên host hoặc VPS.
- Message gửi từ Client đến Server và phản hồi thành công.
- Trước hoặc sau khi truyền socket, message đi qua driver theo thiết kế hệ thống.

### US-12: Kết nối luồng tổng thể Client -> /dev/device -> Driver -> Client
**Là một** người kiểm thử hệ thống  
**Tôi muốn** xác minh toàn bộ pipeline dữ liệu  
**Để** đảm bảo kiến trúc hoạt động đúng đầu-cuối.

**Acceptance Criteria**
- Client gửi message đầu vào.
- Message đi qua `/dev/device`.
- Driver trong kernel xử lý dữ liệu.
- Kết quả được trả lại cho Client và hiển thị đúng.
- Có test demo end-to-end cho toàn bộ luồng.

## Epic 4: Vận hành và kiểm thử

### US-13: Ghi log để theo dõi hoạt động của driver
**Là một** developer  
**Tôi muốn** driver ghi log các thao tác chính  
**Để** dễ debug quá trình nhận, xử lý và trả dữ liệu.

**Acceptance Criteria**
- Có log khi module load/unload.
- Có log khi device open/read/write/close.
- Có log khi thực hiện Substitution và SHA1.
- Có thể xem log qua `dmesg`.

### US-14: Kiểm thử tương thích giữa ứng dụng và kernel module
**Là một** tester  
**Tôi muốn** xác nhận ứng dụng Ubuntu truy cập được driver trên host kernel  
**Để** đảm bảo cơ chế tích hợp Linux host + kernel module hoạt động ổn định.

**Acceptance Criteria**
- Có checklist kiểm thử truy cập device.
- Có test khi module chưa load, load thành công, unload.
- Có test cho lỗi permission hoặc sai kernel version.
- Có tài liệu cách xử lý các lỗi tích hợp phổ biến.

### US-15: Tài liệu hóa quy trình chạy hệ thống
**Là một** thành viên mới trong nhóm  
**Tôi muốn** có hướng dẫn từng bước để chạy toàn bộ hệ thống  
**Để** tôi có thể dựng môi trường và demo dự án nhanh chóng.

**Acceptance Criteria**
- Có hướng dẫn cài dependencies trên Ubuntu.
- Có hướng dẫn build/load/unload module.
- Có hướng dẫn chạy Server và Client.
- Có ví dụ input/output minh họa luồng `Client -> /dev/device -> Driver -> Client`.
