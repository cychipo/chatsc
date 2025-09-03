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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const auth_service_1 = require("../auth/auth.service");
const conversation_schema_1 = require("./schemas/conversation.schema");
const conversation_participant_schema_1 = require("./schemas/conversation-participant.schema");
const message_schema_1 = require("./schemas/message.schema");
const membership_event_schema_1 = require("./schemas/membership-event.schema");
let ChatService = class ChatService {
    constructor(conversationModel, participantModel, messageModel, membershipEventModel, authService) {
        this.conversationModel = conversationModel;
        this.participantModel = participantModel;
        this.messageModel = messageModel;
        this.membershipEventModel = membershipEventModel;
        this.authService = authService;
    }
    async listConversationsForUser(userId) {
        const participations = await this.participantModel
            .find({ userId: new mongoose_2.Types.ObjectId(userId), status: 'active' })
            .lean();
        const conversationIds = participations.map((p) => p.conversationId);
        const conversations = await this.conversationModel
            .find({ _id: { $in: conversationIds } })
            .sort({ lastMessageAt: -1 })
            .lean();
        return Promise.all(conversations.map(async (conversation) => {
            const latestMessage = await this.messageModel
                .findOne({ conversationId: conversation._id })
                .sort({ sentAt: -1 })
                .lean();
            const conversationWithTimestamps = conversation;
            if (conversation.type === 'direct') {
                const participants = await this.participantModel
                    .find({ conversationId: conversation._id, status: 'active' })
                    .lean();
                const peerParticipant = participants.find((participant) => participant.userId.toString() !== userId);
                const directPeer = peerParticipant
                    ? await this.authService.findById(peerParticipant.userId.toString())
                    : null;
                const displayTitle = directPeer?.displayName ?? conversation.title ?? 'Đoạn chat mới';
                return {
                    _id: conversation._id.toString(),
                    type: conversation.type,
                    title: conversation.title,
                    createdBy: conversation.createdBy.toString(),
                    createdAt: conversationWithTimestamps.createdAt?.toISOString() ?? new Date().toISOString(),
                    updatedAt: conversationWithTimestamps.updatedAt?.toISOString() ?? new Date().toISOString(),
                    lastMessageAt: latestMessage?.sentAt?.toISOString() ??
                        conversation.lastMessageAt?.toISOString(),
                    displayTitle,
                    displayAvatarUrl: directPeer?.avatarUrl,
                    lastMessagePreview: latestMessage?.content,
                    directPeer: directPeer ?? undefined,
                };
            }
            return {
                _id: conversation._id.toString(),
                type: conversation.type,
                title: conversation.title,
                createdBy: conversation.createdBy.toString(),
                createdAt: conversationWithTimestamps.createdAt?.toISOString() ?? new Date().toISOString(),
                updatedAt: conversationWithTimestamps.updatedAt?.toISOString() ?? new Date().toISOString(),
                lastMessageAt: latestMessage?.sentAt?.toISOString() ??
                    conversation.lastMessageAt?.toISOString(),
                displayTitle: conversation.title ?? 'Nhóm chat',
                lastMessagePreview: latestMessage?.content,
            };
        }));
    }
    async createConversation(type, creatorId, participantIds, title) {
        if (type === 'direct') {
            const targetUserId = participantIds[0];
            if (targetUserId === creatorId) {
                throw new common_1.BadRequestException({
                    error: 'INVALID_DIRECT_CONVERSATION',
                    message: 'Cannot create a direct conversation with yourself',
                });
            }
            const existingConversation = await this.findDirectConversation(creatorId, targetUserId);
            if (existingConversation) {
                return existingConversation;
            }
        }
        const conversation = await this.conversationModel.create({
            type,
            title,
            createdBy: new mongoose_2.Types.ObjectId(creatorId),
        });
        const allParticipantIds = Array.from(new Set([creatorId, ...participantIds]));
        const participantDocs = allParticipantIds.map((uid) => ({
            conversationId: conversation._id,
            userId: new mongoose_2.Types.ObjectId(uid),
            role: uid === creatorId ? 'owner' : 'member',
            status: 'active',
            addedBy: uid === creatorId ? undefined : new mongoose_2.Types.ObjectId(creatorId),
            joinedAt: new Date(),
        }));
        await this.participantModel.insertMany(participantDocs);
        const membershipEvents = allParticipantIds.map((uid) => ({
            conversationId: conversation._id,
            type: uid === creatorId ? 'joined' : 'added',
            targetUserId: new mongoose_2.Types.ObjectId(uid),
            actorUserId: uid === creatorId ? undefined : new mongoose_2.Types.ObjectId(creatorId),
            occurredAt: new Date(),
        }));
        await this.membershipEventModel.insertMany(membershipEvents);
        return conversation;
    }
    async getActiveParticipant(conversationId, userId) {
        return this.participantModel.findOne({
            conversationId: new mongoose_2.Types.ObjectId(conversationId),
            userId: new mongoose_2.Types.ObjectId(userId),
            status: 'active',
        });
    }
    async findDirectConversation(userAId, userBId) {
        const activeParticipants = await this.participantModel
            .find({
            userId: { $in: [new mongoose_2.Types.ObjectId(userAId), new mongoose_2.Types.ObjectId(userBId)] },
            status: 'active',
        })
            .lean();
        const conversationIdsByUser = new Map();
        for (const participant of activeParticipants) {
            const key = participant.userId.toString();
            const existingIds = conversationIdsByUser.get(key) ?? new Set();
            existingIds.add(participant.conversationId.toString());
            conversationIdsByUser.set(key, existingIds);
        }
        const userAConversationIds = conversationIdsByUser.get(userAId) ?? new Set();
        const userBConversationIds = conversationIdsByUser.get(userBId) ?? new Set();
        const sharedConversationIds = Array.from(userAConversationIds).filter((id) => userBConversationIds.has(id));
        if (sharedConversationIds.length === 0) {
            return null;
        }
        const conversations = await this.conversationModel
            .find({
            _id: { $in: sharedConversationIds.map((id) => new mongoose_2.Types.ObjectId(id)) },
            type: 'direct',
        })
            .sort({ updatedAt: -1 })
            .lean();
        for (const conversation of conversations) {
            const participants = await this.participantModel
                .find({ conversationId: conversation._id, status: 'active' })
                .lean();
            if (participants.length === 2) {
                const participantIds = new Set(participants.map((participant) => participant.userId.toString()));
                if (participantIds.has(userAId) && participantIds.has(userBId)) {
                    return conversation;
                }
            }
        }
        return null;
    }
    async sendMessage(conversationId, senderId, content) {
        const message = await this.messageModel.create({
            conversationId: new mongoose_2.Types.ObjectId(conversationId),
            senderId: new mongoose_2.Types.ObjectId(senderId),
            content,
            sentAt: new Date(),
            deliveryStatus: 'sent',
        });
        await this.conversationModel.updateOne({ _id: new mongoose_2.Types.ObjectId(conversationId) }, { lastMessageAt: message.sentAt });
        return message;
    }
    async getMessages(conversationId, before, limit = 10) {
        const query = { conversationId: new mongoose_2.Types.ObjectId(conversationId) };
        if (before) {
            query.sentAt = { $lt: new Date(before) };
        }
        return this.messageModel.find(query).sort({ sentAt: -1 }).limit(Math.min(limit, 50)).lean();
    }
    async addMember(conversationId, userId, actorId) {
        const existing = await this.participantModel.findOne({
            conversationId: new mongoose_2.Types.ObjectId(conversationId),
            userId: new mongoose_2.Types.ObjectId(userId),
            status: 'active',
        });
        if (existing) {
            return { alreadyMember: true };
        }
        await this.participantModel.create({
            conversationId: new mongoose_2.Types.ObjectId(conversationId),
            userId: new mongoose_2.Types.ObjectId(userId),
            role: 'member',
            status: 'active',
            addedBy: new mongoose_2.Types.ObjectId(actorId),
            joinedAt: new Date(),
        });
        await this.membershipEventModel.create({
            conversationId: new mongoose_2.Types.ObjectId(conversationId),
            type: 'added',
            targetUserId: new mongoose_2.Types.ObjectId(userId),
            actorUserId: new mongoose_2.Types.ObjectId(actorId),
            occurredAt: new Date(),
        });
        return { alreadyMember: false };
    }
    async removeMember(conversationId, userId, actorId) {
        await this.participantModel.updateOne({
            conversationId: new mongoose_2.Types.ObjectId(conversationId),
            userId: new mongoose_2.Types.ObjectId(userId),
            status: 'active',
        }, { status: 'removed', leftAt: new Date() });
        await this.membershipEventModel.create({
            conversationId: new mongoose_2.Types.ObjectId(conversationId),
            type: 'removed',
            targetUserId: new mongoose_2.Types.ObjectId(userId),
            actorUserId: new mongoose_2.Types.ObjectId(actorId),
            occurredAt: new Date(),
        });
    }
    async leaveConversation(conversationId, userId) {
        await this.markConversationLeft(conversationId, userId);
    }
    async deleteConversationForUser(conversationId, userId) {
        await this.markConversationLeft(conversationId, userId);
    }
    async markConversationLeft(conversationId, userId) {
        await this.participantModel.updateOne({
            conversationId: new mongoose_2.Types.ObjectId(conversationId),
            userId: new mongoose_2.Types.ObjectId(userId),
            status: 'active',
        }, { status: 'left', leftAt: new Date() });
        await this.membershipEventModel.create({
            conversationId: new mongoose_2.Types.ObjectId(conversationId),
            type: 'left',
            targetUserId: new mongoose_2.Types.ObjectId(userId),
            occurredAt: new Date(),
        });
    }
    async getMembershipEvents(conversationId) {
        return this.membershipEventModel
            .find({ conversationId: new mongoose_2.Types.ObjectId(conversationId) })
            .sort({ occurredAt: -1 })
            .lean();
    }
    async getParticipantRole(conversationId, userId) {
        const participant = await this.participantModel.findOne({
            conversationId: new mongoose_2.Types.ObjectId(conversationId),
            userId: new mongoose_2.Types.ObjectId(userId),
            status: 'active',
        });
        return participant?.role;
    }
    async getActiveParticipants(conversationId) {
        return this.participantModel
            .find({ conversationId: new mongoose_2.Types.ObjectId(conversationId), status: 'active' })
            .lean();
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(conversation_schema_1.Conversation.name)),
    __param(1, (0, mongoose_1.InjectModel)(conversation_participant_schema_1.ConversationParticipant.name)),
    __param(2, (0, mongoose_1.InjectModel)(message_schema_1.Message.name)),
    __param(3, (0, mongoose_1.InjectModel)(membership_event_schema_1.MembershipEvent.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        auth_service_1.AuthService])
], ChatService);
//# sourceMappingURL=chat.service.js.map