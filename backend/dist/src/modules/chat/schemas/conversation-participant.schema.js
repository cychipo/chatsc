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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationParticipantSchema = exports.ConversationParticipant = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let ConversationParticipant = class ConversationParticipant {
};
exports.ConversationParticipant = ConversationParticipant;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Conversation', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ConversationParticipant.prototype, "conversationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ConversationParticipant.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['member', 'admin', 'owner'], default: 'member' }),
    __metadata("design:type", String)
], ConversationParticipant.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['active', 'left', 'removed'], default: 'active' }),
    __metadata("design:type", String)
], ConversationParticipant.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ConversationParticipant.prototype, "addedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: () => new Date() }),
    __metadata("design:type", Date)
], ConversationParticipant.prototype, "joinedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], ConversationParticipant.prototype, "leftAt", void 0);
exports.ConversationParticipant = ConversationParticipant = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], ConversationParticipant);
exports.ConversationParticipantSchema = mongoose_1.SchemaFactory.createForClass(ConversationParticipant);
exports.ConversationParticipantSchema.index({ conversationId: 1, userId: 1 });
exports.ConversationParticipantSchema.index({ conversationId: 1, status: 1 });
exports.ConversationParticipantSchema.index({ userId: 1, status: 1 });
//# sourceMappingURL=conversation-participant.schema.js.map