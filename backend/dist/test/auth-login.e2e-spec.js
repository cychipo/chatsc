"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_controller_1 = require("../src/modules/auth/auth.controller");
describe('AuthController', () => {
    const authService = {
        recordAttempt: jest.fn(),
        issueTokenPair: jest.fn(),
        revokeRefreshToken: jest.fn(),
    };
    beforeEach(() => {
        authService.recordAttempt.mockReset();
    });
    it('returns the current session user', () => {
        const controller = new auth_controller_1.AuthController(authService);
        const result = controller.getCurrentUser({
            user: {
                id: 'user-1',
                email: 'test@example.com',
                username: 'test',
                displayName: 'Test User',
            },
        });
        expect(result).toEqual({
            user: {
                id: 'user-1',
                email: 'test@example.com',
                username: 'test',
                displayName: 'Test User',
            },
        });
    });
    it('destroys the session on logout', async () => {
        const controller = new auth_controller_1.AuthController(authService);
        const destroy = jest.fn((callback) => callback());
        await expect(controller.logout({
            session: {
                destroy,
            },
            headers: {},
        }, { clearCookie: jest.fn() })).resolves.toEqual({ success: true });
        expect(destroy).toHaveBeenCalled();
    });
    it('builds failure redirect with auth error', async () => {
        const controller = new auth_controller_1.AuthController(authService);
        const redirect = jest.fn();
        await controller.handleGoogleFailure({ redirect });
        expect(authService.recordAttempt).toHaveBeenCalledWith({
            result: 'cancelled',
            failureReason: 'google-auth-cancelled',
        });
        expect(redirect).toHaveBeenCalledWith('http://localhost:5173/?authError=google_auth_cancelled');
    });
});
//# sourceMappingURL=auth-login.e2e-spec.js.map