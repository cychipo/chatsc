#ifndef DEVICE_CLIENT_H
#define DEVICE_CLIENT_H

#include "../shared/protocol.h"

int device_process_message(const char *device_path, const chat_request_t *request, chat_response_t *response);
int process_request_with_device(const char *device_path, unsigned int message_id, request_type_t request_type,
                                processing_mode_t mode, const char *username, const char *peer_username,
                                const char *auth_payload, const char *payload, const char *plaintext_payload,
                                chat_response_t *response);
int format_device_request(chat_request_t *request, unsigned int message_id, request_type_t request_type, processing_mode_t mode,
                          const char *username, const char *peer_username, const char *auth_payload,
                          const char *payload, const char *plaintext_payload);

#endif
