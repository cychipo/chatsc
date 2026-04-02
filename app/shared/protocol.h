#ifndef CHAT_PROTOCOL_H
#define CHAT_PROTOCOL_H

#ifdef __KERNEL__
#include <linux/types.h>
#else
#include <stddef.h>
#include <stdint.h>
#endif

#define CHAT_MAX_USERNAME 32
#define CHAT_MAX_PASSWORD 64
#define CHAT_MAX_MESSAGE 512
#define CHAT_MAX_RESULT  512
#define CHAT_SHA1_HEX_LENGTH 40
#define CHAT_DEFAULT_PORT 9090

typedef enum {
    PROCESS_SUBSTITUTION = 1,
    PROCESS_SHA1 = 2,
    PROCESS_SUBSTITUTION_DECRYPT = 3
} processing_mode_t;

typedef enum {
    REQUEST_AUTH_LOGIN = 1,
    REQUEST_CHAT_MESSAGE = 2,
    REQUEST_LOGOUT = 3,
    REQUEST_AUTH_REGISTER = 4,
    REQUEST_CHAT_SELECT_PEER = 5
} request_type_t;

typedef enum {
    RESPONSE_ACK = 1,
    RESPONSE_CHAT_DELIVERY = 2
} response_type_t;

typedef enum {
    STATUS_OK = 0,
    STATUS_AUTH_REQUIRED = 1,
    STATUS_AUTH_FAILED = 2,
    STATUS_DRIVER_ERROR = 3,
    STATUS_INVALID_REQUEST = 4,
    STATUS_USER_EXISTS = 5,
    STATUS_USER_NOT_FOUND = 6,
    STATUS_PEER_OFFLINE = 7,
    STATUS_PEER_REQUIRED = 8,
    STATUS_DELIVERED = 9,
    STATUS_REGISTER_SUCCESS = 10,
    STATUS_ALREADY_ONLINE = 11
} response_status_t;

typedef struct {
    uint32_t message_id;
    uint32_t request_type;
    uint32_t mode;
    char username[CHAT_MAX_USERNAME];
    char peer_username[CHAT_MAX_USERNAME];
    char auth_payload[CHAT_MAX_PASSWORD];
    char payload[CHAT_MAX_MESSAGE];
    char plaintext_payload[CHAT_MAX_MESSAGE];
} chat_request_t;

typedef struct {
    uint32_t message_id;
    uint32_t response_type;
    int status;
    char from_username[CHAT_MAX_USERNAME];
    char peer_username[CHAT_MAX_USERNAME];
    char payload[CHAT_MAX_RESULT];
} chat_response_t;

const char *processing_mode_name(processing_mode_t mode);
processing_mode_t processing_mode_from_string(const char *value);
const char *request_type_name(request_type_t type);
const char *response_type_name(response_type_t type);
const char *response_status_name(response_status_t status);

#endif
