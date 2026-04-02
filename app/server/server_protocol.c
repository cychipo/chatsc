#include "server_protocol.h"

#include <ctype.h>
#include <pthread.h>
#include <stdio.h>
#include <string.h>

static pthread_mutex_t k_user_db_lock = PTHREAD_MUTEX_INITIALIZER;

static int ensure_user_db_exists(const char *user_db_path) {
    FILE *file;

    file = fopen(user_db_path, "a+");
    if (file == NULL) {
        return 0;
    }
    fclose(file);
    return 1;
}

void server_fill_response(chat_response_t *response, uint32_t message_id, response_type_t response_type,
                          response_status_t status, const char *from_username,
                          const char *peer_username, const char *payload) {
    if (response == NULL) {
        return;
    }

    memset(response, 0, sizeof(*response));
    response->message_id = message_id;
    response->response_type = response_type;
    response->status = status;
    if (from_username != NULL) {
        snprintf(response->from_username, sizeof(response->from_username), "%s", from_username);
    }
    if (peer_username != NULL) {
        snprintf(response->peer_username, sizeof(response->peer_username), "%s", peer_username);
    }
    if (payload != NULL) {
        snprintf(response->payload, sizeof(response->payload), "%s", payload);
    }
}

int server_validate_username(const char *username) {
    size_t i;

    if (username == NULL || username[0] == '\0') {
        return 0;
    }

    for (i = 0; username[i] != '\0'; ++i) {
        unsigned char ch = (unsigned char)username[i];
        if (!(isalnum(ch) || ch == '_' || ch == '-' || ch == '.')) {
            return 0;
        }
    }

    return 1;
}

int server_user_exists(const char *user_db_path, const char *username) {
    FILE *file;
    char line[CHAT_MAX_USERNAME + CHAT_MAX_PASSWORD + 8];
    char file_username[CHAT_MAX_USERNAME];
    char file_hash[CHAT_MAX_PASSWORD];
    int found = 0;

    if (user_db_path == NULL || !server_validate_username(username)) {
        return 0;
    }

    pthread_mutex_lock(&k_user_db_lock);
    if (!ensure_user_db_exists(user_db_path)) {
        pthread_mutex_unlock(&k_user_db_lock);
        return 0;
    }

    file = fopen(user_db_path, "r");
    if (file == NULL) {
        pthread_mutex_unlock(&k_user_db_lock);
        return 0;
    }

    while (fgets(line, sizeof(line), file) != NULL) {
        if (sscanf(line, "%31[^:]:%63s", file_username, file_hash) == 2 && strcmp(file_username, username) == 0) {
            found = 1;
            break;
        }
    }

    fclose(file);
    pthread_mutex_unlock(&k_user_db_lock);
    return found;
}

response_status_t server_register_user(const char *user_db_path, const chat_request_t *request) {
    FILE *file;
    char line[CHAT_MAX_USERNAME + CHAT_MAX_PASSWORD + 8];
    char file_username[CHAT_MAX_USERNAME];
    char file_hash[CHAT_MAX_PASSWORD];

    if (user_db_path == NULL || request == NULL || !server_validate_username(request->username) || request->auth_payload[0] == '\0') {
        return STATUS_INVALID_REQUEST;
    }

    pthread_mutex_lock(&k_user_db_lock);
    if (!ensure_user_db_exists(user_db_path)) {
        pthread_mutex_unlock(&k_user_db_lock);
        return STATUS_INVALID_REQUEST;
    }

    file = fopen(user_db_path, "r");
    if (file != NULL) {
        while (fgets(line, sizeof(line), file) != NULL) {
            if (sscanf(line, "%31[^:]:%63s", file_username, file_hash) == 2 && strcmp(file_username, request->username) == 0) {
                fclose(file);
                pthread_mutex_unlock(&k_user_db_lock);
                return STATUS_USER_EXISTS;
            }
        }
        fclose(file);
    }

    file = fopen(user_db_path, "a");
    if (file == NULL) {
        pthread_mutex_unlock(&k_user_db_lock);
        return STATUS_INVALID_REQUEST;
    }

    fprintf(file, "%s:%s\n", request->username, request->auth_payload);
    fclose(file);
    pthread_mutex_unlock(&k_user_db_lock);
    return STATUS_REGISTER_SUCCESS;
}

response_status_t server_validate_login(const char *user_db_path, const chat_request_t *request) {
    FILE *file;
    char line[CHAT_MAX_USERNAME + CHAT_MAX_PASSWORD + 8];
    char file_username[CHAT_MAX_USERNAME];
    char file_hash[CHAT_MAX_PASSWORD];

    if (user_db_path == NULL || request == NULL || !server_validate_username(request->username) || request->auth_payload[0] == '\0') {
        return STATUS_INVALID_REQUEST;
    }

    pthread_mutex_lock(&k_user_db_lock);
    if (!ensure_user_db_exists(user_db_path)) {
        pthread_mutex_unlock(&k_user_db_lock);
        return STATUS_INVALID_REQUEST;
    }

    file = fopen(user_db_path, "r");
    if (file == NULL) {
        pthread_mutex_unlock(&k_user_db_lock);
        return STATUS_AUTH_FAILED;
    }

    while (fgets(line, sizeof(line), file) != NULL) {
        if (sscanf(line, "%31[^:]:%63s", file_username, file_hash) != 2) {
            continue;
        }
        if (strcmp(file_username, request->username) == 0) {
            fclose(file);
            pthread_mutex_unlock(&k_user_db_lock);
            return strcmp(file_hash, request->auth_payload) == 0 ? STATUS_OK : STATUS_AUTH_FAILED;
        }
    }

    fclose(file);
    pthread_mutex_unlock(&k_user_db_lock);
    return STATUS_USER_NOT_FOUND;
}
