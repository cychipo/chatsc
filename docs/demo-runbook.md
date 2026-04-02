# Demo Runbook

1. Cài dependencies trên Ubuntu host: `build-essential`, `gcc`, `make`, `kmod`, `linux-headers-$(uname -r)`, `lsof`
2. Build user-space binaries với `make app`
3. Build kernel module với `make driver`
4. Load module với `sudo make load`
5. Start server: `make server` hoặc `./build/server 9090 users.db`
6. Start client A: `make client`
7. Start client B: `make client`
8. Trên mỗi client:
   - chọn `register` nếu chưa có account
   - chọn `login`
   - nhập `chat with username>` là username của client còn lại
9. Gửi tin nhắn 2 chiều và verify:
   - client A/B chỉ thấy plaintext
   - server terminal log `chat from=<user> to=<peer> plaintext="..." encrypted="..."`
   - password hashing và message transform đi qua driver
10. Thử `/switch` để đổi peer
11. Thử `/quit` để thoát
12. Unload module với `sudo make unload`

Nếu bước build module fail, host đang thiếu kernel headers hoặc build tree không khớp với kernel đang chạy.
