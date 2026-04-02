# Client Processing Modes

Supported processing modes:
- `substitution`
- `sha1`

Sample input:
- `hello world`
- `Kernel123`

The client reads input from stdin, sends it through `/dev/device`, prints the processed result, and forwards the processed output to the chat server when connected.
