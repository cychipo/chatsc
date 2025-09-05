#ifndef PROCESSOR_VALIDATION_H
#define PROCESSOR_VALIDATION_H

#include "../client/device_client.h"

int processor_validate_request(const chat_request_t *request, chat_response_t *response);

#endif
