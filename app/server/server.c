#include "server_protocol.h"

#include <arpa/inet.h>
#include <netinet/in.h>
#include <pthread.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

#define CHAT_MAX_ONLINE_USERS 32

typedef struct {
    int authenticated;
    int client_fd;
    char username[CHAT_MAX_USERNAME];
    char selected_peer[CHAT_MAX_USERNAME];
} client_session_t;

typedef struct {
    int active;
    int client_fd;
    char username[CHAT_MAX_USERNAME];
} online_user_t;

typedef struct {
    int client_fd;
    char user_db_path[256];
} client_handler_args_t;

static online_user_t g_online_users[CHAT_MAX_ONLINE_USERS];
static pthread_mutex_t g_online_users_lock = PTHREAD_MUTEX_INITIALIZER;

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

static int find_online_user_index(const char *username) {
    int index;

    for (index = 0; index < CHAT_MAX_ONLINE_USERS; ++index) {
        if (g_online_users[index].active && strcmp(g_online_users[index].username, username) == 0) {
            return index;
        }
    }

    return -1;
}

static int register_online_user(const char *username, int client_fd) {
    int index;

    pthread_mutex_lock(&g_online_users_lock);
    if (find_online_user_index(username) >= 0) {
        pthread_mutex_unlock(&g_online_users_lock);
        return 0;
    }

    for (index = 0; index < CHAT_MAX_ONLINE_USERS; ++index) {
        if (!g_online_users[index].active) {
            g_online_users[index].active = 1;
            g_online_users[index].client_fd = client_fd;
            snprintf(g_online_users[index].username, sizeof(g_online_users[index].username), "%s", username);
            pthread_mutex_unlock(&g_online_users_lock);
            return 1;
        }
    }

    pthread_mutex_unlock(&g_online_users_lock);
    return 0;
}

static void unregister_online_user(const char *username) {
    int index;

    if (username == NULL || username[0] == '\0') {
        return;
    }

    pthread_mutex_lock(&g_online_users_lock);
    index = find_online_user_index(username);
    if (index >= 0) {
        memset(&g_online_users[index], 0, sizeof(g_online_users[index]));
    }
    pthread_mutex_unlock(&g_online_users_lock);
}

static int get_online_user_fd(const char *username) {
    int index;
    int client_fd = -1;

    pthread_mutex_lock(&g_online_users_lock);
    index = find_online_user_index(username);
    if (index >= 0) {
        client_fd = g_online_users[index].client_fd;
    }
    pthread_mutex_unlock(&g_online_users_lock);
    return client_fd;
}

static void send_ack(int client_fd, uint32_t message_id, response_status_t status,
                     const char *from_username, const char *peer_username, const char *payload) {
    chat_response_t response;

    server_fill_response(&response, message_id, RESPONSE_ACK, status, from_username, peer_username, payload);
    write_full(client_fd, &response, sizeof(response));
}

static void handle_register_request(const client_handler_args_t *args, client_session_t *session, const chat_request_t *request) {
    response_status_t status;

    status = server_register_user(args->user_db_path, request);
    if (status == STATUS_REGISTER_SUCCESS) {
        send_ack(session->client_fd, request->message_id, status, request->username, NULL, "register-success");
    } else if (status == STATUS_USER_EXISTS) {
        send_ack(session->client_fd, request->message_id, status, request->username, NULL, "user-exists");
    } else {
        send_ack(session->client_fd, request->message_id, status, request->username, NULL, "register-failed");
    }
}

static void handle_login_request(const client_handler_args_t *args, client_session_t *session, const chat_request_t *request) {
    response_status_t status;

    status = server_validate_login(args->user_db_path, request);
    if (status != STATUS_OK) {
        session->authenticated = 0;
        session->username[0] = '\0';
        if (status == STATUS_USER_NOT_FOUND) {
            send_ack(session->client_fd, request->message_id, status, request->username, NULL, "user-not-found");
        } else {
            send_ack(session->client_fd, request->message_id, status, request->username, NULL, "login-failed");
        }
        return;
    }

    if (!register_online_user(request->username, session->client_fd)) {
        send_ack(session->client_fd, request->message_id, STATUS_ALREADY_ONLINE, request->username, NULL, "already-online");
        return;
    }

    session->authenticated = 1;
    snprintf(session->username, sizeof(session->username), "%s", request->username);
    send_ack(session->client_fd, request->message_id, STATUS_OK, session->username, NULL, "login-success");
}

