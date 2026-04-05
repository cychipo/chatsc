#include "device_client.h"

#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

int format_device_request(chat_request_t *request, unsigned int message_id, request_type_t request_type, processing_mode_t mode,
                          const char *username, const char *peer_username, const char *auth_payload,
                          const char *payload, const char *plaintext_payload) {
    if (request == NULL) {
        return -1;
    }

    memset(request, 0, sizeof(*request));
    request->message_id = message_id;
    request->request_type = request_type;
    request->mode = mode;

    if (username != NULL) {
        snprintf(request->username, sizeof(request->username), "%s", username);
    }
    if (peer_username != NULL) {
        snprintf(request->peer_username, sizeof(request->peer_username), "%s", peer_username);
    }
    if (auth_payload != NULL) {
        snprintf(request->auth_payload, sizeof(request->auth_payload), "%s", auth_payload);
    }
    if (payload != NULL) {
        snprintf(request->payload, sizeof(request->payload), "%s", payload);
    }
    if (plaintext_payload != NULL) {
        snprintf(request->plaintext_payload, sizeof(request->plaintext_payload), "%s", plaintext_payload);
    }

    if ((request_type == REQUEST_AUTH_LOGIN || request_type == REQUEST_AUTH_REGISTER) &&
        (request->username[0] == '\0' || request->auth_payload[0] == '\0')) {
        return -1;
    }

    if (request_type == REQUEST_CHAT_SELECT_PEER && request->peer_username[0] == '\0') {
        return -1;
    }

    if (request_type == REQUEST_CHAT_MESSAGE &&
        (request->peer_username[0] == '\0' || request->payload[0] == '\0')) {
        return -1;
    }

    return 0;
}

int device_process_message(const char *device_path, const chat_request_t *request, chat_response_t *response) {
    int fd;
    ssize_t written;
    ssize_t read_bytes;

    if (device_path == NULL || request == NULL || response == NULL) {
        return -1;
    }

    memset(response, 0, sizeof(*response));
    response->message_id = request->message_id;
    response->response_type = RESPONSE_ACK;

    fd = open(device_path, O_RDWR);
    if (fd < 0) {
        fprintf(stderr, "failed to open device %s: %s\n", device_path, strerror(errno));
        response->status = STATUS_DRIVER_ERROR;
        return -1;
    }

    written = write(fd, request, sizeof(*request));
    if (written < 0 || (size_t)written != sizeof(*request)) {
        close(fd);
        response->status = STATUS_DRIVER_ERROR;
        return -1;
    }

    read_bytes = read(fd, response, sizeof(*response));
    if (read_bytes < 0 || (size_t)read_bytes != sizeof(*response)) {
        close(fd);
        response->status = STATUS_DRIVER_ERROR;
        return -1;
    }

    close(fd);
    return 0;
}

int process_request_with_device(const char *device_path, unsigned int message_id, request_type_t request_type,
                                processing_mode_t mode, const char *username, const char *peer_username,
                                const char *auth_payload, const char *payload, const char *plaintext_payload,
                                chat_response_t *response) {
    chat_request_t request;

    if (response == NULL) {
        return -1;
    }

    if (format_device_request(&request, message_id, request_type, mode, username, peer_username,
                              auth_payload, payload, plaintext_payload) != 0) {
        memset(response, 0, sizeof(*response));
        response->message_id = message_id;
        response->response_type = RESPONSE_ACK;
        response->status = STATUS_INVALID_REQUEST;
        snprintf(response->payload, sizeof(response->payload), "%s", "invalid-request");
        return -1;
    }

    return device_process_message(device_path, &request, response);
}
