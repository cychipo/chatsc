# Đặc tả tính năng: Dịch vụ mã hoá từ xa

**Nhánh tính năng**: `007-remote-encryption-service`  
**Ngày tạo**: 2026-04-05  
**Trạng thái**: Bản nháp  
**Đầu vào**: Mô tả người dùng: "oke thế bây giừo bạn đọc toàn bộ code C của hệ thống này, sau đó lên plan để sửa lại làm sao để tôi vào vps pull code mới về chạy bằng một công cụ gì đó là có thể cho phía dev gọi tới để thực hiện mã hoá, chú ý phần này bạn cần đảm bảo khi tắt terminus kết nối tới vps thì nó vẫn được chạy ấy"

## Kịch bản người dùng & kiểm thử *(bắt buộc)*

### Câu chuyện người dùng 1 - Dùng mã hoá từ xa từ máy dev (Ưu tiên: P1)

Là một lập trình viên đang làm việc trên macOS, tôi muốn gửi plaintext tới khả năng mã hoá từ xa đang chạy trên VPS Ubuntu và nhận lại kết quả đã được xử lý, để tôi có thể tiếp tục phát triển và kiểm thử các tính năng phụ thuộc vào hành vi mã hoá chỉ có trên Linux.

**Lý do ưu tiên**: Nếu không có khả năng này, lập trình viên sẽ không thể kiểm thử luồng mã hoá thật trong quá trình phát triển hằng ngày.

**Kiểm thử độc lập**: Có thể kiểm thử đầy đủ bằng cách gửi một request chứa plaintext từ máy phát triển tới VPS và xác minh rằng kết quả trả về khớp với phép biến đổi được xử lý trên môi trường Linux.

**Kịch bản chấp nhận**:

1. **Cho trước** khả năng mã hoá từ xa đang sẵn sàng trên VPS, **Khi** một lập trình viên gửi request mã hoá hợp lệ từ máy phát triển, **Thì** hệ thống trả về kết quả đã xử lý mà không yêu cầu truy cập kernel Linux ở máy local.
2. **Cho trước** khả năng mã hoá từ xa đang sẵn sàng trên VPS, **Khi** một lập trình viên gửi request giải mã hoặc xử lý mật khẩu hợp lệ, **Thì** hệ thống trả về kết quả tương ứng từ khả năng xử lý trên VPS.

---

### Câu chuyện người dùng 2 - Giữ khả năng xử lý trên VPS tiếp tục chạy sau khi ngắt kết nối (Ưu tiên: P2)

Là một lập trình viên triển khai dịch vụ trên VPS, tôi muốn khả năng mã hoá vẫn tiếp tục chạy sau khi tôi đóng Terminus hoặc ngắt kết nối SSH, để môi trường phát triển vẫn có thể sử dụng mà không cần giữ một phiên terminal luôn mở.

**Lý do ưu tiên**: Một khả năng xử lý từ xa mà dừng ngay khi ngắt kết nối sẽ không đủ ổn định để dùng lặp lại trong quá trình phát triển và kiểm thử.

**Kiểm thử độc lập**: Có thể kiểm thử đầy đủ bằng cách khởi động khả năng xử lý trên VPS, đóng phiên terminal, kết nối lại sau đó và xác minh rằng các request mã hoá mới vẫn thành công.

**Kịch bản chấp nhận**:

1. **Cho trước** khả năng xử lý từ xa đã được khởi động thành công, **Khi** người vận hành ngắt phiên terminal, **Thì** khả năng này vẫn tiếp tục chấp nhận request.
2. **Cho trước** khả năng xử lý từ xa đã dừng ngoài ý muốn, **Khi** người vận hành kiểm tra trạng thái hoặc khởi động lại nó, **Thì** khả năng này có thể được đưa trở lại trạng thái phục vụ mà không cần cấu hình thủ công lại.

---

### Câu chuyện người dùng 3 - Cập nhật khả năng xử lý từ xa sau khi pull code mới (Ưu tiên: P3)

Là một lập trình viên duy trì môi trường VPS, tôi muốn pull phiên bản code mới nhất và chạy một quy trình triển khai có thể lặp lại, để tôi có thể cập nhật khả năng mã hoá từ xa mà không cần các bước thiết lập thủ công rời rạc.

**Lý do ưu tiên**: Quy trình triển khai nhất quán giúp giảm ma sát và tránh sai lệch môi trường sau mỗi lần cập nhật code.

**Kiểm thử độc lập**: Có thể kiểm thử đầy đủ bằng cách pull một revision mới trên VPS, chạy quy trình triển khai đã tài liệu hoá và xác nhận rằng khả năng xử lý đã cập nhật có thể phục vụ các request mới thành công.

**Kịch bản chấp nhận**:

1. **Cho trước** có một revision code mới hơn, **Khi** người vận hành pull code mới nhất và chạy quy trình triển khai, **Thì** khả năng xử lý từ xa trở nên sẵn sàng với phiên bản code đã cập nhật.
2. **Cho trước** quy trình triển khai đã hoàn tất thành công, **Khi** người vận hành xác minh dịch vụ, **Thì** người đó có thể xác nhận khả năng xử lý đang chạy và có thể được gọi tới cho mục đích phát triển.

---

### Các trường hợp biên