static void handle_select_peer_request(const client_handler_args_t *args, client_session_t *session, const chat_request_t *request) {
    if (!session->authenticated) {
        send_ack(session->client_fd, request->message_id, STATUS_AUTH_REQUIRED, session->username, request->peer_username, "auth-required");
        return;
    }
    if (!server_user_exists(args->user_db_path, request->peer_username)) {
        send_ack(session->client_fd, request->message_id, STATUS_USER_NOT_FOUND, session->username, request->peer_username, "peer-not-found");
        return;
    }
    if (get_online_user_fd(request->peer_username) < 0) {
        send_ack(session->client_fd, request->message_id, STATUS_PEER_OFFLINE, session->username, request->peer_username, "peer-offline");
        return;
    }

    snprintf(session->selected_peer, sizeof(session->selected_peer), "%s", request->peer_username);
    send_ack(session->client_fd, request->message_id, STATUS_OK, session->username, session->selected_peer, "peer-selected");
}

static void handle_chat_request(client_session_t *session, const chat_request_t *request) {
    int peer_fd;
    chat_response_t delivery;

    if (!session->authenticated) {
        send_ack(session->client_fd, request->message_id, STATUS_AUTH_REQUIRED, session->username, request->peer_username, "auth-required");
        return;
    }
    if (request->peer_username[0] == '\0') {
        send_ack(session->client_fd, request->message_id, STATUS_PEER_REQUIRED, session->username, NULL, "peer-required");
        return;
    }

    peer_fd = get_online_user_fd(request->peer_username);
    if (peer_fd < 0) {
        send_ack(session->client_fd, request->message_id, STATUS_PEER_OFFLINE, session->username, request->peer_username, "peer-offline");
        return;
    }

    fprintf(stderr, "chat from=%s to=%s plaintext=\"%s\" encrypted=\"%s\"\n",
            session->username, request->peer_username, request->plaintext_payload, request->payload);

    server_fill_response(&delivery, request->message_id, RESPONSE_CHAT_DELIVERY, STATUS_OK,
                         session->username, request->peer_username, request->payload);

    if (write_full(peer_fd, &delivery, sizeof(delivery)) != 0) {
        send_ack(session->client_fd, request->message_id, STATUS_PEER_OFFLINE, session->username, request->peer_username, "peer-offline");
        return;
    }

    send_ack(session->client_fd, request->message_id, STATUS_DELIVERED, session->username, request->peer_username, "delivered");
}

static void *client_thread_main(void *arg) {
    client_handler_args_t *args = (client_handler_args_t *)arg;
    client_session_t session;
    chat_request_t request;

    memset(&session, 0, sizeof(session));
    session.client_fd = args->client_fd;

    fprintf(stderr, "client connected fd=%d\n", args->client_fd);
    while (read_full(args->client_fd, &request, sizeof(request)) == 0) {
        fprintf(stderr, "request type=%s user=%s peer=%s\n",
                request_type_name((request_type_t)request.request_type), request.username, request.peer_username);

        if (request.request_type == REQUEST_AUTH_REGISTER) {
            handle_register_request(args, &session, &request);
        } else if (request.request_type == REQUEST_AUTH_LOGIN) {
            handle_login_request(args, &session, &request);
        } else if (request.request_type == REQUEST_CHAT_SELECT_PEER) {
            handle_select_peer_request(args, &session, &request);
        } else if (request.request_type == REQUEST_CHAT_MESSAGE) {
            handle_chat_request(&session, &request);
        } else if (request.request_type == REQUEST_LOGOUT) {
            send_ack(session.client_fd, request.message_id, STATUS_OK, session.username, session.selected_peer, "logout");
            break;
        } else {
            send_ack(session.client_fd, request.message_id, STATUS_INVALID_REQUEST, session.username, session.selected_peer, "invalid-request");
        }
    }

    unregister_online_user(session.username);
    close(args->client_fd);
    free(args);
    return NULL;
}

int main(int argc, char **argv) {
    int port = argc > 1 ? atoi(argv[1]) : CHAT_DEFAULT_PORT;
    const char *user_db_path = argc > 2 ? argv[2] : CHAT_USER_DB_DEFAULT;
    int server_fd;
    struct sockaddr_in addr;
    int opt = 1;

    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        perror("socket");
        return 1;
    }

    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    addr.sin_port = htons((uint16_t)port);

    if (bind(server_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind");
        close(server_fd);
        return 1;
    }

    if (listen(server_fd, 8) < 0) {
        perror("listen");
        close(server_fd);
        return 1;
    }

    fprintf(stderr, "server listening on %d using user-db=%s\n", port, user_db_path);
    while (1) {
        int client_fd;
        client_handler_args_t *args;
        pthread_t thread_id;

        client_fd = accept(server_fd, NULL, NULL);
        if (client_fd < 0) {
            perror("accept");
            continue;
        }

        args = (client_handler_args_t *)malloc(sizeof(*args));
        if (args == NULL) {
            close(client_fd);
            continue;
        }

        args->client_fd = client_fd;
        snprintf(args->user_db_path, sizeof(args->user_db_path), "%s", user_db_path);

        if (pthread_create(&thread_id, NULL, client_thread_main, args) != 0) {
            close(client_fd);
            free(args);
            continue;
        }
        pthread_detach(thread_id);
    }

    close(server_fd);
    return 0;
}
