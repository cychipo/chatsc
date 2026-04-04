"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const username_util_1 = require("../src/modules/auth/utils/username.util");
const auth_service_1 = require("../src/modules/auth/auth.service");
describe('username utilities', () => {
    it('derives username from email local part', () => {
        expect((0, username_util_1.deriveBaseUsername)('abc.123@gmail.com')).toBe('abc.123');
    });
    it('resolves username collisions with numeric suffixes', async () => {
        const taken = new Set(['alice', 'alice-1']);
        const username = await (0, username_util_1.resolveUsernameCollision)('alice', async (candidate) => taken.has(candidate));
        expect(username).toBe('alice-2');
    });
});
describe('AuthService profile creation', () => {
    it('creates a collision-safe username for a new Google user', async () => {
        const existingByEmail = null;
        const existingUsernames = new Set(['alice']);
        const createdUser = {
            toObject: () => ({
                _id: { toString: () => 'user-2' },
                email: 'alice@gmail.com',
                username: 'alice-1',
                displayName: 'Alice',
                avatarUrl: 'https://example.com/avatar.png',
            }),
        };
        const authService = new auth_service_1.AuthService({
            findById: jest.fn(),
            findOne: jest.fn().mockResolvedValue(existingByEmail),
            exists: jest.fn().mockImplementation(async ({ username }) => existingUsernames.has(username)),
            create: jest.fn().mockResolvedValue(createdUser),
        }, {
            create: jest.fn(),
        });
        const result = await authService.upsertGoogleUser({
            googleId: 'google-1',
            email: 'alice@gmail.com',
            displayName: 'Alice',
            avatarUrl: 'https://example.com/avatar.png',
        });
        expect(result).toEqual({
            id: 'user-2',
            email: 'alice@gmail.com',
            username: 'alice-1',
            displayName: 'Alice',
            avatarUrl: 'https://example.com/avatar.png',
        });
    });
});
//# sourceMappingURL=auth-profile.e2e-spec.js.map