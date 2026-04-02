FROM ubuntu:24.04

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
        bash \
        build-essential \
        gcc \
        g++ \
        make \
        libc6-dev \
        iproute2 \
        net-tools \
        kmod \
        linux-libc-dev \
        file \
        bc \
        bison \
        flex \
        libelf-dev \
        libssl-dev \
        git \
        ca-certificates \
        xz-utils \
        lsof \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
CMD ["bash"]
