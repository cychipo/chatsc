#include "device_client.h"

#include <arpa/inet.h>
#include <netdb.h>
#include <netinet/in.h>
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

typedef struct {
    int sockfd;
    const char *device_path;
    char username[CHAT_MAX_USERNAME];
    int running;
    pthread_mutex_t ack_lock;
    pthread_cond_t ack_cond;
    chat_response_t last_ack;
    int ack_ready;
} client_runtime_t;

static int connect_to_server(const char *host, int port) {
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
        sockfd = socket(current->ai_family, current->ai_socktype, current->ai_protocol);
        if (sockfd < 0) {
            continue;
        }
        if (connect(sockfd, current->ai_addr, current->ai_addrlen) == 0) {
            break;
        }
        close(sockfd);
        sockfd = -1;
    }

    freeaddrinfo(addr);

    if (sockfd < 0) {
        fprintf(stderr, "unable to connect to %s:%d\n", host, port);
        return -1;
    }

    return sockfd;
}

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

static void prompt_line(const char *label, char *buffer, size_t size) {
    printf("%s", label);
    fflush(stdout);
    if (fgets(buffer, (int)size, stdin) == NULL) {
        buffer[0] = '\0';
        return;
    }
    buffer[strcspn(buffer, "\n")] = '\0';
}

static int process_with_driver(const char *device_path, unsigned int message_id, request_type_t request_type,
                               processing_mode_t mode, const char *username, const char *peer_username,
                               const char *auth_payload, const char *payload, char *output, size_t output_size) {
    chat_request_t device_request;
    chat_response_t device_response;

    if (format_device_request(&device_request, message_id, request_type, mode, username, peer_username,
                              auth_payload, payload, NULL) != 0) {
        return -1;
    }
    if (device_process_message(device_path, &device_request, &device_response) != 0) {
        return -1;
    }
    if (device_response.status != STATUS_OK) {
        return -1;
    }

    snprintf(output, output_size, "%s", device_response.payload);
    return 0;
}

static int send_request_and_wait_ack(client_runtime_t *runtime, const chat_request_t *request, chat_response_t *response) {
    if (write_full(runtime->sockfd, request, sizeof(*request)) != 0) {
        return -1;
    }

    pthread_mutex_lock(&runtime->ack_lock);
    while (runtime->running && (!runtime->ack_ready || runtime->last_ack.message_id != request->message_id)) {
        pthread_cond_wait(&runtime->ack_cond, &runtime->ack_lock);
    }

    if (!runtime->running) {
        pthread_mutex_unlock(&runtime->ack_lock);
        return -1;
    }

    if (response != NULL) {
        *response = runtime->last_ack;
    }
    runtime->ack_ready = 0;
    memset(&runtime->last_ack, 0, sizeof(runtime->last_ack));
    pthread_mutex_unlock(&runtime->ack_lock);
    return 0;
}

static void *receiver_thread_main(void *arg) {
    client_runtime_t *runtime = (client_runtime_t *)arg;
    chat_response_t response;

    while (read_full(runtime->sockfd, &response, sizeof(response)) == 0) {
        if (response.response_type == RESPONSE_CHAT_DELIVERY) {
            char plaintext[CHAT_MAX_MESSAGE];
            if (process_with_driver(runtime->device_path, response.message_id, REQUEST_CHAT_MESSAGE,
                                    PROCESS_SUBSTITUTION_DECRYPT, runtime->username, response.from_username,
                                    NULL, response.payload, plaintext, sizeof(plaintext)) == 0) {
                printf("\n%s> %s\n", response.from_username, plaintext);
            } else {
                printf("\n%s> [decrypt failed]\n", response.from_username);
            }
            fflush(stdout);
        } else {
            pthread_mutex_lock(&runtime->ack_lock);
            runtime->last_ack = response;
            runtime->ack_ready = 1;
            pthread_cond_broadcast(&runtime->ack_cond);
            pthread_mutex_unlock(&runtime->ack_lock);
        }
    }

    pthread_mutex_lock(&runtime->ack_lock);
    runtime->running = 0;
    pthread_cond_broadcast(&runtime->ack_cond);
    pthread_mutex_unlock(&runtime->ack_lock);
    return NULL;
}

static int submit_auth_request(client_runtime_t *runtime, unsigned int *message_id, request_type_t type,
                               const char *username, const char *password, chat_response_t *response) {
    chat_request_t request;
    char digest[CHAT_MAX_RESULT];

    if (process_with_driver(runtime->device_path, (*message_id)++, type, PROCESS_SHA1,
                            username, NULL, password, NULL, digest, sizeof(digest)) != 0) {
        fprintf(stderr, "driver auth hashing failed\n");
        return -1;
    }

    if (format_device_request(&request, *message_id, type, PROCESS_SHA1, username, NULL, digest, NULL, NULL) != 0) {
        return -1;
    }

    if (send_request_and_wait_ack(runtime, &request, response) != 0) {
        return -1;
    }

    *message_id += 1;
    return 0;
}

static int select_peer(client_runtime_t *runtime, unsigned int *message_id, char *peer_username, size_t peer_size) {
    chat_request_t request;
    chat_response_t response;

    while (1) {
        prompt_line("chat with username> ", peer_username, peer_size);
        if (peer_username[0] == '\0') {
            continue;
        }

        if (format_device_request(&request, (*message_id)++, REQUEST_CHAT_SELECT_PEER, PROCESS_SUBSTITUTION,
                                  runtime->username, peer_username, NULL, NULL, NULL) != 0) {
            printf("peer không hợp lệ\n");
            continue;
        }
        if (send_request_and_wait_ack(runtime, &request, &response) != 0) {
            return -1;
        }

        if (response.status == STATUS_OK) {
            printf("chatting with %s\n", peer_username);
            return 0;
        }

        printf("select peer failed: %s\n", response.payload);
    }
}

