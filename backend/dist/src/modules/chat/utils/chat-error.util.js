"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapChatError = mapChatError;
const common_1 = require("@nestjs/common");
const binary_message_util_1 = require("./binary-message.util");
function mapChatError(err) {
    if (err instanceof binary_message_util_1.ChatDecodeError) {
        throw new common_1.BadRequestException({
            error: 'DECODE_ERROR',
            code: err.code,
            message: err.message,
        });
    }
    if (err instanceof common_1.ForbiddenException || err instanceof common_1.BadRequestException) {
        throw err;
    }
    throw new common_1.BadRequestException({
        error: 'CHAT_ERROR',
        message: err instanceof Error ? err.message : 'Unknown chat error',
    });
}
//# sourceMappingURL=chat-error.util.js.map