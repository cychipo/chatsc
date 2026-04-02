#include "device_client.h"

#include <arpa/inet.h>
#include <netdb.h>
#include <netinet/in.h>
#include <pthread.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

typedef struct {
    int sockfd;
    const char *device_path;
    char username[CHAT_MAX_USERNAME];
    char current_peer[CHAT_MAX_USERNAME];
    int running;
    pthread_mutex_t ack_lock;
    pthread_cond_t ack_cond;
    chat_response_t last_ack;
    int ack_ready;
    pthread_mutex_t ui_lock;
    char active_prompt[64];
    int prompt_active;
    int use_color;
} client_runtime_t;

static const char *ui_style(client_runtime_t *runtime, const char *code) {
    return runtime->use_color ? code : "";
}

static void ui_print_locked(client_runtime_t *runtime, const char *prefix, const char *fmt, va_list args) {
    if (runtime->prompt_active) {
        printf("\r\033[2K");
    }

    if (prefix != NULL && prefix[0] != '\0') {
        printf("%s", prefix);
    }

    vprintf(fmt, args);
    printf("\n");

    if (runtime->prompt_active && runtime->active_prompt[0] != '\0') {
        printf("%s", runtime->active_prompt);
    }

    fflush(stdout);
}

static void ui_print_line(client_runtime_t *runtime, const char *fmt, ...) {
    va_list args;

    pthread_mutex_lock(&runtime->ui_lock);
    va_start(args, fmt);
    ui_print_locked(runtime, NULL, fmt, args);
    va_end(args);
    pthread_mutex_unlock(&runtime->ui_lock);
}

static void ui_print_tagged(client_runtime_t *runtime, const char *tag, const char *color, const char *fmt, ...) {
    char prefix[64];
    va_list args;

    snprintf(prefix, sizeof(prefix), "%s[%s]%s ", ui_style(runtime, color), tag, ui_style(runtime, "\033[0m"));

    pthread_mutex_lock(&runtime->ui_lock);
    va_start(args, fmt);
    ui_print_locked(runtime, prefix, fmt, args);
    va_end(args);
    pthread_mutex_unlock(&runtime->ui_lock);
}

static void ui_print_banner(client_runtime_t *runtime, const char *host, int port, const char *device_path) {
    ui_print_line(runtime, "%s========================================%s",
                  ui_style(runtime, "\033[1m"), ui_style(runtime, "\033[0m"));
    ui_print_line(runtime, "%s Socket Chat Client%s",
                  ui_style(runtime, "\033[1;36m"), ui_style(runtime, "\033[0m"));
    ui_print_line(runtime, " device : %s", device_path);
    ui_print_line(runtime, " server : %s:%d", host, port);
    ui_print_line(runtime, "%s========================================%s",
                  ui_style(runtime, "\033[1m"), ui_style(runtime, "\033[0m"));
}

static void ui_print_menu(client_runtime_t *runtime) {
    ui_print_line(runtime, "");
    ui_print_line(runtime, "%s[menu]%s", ui_style(runtime, "\033[1m"), ui_style(runtime, "\033[0m"));
    ui_print_line(runtime, "  1) login");
    ui_print_line(runtime, "  2) register");
    ui_print_line(runtime, "  3) exit");
}

static void ui_print_divider(client_runtime_t *runtime) {
    ui_print_line(runtime, "%s----------------------------------------%s",
                  ui_style(runtime, "\033[2m"), ui_style(runtime, "\033[0m"));
}

static void ui_print_chat_header(client_runtime_t *runtime) {
    ui_print_divider(runtime);
    ui_print_line(runtime, "%s[chat]%s user=%s  peer=%s",
                  ui_style(runtime, "\033[1m"), ui_style(runtime, "\033[0m"),
                  runtime->username[0] != '\0' ? runtime->username : "-",
                  runtime->current_peer[0] != '\0' ? runtime->current_peer : "-");
    ui_print_line(runtime, "%s[tips]%s /switch để đổi người chat, /quit để thoát",
                  ui_style(runtime, "\033[2;36m"), ui_style(runtime, "\033[0m"));
    ui_print_divider(runtime);
}

static void ui_print_received_message(client_runtime_t *runtime, const char *from_username, const char *message) {
    ui_print_line(runtime, "%s<- %s%s  %s",
                  ui_style(runtime, "\033[1;36m"), from_username,
                  ui_style(runtime, "\033[0m"), message);
}

static void ui_print_sent_message(client_runtime_t *runtime, const char *to_username, const char *message) {
    ui_print_line(runtime, "%s-> %s%s  %s",
                  ui_style(runtime, "\033[1;32m"), to_username,
                  ui_style(runtime, "\033[0m"), message);
}

static void ui_prompt_begin(client_runtime_t *runtime, const char *label) {
    pthread_mutex_lock(&runtime->ui_lock);
    snprintf(runtime->active_prompt, sizeof(runtime->active_prompt), "%s", label);
    runtime->prompt_active = 1;
    printf("%s", label);
    fflush(stdout);
    pthread_mutex_unlock(&runtime->ui_lock);
}

static void ui_prompt_end(client_runtime_t *runtime) {
    pthread_mutex_lock(&runtime->ui_lock);
    runtime->prompt_active = 0;
    runtime->active_prompt[0] = '\0';
    pthread_mutex_unlock(&runtime->ui_lock);
}

