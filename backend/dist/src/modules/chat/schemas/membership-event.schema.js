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
exports.MembershipEventSchema = exports.MembershipEvent = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let MembershipEvent = class MembershipEvent {
};
exports.MembershipEvent = MembershipEvent;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Conversation', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MembershipEvent.prototype, "conversationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['added', 'joined', 'left', 'removed'] }),
    __metadata("design:type", String)
], MembershipEvent.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MembershipEvent.prototype, "targetUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MembershipEvent.prototype, "actorUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: () => new Date() }),
    __metadata("design:type", Date)
], MembershipEvent.prototype, "occurredAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], MembershipEvent.prototype, "metadata", void 0);
exports.MembershipEvent = MembershipEvent = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], MembershipEvent);
exports.MembershipEventSchema = mongoose_1.SchemaFactory.createForClass(MembershipEvent);
exports.MembershipEventSchema.index({ conversationId: 1, occurredAt: -1 });
//# sourceMappingURL=membership-event.schema.js.map