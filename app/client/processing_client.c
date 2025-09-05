#include "processing_client.h"

#include "remote_processing_client.h"
#include "../processor/processor_config.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void copy_string(char *target, size_t size, const char *value) {
    if (target == NULL || size == 0) {
        return;
    }
    if (value == NULL) {
        target[0] = '\0';
        return;
    }
    snprintf(target, size, "%s", value);
}

const char *processing_backend_name(processing_backend_t backend) {
    switch (backend) {
    case PROCESSING_BACKEND_REMOTE:
        return "remote";
    case PROCESSING_BACKEND_LOCAL:
    default:
        return "local";
    }
}

int processing_client_init(processing_client_config_t *config, const char *default_device_path) {
    const char *backend;
    const char *remote_host;
    const char *remote_port;
    const char *timeout_ms;
    const char *device_path;

    if (config == NULL) {
        return -1;
    }

    memset(config, 0, sizeof(*config));
    config->backend = PROCESSING_BACKEND_LOCAL;
    config->remote_port = CHAT_PROCESSOR_DEFAULT_PORT;
    config->connect_timeout_ms = CHAT_PROCESSOR_DEFAULT_TIMEOUT_MS;
    copy_string(config->device_path, sizeof(config->device_path),
                default_device_path != NULL ? default_device_path : CHAT_PROCESSOR_DEFAULT_DEVICE);

    backend = getenv("CHAT_PROCESSING_BACKEND");
    remote_host = getenv("CHAT_PROCESSOR_HOST");
    remote_port = getenv("CHAT_PROCESSOR_PORT");
    timeout_ms = getenv("CHAT_PROCESSOR_TIMEOUT_MS");
    device_path = getenv("CHAT_DEVICE_PATH");

    if (backend != NULL && strcmp(backend, "remote") == 0) {
        config->backend = PROCESSING_BACKEND_REMOTE;
    }
    if (remote_host != NULL && remote_host[0] != '\0') {
        copy_string(config->remote_host, sizeof(config->remote_host), remote_host);
    }
    if (remote_port != NULL && remote_port[0] != '\0') {
        config->remote_port = atoi(remote_port);
    }
    if (timeout_ms != NULL && timeout_ms[0] != '\0') {
        config->connect_timeout_ms = atoi(timeout_ms);
    }
    if (device_path != NULL && device_path[0] != '\0') {
        copy_string(config->device_path, sizeof(config->device_path), device_path);
    }

    if (config->backend == PROCESSING_BACKEND_REMOTE && config->remote_host[0] == '\0') {
        copy_string(config->remote_host, sizeof(config->remote_host), CHAT_PROCESSOR_DEFAULT_HOST);
    }
    if (config->remote_port <= 0) {
        config->remote_port = CHAT_PROCESSOR_DEFAULT_PORT;
    }
    if (config->connect_timeout_ms <= 0) {
        config->connect_timeout_ms = CHAT_PROCESSOR_DEFAULT_TIMEOUT_MS;
    }

    return 0;
}

int processing_client_process(const processing_client_config_t *config,
                              const chat_request_t *request,
                              chat_response_t *response) {
    if (config == NULL) {
        return -1;
    }

    if (config->backend == PROCESSING_BACKEND_REMOTE) {
        return remote_process_message(config->remote_host, config->remote_port,
                                      config->connect_timeout_ms, request, response);
    }

    return device_process_message(config->device_path, request, response);
}