static void prompt_line(client_runtime_t *runtime, const char *label, char *buffer, size_t size) {
    ui_prompt_begin(runtime, label);
    if (fgets(buffer, (int)size, stdin) == NULL) {
        buffer[0] = '\0';
        ui_prompt_end(runtime);
        return;
    }
    buffer[strcspn(buffer, "\n")] = '\0';
    ui_prompt_end(runtime);
}

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
                ui_print_received_message(runtime, response.from_username, plaintext);
            } else {
                ui_print_tagged(runtime, "error", "\033[1;31m", "message from %s could not be decrypted", response.from_username);
            }
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
        ui_print_tagged(runtime, "error", "\033[1;31m", "driver auth hashing failed");
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

    ui_print_tagged(runtime, "info", "\033[1;34m", "enter a username to start chatting");

    while (1) {
        prompt_line(runtime, "chat with username> ", peer_username, peer_size);
        if (peer_username[0] == '\0') {
            continue;
        }

        if (format_device_request(&request, (*message_id)++, REQUEST_CHAT_SELECT_PEER, PROCESS_SUBSTITUTION,
                                  runtime->username, peer_username, NULL, NULL, NULL) != 0) {
            ui_print_tagged(runtime, "error", "\033[1;31m", "peer không hợp lệ");
            continue;
        }
        if (send_request_and_wait_ack(runtime, &request, &response) != 0) {
            return -1;
        }

        if (response.status == STATUS_OK) {
            snprintf(runtime->current_peer, sizeof(runtime->current_peer), "%s", peer_username);
            ui_print_chat_header(runtime);
            return 0;
        }

        ui_print_tagged(runtime, "error", "\033[1;31m", "select peer failed: %s", response.payload);
    }
}

static int chat_loop(client_runtime_t *runtime, unsigned int *message_id, char *peer_username, size_t peer_size) {
    char line[CHAT_MAX_MESSAGE];

    (void)peer_size;

    while (runtime->running) {
        chat_request_t request;
        chat_response_t response;
        char encrypted[CHAT_MAX_RESULT];

        prompt_line(runtime, "message> ", line, sizeof(line));
        if (line[0] == '\0') {
            continue;
        }
        if (strcmp(line, "/switch") == 0) {
            runtime->current_peer[0] = '\0';
            ui_print_tagged(runtime, "info", "\033[1;34m", "switching peer");
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
            ui_print_tagged(runtime, "error", "\033[1;31m", "driver message processing failed");
            continue;
        }

        if (format_device_request(&request, (*message_id)++, REQUEST_CHAT_MESSAGE, PROCESS_SUBSTITUTION,
                                  runtime->username, peer_username, NULL, encrypted, line) != 0) {
            ui_print_tagged(runtime, "error", "\033[1;31m", "invalid chat request");
            continue;
        }
        if (send_request_and_wait_ack(runtime, &request, &response) != 0) {
            return -1;
        }

        if (response.status == STATUS_DELIVERED) {
            ui_print_sent_message(runtime, peer_username, line);
        } else {
            ui_print_tagged(runtime, "error", "\033[1;31m", "send failed: %s", response.payload);
            if (response.status == STATUS_PEER_OFFLINE || response.status == STATUS_USER_NOT_FOUND) {
                peer_username[0] = '\0';
                runtime->current_peer[0] = '\0';
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
    runtime.device_path = device_path;
    runtime.running = 1;
    runtime.use_color = isatty(STDOUT_FILENO) ? 1 : 0;
    pthread_mutex_init(&runtime.ack_lock, NULL);
    pthread_cond_init(&runtime.ack_cond, NULL);
    pthread_mutex_init(&runtime.ui_lock, NULL);

    if (pthread_create(&receiver_thread, NULL, receiver_thread_main, &runtime) != 0) {
        close(runtime.sockfd);
        pthread_mutex_destroy(&runtime.ui_lock);
        return 1;
    }

    ui_print_banner(&runtime, host, port, device_path);
    ui_print_tagged(&runtime, "info", "\033[1;34m", "socket connected");
    ui_print_tagged(&runtime, "info", "\033[1;34m", "terminal UI redraws the prompt when new messages arrive");

    while (menu_running && runtime.running) {
        char choice[16];
        char username[CHAT_MAX_USERNAME];
        char password[CHAT_MAX_PASSWORD];
        chat_response_t response;

        ui_print_menu(&runtime);
        prompt_line(&runtime, "select> ", choice, sizeof(choice));

        if (strcmp(choice, "3") == 0) {
            break;
        }

        if (strcmp(choice, "1") != 0 && strcmp(choice, "2") != 0) {
            ui_print_tagged(&runtime, "error", "\033[1;31m", "invalid option");
            continue;
        }

        prompt_line(&runtime, "username> ", username, sizeof(username));
        prompt_line(&runtime, "password> ", password, sizeof(password));

        if (strcmp(choice, "2") == 0) {
            if (submit_auth_request(&runtime, &message_id, REQUEST_AUTH_REGISTER, username, password, &response) != 0) {
                ui_print_tagged(&runtime, "error", "\033[1;31m", "register exchange failed");
                break;
            }
            ui_print_tagged(&runtime, "info", "\033[1;34m", "register result: %s", response.payload);
            continue;
        }

        if (submit_auth_request(&runtime, &message_id, REQUEST_AUTH_LOGIN, username, password, &response) != 0) {
            ui_print_tagged(&runtime, "error", "\033[1;31m", "login exchange failed");
            break;
        }
        if (response.status != STATUS_OK) {
            ui_print_tagged(&runtime, "error", "\033[1;31m", "login failed: %s", response.payload);
            continue;
        }

        snprintf(runtime.username, sizeof(runtime.username), "%s", username);
        runtime.current_peer[0] = '\0';
        ui_print_tagged(&runtime, "info", "\033[1;34m", "login success as %s", runtime.username);

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
    pthread_mutex_destroy(&runtime.ui_lock);
    ui_print_tagged(&runtime, "info", "\033[1;34m", "bye");
    return 0;
}
