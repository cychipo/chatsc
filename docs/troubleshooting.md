# Troubleshooting Guide

## Device not found
- Confirm module đã được load
- Confirm `/dev/device` tồn tại
- Confirm client đang trỏ đúng `DEVICE_PATH`
- Client không còn fallback sang user-space; nếu device thiếu thì auth/chat sẽ fail

## Register failed
- Confirm username chỉ dùng chữ, số, `_`, `-`, hoặc `.`
- Confirm `users.db` writable bởi process server
- Nếu username đã tồn tại, dùng `login` thay vì `register`

## Login failed
- Confirm username đã tồn tại trong `users.db`
- Confirm driver SHA1 path hoạt động vì password hashing đi qua `/dev/device`
- Nếu cùng user đã login ở terminal khác, logout trước

## Peer selection failed
- Confirm target username tồn tại trong `users.db`
- Confirm user kia đang online
- Mở terminal client thứ hai trước khi chọn peer

## Module build failed
- Confirm host đã cài `linux-headers-$(uname -r)`
- Confirm `/lib/modules/$(uname -r)/build` tồn tại
- Nếu `KDIR` custom được dùng, confirm path đó có `Makefile`, `scripts/`, `.config`, và `include/generated/`
- Nếu build báo mismatch, kiểm tra kernel đang chạy có khớp với headers đã cài không

## Module load failed
- Confirm `build/chat_driver.ko` tồn tại hoặc pass `MODULE_PATH=/path/to/chat_driver.ko`
- Confirm bạn chạy `sudo make load`
- Inspect `dmesg | tail` để xem vermagic hoặc symbol errors

## Socket connection failed
- Confirm server đang lắng nghe đúng port
- Confirm client kết nối đúng `HOST` và `PORT`
- Confirm server được chạy ở thư mục có quyền ghi `users.db`

## Unload blocked
- Confirm không còn process nào đang dùng `/dev/device`
- Nếu có `lsof`, dùng `lsof /dev/device` để tìm process đang giữ device
