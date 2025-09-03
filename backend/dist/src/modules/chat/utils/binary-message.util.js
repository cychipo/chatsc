"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatDecodeError = void 0;
exports.decodeBinaryMessage = decodeBinaryMessage;
class ChatDecodeError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'ChatDecodeError';
    }
}
exports.ChatDecodeError = ChatDecodeError;
function decodeBinaryMessage(buffer) {
    try {
        const decoder = new TextDecoder('utf-8', { fatal: true });
        const text = decoder.decode(buffer);
        if (!text.trim()) {
            throw new ChatDecodeError('EMPTY_MESSAGE', 'Message content cannot be empty');
        }
        return text;
    }
    catch (err) {
        if (err instanceof ChatDecodeError) {
            throw err;
        }
        throw new ChatDecodeError('INVALID_UTF8', 'Failed to decode binary payload as UTF-8');
    }
}
//# sourceMappingURL=binary-message.util.js.map