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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthSerializer = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = __importDefault(require("passport"));
const auth_service_1 = require("./auth.service");
let AuthSerializer = class AuthSerializer {
    constructor(authService) {
        this.authService = authService;
        passport_1.default.serializeUser((user, done) => {
            done(null, user.id);
        });
        passport_1.default.deserializeUser(async (id, done) => {
            try {
                const user = await this.authService.findById(id);
                done(null, user ?? null);
            }
            catch (error) {
                done(error);
            }
        });
    }
};
exports.AuthSerializer = AuthSerializer;
exports.AuthSerializer = AuthSerializer = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthSerializer);
//# sourceMappingURL=auth.serializer.js.map