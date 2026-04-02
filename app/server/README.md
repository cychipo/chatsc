# Server Startup Flow

1. Build the server with `make -C app/server`
2. Start the server service from `docker/runtime/docker-compose.yml` or run `./build/server 9090 users.db`
3. Server accepts multiple client connections concurrently
4. Clients can register/login, select a peer, and exchange messages
5. Verify server logs show `from/to/plaintext/encrypted` for each routed message
