#include "remote_processing_client.h"

#include <arpa/inet.h>
#include <errno.h>
#include <fcntl.h>
#include <netdb.h>
#include <stdio.h>
#include <string.h>
#include <sys/select.h>
#include <sys/socket.h>
#include <unistd.h>

static int read_full(int fd, void *buffer, size_t size) {
    size_t total = 0;
    while (total < size) {
        ssize_t count = read(fd, (char *)buffer + total, size - total);
        if (count <= 0) {
            return -1;
        }
        total += (size_t)count;
    }
    return 0;
}

static int write_full(int fd, const void *buffer, size_t size) {
    size_t total = 0;
    while (total < size) {
        ssize_t count = write(fd, (const char *)buffer + total, size - total);
        if (count <= 0) {
            return -1;
        }
        total += (size_t)count;
    }
    return 0;
}

static int connect_with_timeout(const char *host, int port, int timeout_ms) {
    int sockfd = -1;
    int result;
    char port_string[16];
    struct addrinfo hints;
    struct addrinfo *addr = NULL;
    struct addrinfo *current = NULL;

    memset(&hints, 0, sizeof(hints));
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;
    snprintf(port_string, sizeof(port_string), "%d", port);

    result = getaddrinfo(host, port_string, &hints, &addr);
    if (result != 0) {
        fprintf(stderr, "getaddrinfo(%s): %s\n", host, gai_strerror(result));
        return -1;
    }

    for (current = addr; current != NULL; current = current->ai_next) {
        int flags;
        fd_set writefds;
        struct timeval timeout;
        int so_error = 0;
        socklen_t so_error_len = sizeof(so_error);

        sockfd = socket(current->ai_family, current->ai_socktype, current->ai_protocol);
        if (sockfd < 0) {
            continue;
        }

        flags = fcntl(sockfd, F_GETFL, 0);
        if (flags < 0 || fcntl(sockfd, F_SETFL, flags | O_NONBLOCK) < 0) {
            close(sockfd);
            sockfd = -1;
            continue;
        }

        result = connect(sockfd, current->ai_addr, current->ai_addrlen);
        if (result == 0) {
            fcntl(sockfd, F_SETFL, flags);
            break;
        }
        if (errno != EINPROGRESS) {
            close(sockfd);
            sockfd = -1;
            continue;
        }

        FD_ZERO(&writefds);
        FD_SET(sockfd, &writefds);
        timeout.tv_sec = timeout_ms / 1000;
        timeout.tv_usec = (timeout_ms % 1000) * 1000;

        result = select(sockfd + 1, NULL, &writefds, NULL, &timeout);
        if (result <= 0 || !FD_ISSET(sockfd, &writefds)) {
            close(sockfd);
            sockfd = -1;
            continue;
        }

        if (getsockopt(sockfd, SOL_SOCKET, SO_ERROR, &so_error, &so_error_len) < 0 || so_error != 0) {
            close(sockfd);
            sockfd = -1;
            continue;
        }

        if (fcntl(sockfd, F_SETFL, flags) < 0) {
            close(sockfd);
            sockfd = -1;
            continue;
        }
        break;
    }

    freeaddrinfo(addr);
    return sockfd;
}

int remote_process_message(const char *host, int port, int timeout_ms,
                           const chat_request_t *request, chat_response_t *response) {
    int fd;

    if (host == NULL || request == NULL || response == NULL) {
        return -1;
    }

    memset(response, 0, sizeof(*response));
    response->message_id = request->message_id;
    response->response_type = RESPONSE_ACK;

    fd = connect_with_timeout(host, port, timeout_ms);
    if (fd < 0) {
        response->status = STATUS_DRIVER_ERROR;
        snprintf(response->payload, sizeof(response->payload), "%s", "remote-unreachable");
        return -1;
    }

    if (write_full(fd, request, sizeof(*request)) != 0 ||
        read_full(fd, response, sizeof(*response)) != 0) {
        close(fd);
        response->status = STATUS_DRIVER_ERROR;
        snprintf(response->payload, sizeof(response->payload), "%s", "remote-io-error");
        return -1;
    }

    close(fd);
    return 0;
}
