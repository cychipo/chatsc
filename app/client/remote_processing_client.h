#ifndef REMOTE_PROCESSING_CLIENT_H
#define REMOTE_PROCESSING_CLIENT_H

#include "device_client.h"

int remote_process_message(const char *host, int port, int timeout_ms,
                           const chat_request_t *request, chat_response_t *response);

#endif