static int chat_loop(client_runtime_t *runtime, unsigned int *message_id, char *peer_username, size_t peer_size) {
    char line[CHAT_MAX_MESSAGE];

    (void)peer_size;

    while (runtime->running) {
        chat_request_t request;
        chat_response_t response;
        char encrypted[CHAT_MAX_RESULT];

        prompt_line("you> ", line, sizeof(line));
        if (line[0] == '\0') {
            continue;
        }
        if (strcmp(line, "/switch") == 0) {
            return 0;
        }
        if (strcmp(line, "/quit") == 0) {
            if (format_device_request(&request, (*message_id)++, REQUEST_LOGOUT, PROCESS_SUBSTITUTION,
                                      runtime->username, peer_username, NULL, NULL, NULL) == 0) {
                send_request_and_wait_ack(runtime, &request, &response);
            }
            runtime->running = 0;
            shutdown(runtime->sockfd, SHUT_RDWR);
            return -1;
        }

        if (process_with_driver(runtime->device_path, *message_id, REQUEST_CHAT_MESSAGE, PROCESS_SUBSTITUTION,
                                runtime->username, peer_username, NULL, line, encrypted, sizeof(encrypted)) != 0) {
            fprintf(stderr, "driver message processing failed\n");
            continue;
        }

        if (format_device_request(&request, (*message_id)++, REQUEST_CHAT_MESSAGE, PROCESS_SUBSTITUTION,
                                  runtime->username, peer_username, NULL, encrypted, line) != 0) {
            fprintf(stderr, "invalid chat request\n");
            continue;
        }
        if (send_request_and_wait_ack(runtime, &request, &response) != 0) {
            return -1;
        }

        if (response.status == STATUS_DELIVERED) {
            printf("you> %s\n", line);
        } else {
            printf("send failed: %s\n", response.payload);
            if (response.status == STATUS_PEER_OFFLINE || response.status == STATUS_USER_NOT_FOUND) {
                peer_username[0] = '\0';
                return 0;
            }
        }
    }

    return -1;
}

int main(int argc, char **argv) {
    const char *host = argc > 1 ? argv[1] : "127.0.0.1";
    int port = argc > 2 ? atoi(argv[2]) : CHAT_DEFAULT_PORT;
    const char *device_path = argc > 3 ? argv[3] : "/dev/device";
    client_runtime_t runtime;
    pthread_t receiver_thread;
    unsigned int message_id = 1;
    int menu_running = 1;

    memset(&runtime, 0, sizeof(runtime));
    runtime.sockfd = connect_to_server(host, port);
    if (runtime.sockfd < 0) {
        return 1;
    }
    fprintf(stderr, "socket connected\n");
    runtime.device_path = device_path;
    runtime.running = 1;
    pthread_mutex_init(&runtime.ack_lock, NULL);
    pthread_cond_init(&runtime.ack_cond, NULL);

    if (pthread_create(&receiver_thread, NULL, receiver_thread_main, &runtime) != 0) {
        close(runtime.sockfd);
        return 1;
    }

    printf("========================================\n");
    printf(" Socket Chat Client\n");
    printf(" device : %s\n", device_path);
    printf(" server : %s:%d\n", host, port);
    printf("========================================\n");

    while (menu_running && runtime.running) {
        char choice[16];
        char username[CHAT_MAX_USERNAME];
        char password[CHAT_MAX_PASSWORD];
        chat_response_t response;

        printf("\n1) login\n");
        printf("2) register\n");
        printf("3) exit\n");
        prompt_line("select> ", choice, sizeof(choice));

        if (strcmp(choice, "3") == 0) {
            break;
        }

        if (strcmp(choice, "1") != 0 && strcmp(choice, "2") != 0) {
            printf("invalid option\n");
            continue;
        }

        prompt_line("username> ", username, sizeof(username));
        prompt_line("password> ", password, sizeof(password));

        if (strcmp(choice, "2") == 0) {
            if (submit_auth_request(&runtime, &message_id, REQUEST_AUTH_REGISTER, username, password, &response) != 0) {
                fprintf(stderr, "register exchange failed\n");
                break;
            }
            printf("register> %s\n", response.payload);
            continue;
        }

        if (submit_auth_request(&runtime, &message_id, REQUEST_AUTH_LOGIN, username, password, &response) != 0) {
            fprintf(stderr, "login exchange failed\n");
            break;
        }
        if (response.status != STATUS_OK) {
            printf("login> %s\n", response.payload);
            continue;
        }

        snprintf(runtime.username, sizeof(runtime.username), "%s", username);
        printf("auth> login success as %s\n", runtime.username);

        while (runtime.running) {
            char peer_username[CHAT_MAX_USERNAME];

            peer_username[0] = '\0';
            if (select_peer(&runtime, &message_id, peer_username, sizeof(peer_username)) != 0) {
                menu_running = 0;
                break;
            }
            if (chat_loop(&runtime, &message_id, peer_username, sizeof(peer_username)) != 0) {
                menu_running = 0;
                break;
            }
        }
    }

    runtime.running = 0;
    shutdown(runtime.sockfd, SHUT_RDWR);
    pthread_join(receiver_thread, NULL);
    close(runtime.sockfd);
    pthread_cond_destroy(&runtime.ack_cond);
    pthread_mutex_destroy(&runtime.ack_lock);
    printf("bye\n");
    return 0;
}
