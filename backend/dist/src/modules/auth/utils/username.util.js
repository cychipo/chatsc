"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUsernameCollision = exports.deriveBaseUsername = void 0;
const deriveBaseUsername = (email) => email.split('@')[0];
exports.deriveBaseUsername = deriveBaseUsername;
const resolveUsernameCollision = async (baseUsername, exists) => {
    if (!(await exists(baseUsername))) {
        return baseUsername;
    }
    let suffix = 1;
    while (await exists(`${baseUsername}-${suffix}`)) {
        suffix += 1;
    }
    return `${baseUsername}-${suffix}`;
};
exports.resolveUsernameCollision = resolveUsernameCollision;
//# sourceMappingURL=username.util.js.map