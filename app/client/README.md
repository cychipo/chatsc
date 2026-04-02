# Client Processing Modes

Supported processing modes:
- `substitution`
- `sha1`

Sample input:
- `hello world`
- `Kernel123`

Run on Linux host:

```bash
./build/client 127.0.0.1 9090 /dev/device
```

Or from repo root:

```bash
make client
```

The client reads input from stdin, sends it through `/dev/device`, and forwards the processed output to the chat server when connected.

Interactive flow:
- choose login or register from the menu
- select a peer with `chat with username>`
- after peer selection, the client shows a chat header with the current user and peer
- send messages with `message>`
- incoming messages are shown as `<- username  message`
- successful sends are shown as `-> username  message`
- use `/switch` to change peer and `/quit` to exit
