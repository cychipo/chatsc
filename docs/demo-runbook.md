# Demo Runbook

1. Build user-space binaries with `make app` or `make docker-app`
2. Inspect Docker Desktop VM metadata with `make docker-driver-env-report`
3. Run `make docker-driver-check`
4. If no prepared tree is available yet, run `make docker-driver-prepare`
5. Build the module with `make docker-driver` or `make docker-driver KERNEL_BUILD_DIR=/path/to/prepared/kernel/tree`
6. Load module with `make docker-load`
7. Start the server: `./build/server 9090 users.db` or `make docker-server`
8. Start client A
9. Start client B
10. Trên mỗi client:
   - chọn `register` nếu chưa có account
   - chọn `login`
   - nhập `chat with username>` là username của client còn lại
11. Gửi tin nhắn 2 chiều và verify:
   - client A/B chỉ thấy plaintext
   - server terminal log `chat from=<user> to=<peer> plaintext="..." encrypted="..."`
   - password hashing và message transform đi qua driver
12. Thử `/switch` để đổi peer
13. Thử `/quit` để thoát
14. Unload module with `make docker-unload`

If step 3 or 4 fails on Docker Desktop/macOS, the current LinuxKit VM is missing required inputs for a full prepared tree. `kheaders.tar.xz` alone is not enough, and the repo will stop with a clear error instead of pretending the module can be built.
