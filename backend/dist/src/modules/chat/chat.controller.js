"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const access_token_auth_guard_1 = require("../auth/guards/access-token-auth.guard");
const chat_service_1 = require("./chat.service");
const chat_dto_1 = require("./dto/chat.dto");
const binary_message_util_1 = require("./utils/binary-message.util");
const chat_error_util_1 = require("./utils/chat-error.util");
const participant_access_util_1 = require("./utils/participant-access.util");
function wrapSuccess(data) {
    return { success: true, data };
}
let ChatController = class ChatController {
    constructor(chatService) {
        this.chatService = chatService;
    }
    getStatus(request) {
        return wrapSuccess({
            feature: 'chat',
            status: 'ready',
            user: request.user,
        });
    }
    async listConversations(req) {
        const userId = req.user.id;
        const conversations = await this.chatService.listConversationsForUser(userId);
        return wrapSuccess(conversations);
    }
    async createConversation(req, dto) {
        const userId = req.user.id;
        if (dto.type === 'direct' && dto.participantIds.length !== 1) {
            throw new common_1.BadRequestException({
                error: 'INVALID_PARTICIPANT_COUNT',
                message: 'Direct conversation requires exactly one other participant',
            });
        }
        const conversation = await this.chatService.createConversation(dto.type, userId, dto.participantIds, dto.title);
        return wrapSuccess(conversation);
    }
    async getMessages(req, conversationId, query) {
        const userId = req.user.id;
        await (0, participant_access_util_1.requireActiveParticipant)(this.chatService, conversationId, userId);
        const limit = query.limit ? Math.min(Number(query.limit), 50) : 10;
        const messages = await this.chatService.getMessages(conversationId, query.before, limit);
        return wrapSuccess(messages);
    }
    async sendMessage(req, conversationId) {
        const userId = req.user.id;
        try {
            await (0, participant_access_util_1.requireActiveParticipant)(this.chatService, conversationId, userId);
            console.log('[chat.sendMessage]', {
                isBuffer: Buffer.isBuffer(req.body),
                bodyType: req.body?.constructor?.name,
                bodyLength: Buffer.isBuffer(req.body) ? req.body.length : undefined,
            });
            const content = (0, binary_message_util_1.decodeBinaryMessage)(req.body);
            const message = await this.chatService.sendMessage(conversationId, userId, content);
            return wrapSuccess(message);
        }
        catch (err) {
            (0, chat_error_util_1.mapChatError)(err);
        }
    }
    async addMember(req, conversationId, dto) {
        const actorId = req.user.id;
        await (0, participant_access_util_1.requireActiveParticipant)(this.chatService, conversationId, actorId);
        const result = await this.chatService.addMember(conversationId, dto.userId, actorId);
        return wrapSuccess(result);
    }
    async removeMember(req, conversationId, userId) {
        const actorId = req.user.id;
        await (0, participant_access_util_1.requireAdminOrOwner)(this.chatService, conversationId, actorId);
        await this.chatService.removeMember(conversationId, userId, actorId);
        return wrapSuccess({ removed: true });
    }
    async leaveConversation(req, conversationId) {
        const userId = req.user.id;
        await (0, participant_access_util_1.requireActiveParticipant)(this.chatService, conversationId, userId);
        await this.chatService.leaveConversation(conversationId, userId);
        return wrapSuccess({ left: true });
    }
    async deleteConversation(req, conversationId) {
        const userId = req.user.id;
        await (0, participant_access_util_1.requireActiveParticipant)(this.chatService, conversationId, userId);
        await this.chatService.deleteConversationForUser(conversationId, userId);
        return wrapSuccess({ deleted: true });
    }
    async getMembershipEvents(req, conversationId) {
        const userId = req.user.id;
        await (0, participant_access_util_1.requireActiveParticipant)(this.chatService, conversationId, userId);
        const events = await this.chatService.getMembershipEvents(conversationId);
        return wrapSuccess(events);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('conversations'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "listConversations", null);
__decorate([
    (0, common_1.Post)('conversations'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chat_dto_1.CreateConversationDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createConversation", null);
__decorate([
    (0, common_1.Get)('conversations/:conversationId/messages'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('conversationId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, chat_dto_1.GetMessagesQueryDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('conversations/:conversationId/messages'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('conversationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('conversations/:conversationId/members'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('conversationId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, chat_dto_1.AddMemberDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "addMember", null);
__decorate([
    (0, common_1.Delete)('conversations/:conversationId/members/:userId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('conversationId')),
    __param(2, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Post)('conversations/:conversationId/leave'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('conversationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "leaveConversation", null);
__decorate([
    (0, common_1.Delete)('conversations/:conversationId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('conversationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "deleteConversation", null);
__decorate([
    (0, common_1.Get)('conversations/:conversationId/events'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('conversationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getMembershipEvents", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('chat'),
    (0, common_1.UseGuards)(access_token_auth_guard_1.AccessTokenAuthGuard),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map