- Điều gì xảy ra khi khả năng mã hoá trên VPS không thể truy cập được từ máy phát triển?
- Hệ thống phản hồi thế nào khi một request yêu cầu chế độ xử lý không được hỗ trợ?
- Điều gì xảy ra khi người vận hành triển khai code mới trong lúc các request trước đó vẫn đang được xử lý?
- Hệ thống hoạt động thế nào khi bộ xử lý dựa trên Linux trả về lỗi thay vì một kết quả hợp lệ?

## Yêu cầu *(bắt buộc)*

### Yêu cầu chức năng

- **FR-001**: Hệ thống PHẢI cung cấp một khả năng xử lý có thể truy cập từ xa trên VPS Ubuntu để các môi trường phát triển không có quyền truy cập kernel Linux vẫn có thể yêu cầu các thao tác liên quan đến mã hoá.
- **FR-002**: Hệ thống PHẢI hỗ trợ các thao tác xử lý hiện đang cần cho luồng chat, bao gồm xử lý mật khẩu, mã hoá tin nhắn và giải mã tin nhắn.
- **FR-003**: Lập trình viên PHẢI có thể gọi khả năng xử lý từ xa này từ luồng phát triển của mình mà không cần mở một phiên terminal tương tác liên tục trên VPS.
- **FR-004**: Hệ thống PHẢI giữ cho khả năng xử lý trên VPS tiếp tục chạy sau khi người vận hành ngắt Terminus hoặc SSH.
- **FR-005**: Hệ thống PHẢI cung cấp một quy trình triển khai có thể lặp lại để người vận hành pull code mới nhất trên VPS và đưa khả năng xử lý đã cập nhật vào phục vụ.
- **FR-006**: Hệ thống PHẢI cung cấp cách để người vận hành xác nhận liệu khả năng xử lý trên VPS có đang chạy và có thể phục vụ request hay không.
- **FR-007**: Hệ thống PHẢI trả về lỗi rõ ràng khi khả năng xử lý từ xa không thể hoàn thành request do đầu vào không hợp lệ, do không sẵn sàng phục vụ, hoặc do lỗi nội bộ trong quá trình xử lý.
- **FR-008**: Hệ thống PHẢI giữ khả năng tương thích với hình dạng request và kết quả liên quan đến chat hiện có, vốn cần cho các luồng phát triển và kiểm thử.
- **FR-009**: Hệ thống PHẢI đảm bảo rằng môi trường phát triển có thể chuyển từ xử lý cục bộ chỉ chạy được trên Linux sang khả năng xử lý dựa trên VPS mà không làm thay đổi hành vi chat hiển thị với người dùng.

### Thực thể chính *(bao gồm nếu tính năng có dữ liệu)*

- **Request xử lý từ xa**: Một request do môi trường phát triển khởi tạo, chứa loại thao tác, ngữ cảnh người dùng liên quan, và dữ liệu plaintext hoặc đầu vào xuất phát từ thông tin xác thực cần được xử lý trên VPS.
- **Kết quả xử lý từ xa**: Kết quả trả về của một request từ xa, bao gồm trạng thái thành công hoặc thất bại và payload đã được xử lý nếu có.
- **Lần triển khai**: Một thao tác có thể lặp lại của người vận hành nhằm cập nhật môi trường VPS lên phiên bản code mới nhất và đưa khả năng xử lý từ xa vào phục vụ.
- **Trạng thái chạy của dịch vụ**: Trạng thái có thể quan sát được của khả năng xử lý trên VPS, ví dụ như đang chạy, không sẵn sàng, hoặc đang khôi phục, được dùng để xác minh rằng môi trường phát triển có thể tin cậy vào nó.

## Tiêu chí thành công *(bắt buộc)*

### Kết quả đo lường được

- **SC-001**: Một lập trình viên trên macOS có thể hoàn thành một bài kiểm thử mã hoá từ xa thành công với VPS trong vòng 5 phút sau khi khởi động môi trường phát triển local.
- **SC-002**: Sau khi người vận hành ngắt Terminus hoặc SSH, khả năng xử lý trên VPS vẫn sẵn sàng cho các request mới mà không cần bước kết nối lại thủ công nào.
- **SC-003**: Trong kiểm thử xác thực, 95% request xử lý từ xa hợp lệ trả về kết quả trong vòng 2 giây dưới tải phát triển thông thường.
- **SC-004**: Người vận hành có thể cập nhật khả năng xử lý trên VPS lên revision code mới bằng một quy trình triển khai duy nhất đã được tài liệu hoá mà không có bước thủ công không được ghi lại nào.
- **SC-005**: Trong kiểm thử chấp nhận, tất cả các chế độ xử lý hiện đang được luồng chat sử dụng đều cho ra cùng kết quả khi đi qua khả năng xử lý dựa trên VPS như khi đi qua luồng xử lý cục bộ dựa trên Linux.

## Giả định

- VPS Ubuntu sẽ tiếp tục là môi trường chuẩn cho xử lý dựa trên Linux trong quá trình phát triển.
- Khả năng xử lý từ xa này chủ yếu phục vụ cho mục đích phát triển và kiểm thử, không phải cho lưu lượng người dùng cuối công khai.
- Các luồng chat và định dạng payload hiện có vẫn là nguồn tham chiếu chính để xác định những thao tác xử lý nào phải được hỗ trợ.
- Một quy trình vận hành duy nhất, đã được tài liệu hoá là đủ để cập nhật và kích hoạt lại khả năng xử lý trên VPS sau khi pull code mới.
- Khi cần xử lý từ xa, kết nối mạng cơ bản giữa máy phát triển và VPS sẽ sẵn sàng.
