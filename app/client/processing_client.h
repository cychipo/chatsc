#ifndef PROCESSING_CLIENT_H
#define PROCESSING_CLIENT_H

#include "device_client.h"
#include "../processor/processor_config.h"

typedef enum {
    PROCESSING_BACKEND_LOCAL = 0,
    PROCESSING_BACKEND_REMOTE = 1
} processing_backend_t;

typedef struct {
    processing_backend_t backend;
    char device_path[CHAT_DEVICE_PATH_MAX];
    char remote_host[CHAT_REMOTE_HOST_MAX];
    int remote_port;
    int connect_timeout_ms;
} processing_client_config_t;

int processing_client_init(processing_client_config_t *config, const char *default_device_path);
const char *processing_backend_name(processing_backend_t backend);
int processing_client_process(const processing_client_config_t *config, const chat_request_t *request, chat_response_t *response);

#endif
