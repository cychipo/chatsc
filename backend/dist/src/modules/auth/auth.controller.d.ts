import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SessionUser } from './types/auth-session';
type AuthenticatedRequest = Request & {
    user?: SessionUser;
    session?: {
        user?: SessionUser;
        destroy?: (callback: (error?: Error | null) => void) => void;
    };
};
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    startGoogleLogin(): Promise<void>;
    handleGoogleCallback(request: AuthenticatedRequest, response: Response): Promise<void>;
    handleGoogleFailure(response: Response): Promise<void>;
    getCurrentUser(request: AuthenticatedRequest): {
        user: (Express.User & SessionUser) | undefined;
    };
    searchUsers(request: AuthenticatedRequest, query: string): Promise<{
        success: boolean;
        data: {
            id: string;
            email: string;
            username: string;
            displayName: string;
            avatarUrl: string | undefined;
        }[];
    }>;
    refresh(request: AuthenticatedRequest, response: Response): Promise<import("./types/token-payload").RefreshSessionResponse>;
    logout(request: AuthenticatedRequest, response: Response): Promise<{
        success: boolean;
    }>;
    getStatus(): {
        feature: string;
        status: string;
    };
    private buildFrontendRedirect;
    private getRefreshTokenFromRequest;
    private setRefreshCookie;
    private clearRefreshCookie;
}
export {};
