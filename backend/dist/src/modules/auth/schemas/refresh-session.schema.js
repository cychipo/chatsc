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
exports.RefreshSessionSchema = exports.RefreshSession = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let RefreshSession = class RefreshSession {
};
exports.RefreshSession = RefreshSession;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], RefreshSession.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], RefreshSession.prototype, "tokenHash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], RefreshSession.prototype, "issuedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", Date)
], RefreshSession.prototype, "expiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], RefreshSession.prototype, "lastUsedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], RefreshSession.prototype, "revokedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'active' }),
    __metadata("design:type", String)
], RefreshSession.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'google-login' }),
    __metadata("design:type", String)
], RefreshSession.prototype, "createdBy", void 0);
exports.RefreshSession = RefreshSession = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], RefreshSession);
exports.RefreshSessionSchema = mongoose_1.SchemaFactory.createForClass(RefreshSession);
//# sourceMappingURL=refresh-session.schema.js.map