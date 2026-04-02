# Server Startup Flow

1. Build the server with `make -C app/server` or `make app`
2. Start the server with `./build/server 9090 users.db` or `make server`
3. Server accepts multiple client connections concurrently
4. Clients can register/login, select a peer, and exchange messages
5. Verify server logs show `from/to/plaintext/encrypted` for each routed message
