"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_controller_1 = require("../src/modules/auth/auth.controller");
describe('AuthController session flow', () => {
    const authService = {
        recordAttempt: jest.fn(),
        issueTokenPair: jest.fn(),
        revokeRefreshToken: jest.fn(),
    };
    beforeEach(() => {
        authService.recordAttempt.mockReset();
    });
    it('returns the session user when session is valid', () => {
        const controller = new auth_controller_1.AuthController(authService);
        const result = controller.getCurrentUser({
            user: {
                id: 'user-1',
                email: 'user@example.com',
                username: 'user',
                displayName: 'User',
            },
        });
        expect(result.user?.email).toBe('user@example.com');
    });
    it('clears the session on logout', async () => {
        const controller = new auth_controller_1.AuthController(authService);
        const destroy = jest.fn((callback) => callback());
        await controller.logout({ session: { destroy }, headers: {} }, { clearCookie: jest.fn() });
        expect(destroy).toHaveBeenCalledTimes(1);
    });
});
//# sourceMappingURL=auth-session.e2e-spec.js.map