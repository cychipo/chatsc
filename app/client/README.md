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

The client reads input from stdin, sends it through `/dev/device`, prints the processed result, and forwards the processed output to the chat server when connected.
