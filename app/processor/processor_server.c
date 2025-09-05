#include "processor_config.h"
#include "processor_validation.h"

#include "../client/device_client.h"

#include <arpa/inet.h>
#include <netinet/in.h>
#include <pthread.h>
#include <signal.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

#define PROCESSOR_BACKLOG 16

typedef struct {
    int client_fd;
    char device_path[CHAT_DEVICE_PATH_MAX];
} processor_client_args_t;

static int g_running = 1;

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

static void handle_signal(int signo) {
    (void)signo;
    g_running = 0;
}

static void *processor_client_main(void *arg) {
    processor_client_args_t *args = (processor_client_args_t *)arg;
    chat_request_t request;
    chat_response_t response;

    while (read_full(args->client_fd, &request, sizeof(request)) == 0) {
        if (processor_validate_request(&request, &response) != 0) {
            if (write_full(args->client_fd, &response, sizeof(response)) != 0) {
                break;
            }
            continue;
        }

        if (device_process_message(args->device_path, &request, &response) != 0) {
            response.message_id = request.message_id;
            response.response_type = RESPONSE_ACK;
            response.status = STATUS_DRIVER_ERROR;
            snprintf(response.payload, sizeof(response.payload), "%s", "device-processing-failed");
        }

        if (write_full(args->client_fd, &response, sizeof(response)) != 0) {
            break;
        }
    }

    close(args->client_fd);
    free(args);
    return NULL;
}

int main(int argc, char **argv) {
    const char *bind_host = argc > 1 ? argv[1] : CHAT_PROCESSOR_DEFAULT_HOST;
    int port = argc > 2 ? atoi(argv[2]) : CHAT_PROCESSOR_DEFAULT_PORT;
    const char *device_path = argc > 3 ? argv[3] : CHAT_PROCESSOR_DEFAULT_DEVICE;
    int server_fd;
    int opt = 1;
    struct sockaddr_in addr;

    signal(SIGINT, handle_signal);
    signal(SIGTERM, handle_signal);

    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        perror("socket");
        return 1;
    }

    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_port = htons((uint16_t)port);
    if (strcmp(bind_host, "0.0.0.0") == 0) {
        addr.sin_addr.s_addr = htonl(INADDR_ANY);
    } else if (inet_pton(AF_INET, bind_host, &addr.sin_addr) != 1) {
        fprintf(stderr, "invalid bind host: %s\n", bind_host);
        close(server_fd);
        return 1;
    }

    if (bind(server_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind");
        close(server_fd);
        return 1;
    }

    if (listen(server_fd, PROCESSOR_BACKLOG) < 0) {
        perror("listen");
        close(server_fd);
        return 1;
    }

    fprintf(stderr, "processor listening on %s:%d using %s\n", bind_host, port, device_path);

    while (g_running) {
        int client_fd;
        processor_client_args_t *args;
        pthread_t thread_id;

        client_fd = accept(server_fd, NULL, NULL);
        if (client_fd < 0) {
            if (!g_running) {
                break;
            }
            perror("accept");
            continue;
        }

        args = (processor_client_args_t *)malloc(sizeof(*args));
        if (args == NULL) {
            close(client_fd);
            continue;
        }

        args->client_fd = client_fd;
        snprintf(args->device_path, sizeof(args->device_path), "%s", device_path);

        if (pthread_create(&thread_id, NULL, processor_client_main, args) != 0) {
            close(client_fd);
            free(args);
            continue;
        }
        pthread_detach(thread_id);
    }

    close(server_fd);
    return 0;
}
