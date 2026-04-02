#ifndef SERVER_PROTOCOL_H
#define SERVER_PROTOCOL_H

#include "../shared/protocol.h"

#define CHAT_USER_DB_DEFAULT "users.db"

void server_fill_response(chat_response_t *response, uint32_t message_id, response_type_t response_type,
                          response_status_t status, const char *from_username,
                          const char *peer_username, const char *payload);
int server_validate_username(const char *username);
int server_user_exists(const char *user_db_path, const char *username);
response_status_t server_register_user(const char *user_db_path, const chat_request_t *request);
response_status_t server_validate_login(const char *user_db_path, const chat_request_t *request);

#endif
