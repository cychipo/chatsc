#include "protocol.h"

#include <string.h>

const char *processing_mode_name(processing_mode_t mode) {
    switch (mode) {
    case PROCESS_SUBSTITUTION:
        return "substitution";
    case PROCESS_SHA1:
        return "sha1";
    case PROCESS_SUBSTITUTION_DECRYPT:
        return "substitution-decrypt";
    default:
        return "unknown";
    }
}

processing_mode_t processing_mode_from_string(const char *value) {
    if (value == NULL) {
        return PROCESS_SUBSTITUTION;
    }

    if (strcmp(value, "sha1") == 0) {
        return PROCESS_SHA1;
    }
    if (strcmp(value, "substitution-decrypt") == 0) {
        return PROCESS_SUBSTITUTION_DECRYPT;
    }

    return PROCESS_SUBSTITUTION;
}

const char *request_type_name(request_type_t type) {
    switch (type) {
    case REQUEST_AUTH_LOGIN:
        return "login";
    case REQUEST_CHAT_MESSAGE:
        return "chat";
    case REQUEST_LOGOUT:
        return "logout";
    case REQUEST_AUTH_REGISTER:
        return "register";
    case REQUEST_CHAT_SELECT_PEER:
        return "select-peer";
    default:
        return "unknown";
    }
}

const char *response_type_name(response_type_t type) {
    switch (type) {
    case RESPONSE_ACK:
        return "ack";
    case RESPONSE_CHAT_DELIVERY:
        return "chat-delivery";
    default:
        return "unknown";
    }
}

const char *response_status_name(response_status_t status) {
    switch (status) {
    case STATUS_OK:
        return "ok";
    case STATUS_AUTH_REQUIRED:
        return "auth-required";
    case STATUS_AUTH_FAILED:
        return "auth-failed";
    case STATUS_DRIVER_ERROR:
        return "driver-error";
    case STATUS_INVALID_REQUEST:
        return "invalid-request";
    case STATUS_USER_EXISTS:
        return "user-exists";
    case STATUS_USER_NOT_FOUND:
        return "user-not-found";
    case STATUS_PEER_OFFLINE:
        return "peer-offline";
    case STATUS_PEER_REQUIRED:
        return "peer-required";
    case STATUS_DELIVERED:
        return "delivered";
    case STATUS_REGISTER_SUCCESS:
        return "register-success";
    case STATUS_ALREADY_ONLINE:
        return "already-online";
    default:
        return "unknown";
    }
}
