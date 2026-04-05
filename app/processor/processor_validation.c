#include "processor_validation.h"

#include <stdio.h>
#include <string.h>

static int is_supported_mode(uint32_t mode) {
    return mode == PROCESS_SUBSTITUTION ||
           mode == PROCESS_SHA1 ||
           mode == PROCESS_SUBSTITUTION_DECRYPT;
}

int processor_validate_request(const chat_request_t *request, chat_response_t *response) {
    if (request == NULL || response == NULL) {
        return -1;
    }

    memset(response, 0, sizeof(*response));
    response->message_id = request->message_id;
    response->response_type = RESPONSE_ACK;

    if (!is_supported_mode(request->mode)) {
        response->status = STATUS_INVALID_REQUEST;
        snprintf(response->payload, sizeof(response->payload), "%s", "unsupported-mode");
        return -1;
    }

    if ((request->request_type == REQUEST_AUTH_LOGIN || request->request_type == REQUEST_AUTH_REGISTER) &&
        request->username[0] != '\0' && request->auth_payload[0] != '\0') {
        return 0;
    }

    if (request->request_type == REQUEST_CHAT_SELECT_PEER && request->peer_username[0] != '\0') {
        return 0;
    }

    if (request->request_type == REQUEST_CHAT_MESSAGE &&
        request->peer_username[0] != '\0' && request->payload[0] != '\0') {
        return 0;
    }

    if (request->request_type == REQUEST_LOGOUT) {
        return 0;
    }

    if ((request->request_type == REQUEST_AUTH_LOGIN || request->request_type == REQUEST_AUTH_REGISTER) &&
        (request->username[0] == '\0' || request->auth_payload[0] == '\0')) {
        response->status = STATUS_INVALID_REQUEST;
        snprintf(response->payload, sizeof(response->payload), "%s", "missing-auth-payload");
        return -1;
    }

    if (request->request_type == REQUEST_CHAT_SELECT_PEER && request->peer_username[0] == '\0') {
        response->status = STATUS_INVALID_REQUEST;
        snprintf(response->payload, sizeof(response->payload), "%s", "missing-peer");
        return -1;
    }

    if (request->request_type == REQUEST_CHAT_MESSAGE &&
        (request->peer_username[0] == '\0' || request->payload[0] == '\0')) {
        response->status = STATUS_INVALID_REQUEST;
        snprintf(response->payload, sizeof(response->payload), "%s", "missing-message-payload");
        return -1;
    }

    response->status = STATUS_INVALID_REQUEST;
    snprintf(response->payload, sizeof(response->payload), "%s", "invalid-request");
    return -1;
}
