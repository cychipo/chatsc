"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireActiveParticipant = requireActiveParticipant;
exports.requireAdminOrOwner = requireAdminOrOwner;
const common_1 = require("@nestjs/common");
async function requireActiveParticipant(chatService, conversationId, userId) {
    const participant = await chatService.getActiveParticipant(conversationId, userId);
    if (!participant) {
        throw new common_1.ForbiddenException('You are not an active participant of this conversation');
    }
    return participant;
}
async function requireAdminOrOwner(chatService, conversationId, userId) {
    const role = await chatService.getParticipantRole(conversationId, userId);
    if (!role || (role !== 'admin' && role !== 'owner')) {
        throw new common_1.ForbiddenException('You do not have permission to perform this action');
    }
    return role;
}
//# sourceMappingURL=participant-access.util.js.map