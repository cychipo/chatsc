# Development Container Flow

1. Build the development image from `docker/dev/Dockerfile`.
2. Start the `dev` service from `docker/runtime/docker-compose.yml`.
3. Run `make`, `make app`, or `make test` from `/workspace`.
4. For Docker-based binaries, run `make docker-app` so Linux artifacts are written to `build-linux/`.
5. Host builds continue to use `build/`.

The image includes `make`, `gcc`, `g++`, `build-essential`, networking tools, and `kmod`.
