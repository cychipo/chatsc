import { SessionUser } from '../auth/types/auth-session';
type AuthenticatedRequest = Request & {
    user?: SessionUser;
};
export declare class ChatController {
    getStatus(request: AuthenticatedRequest): {
        feature: string;
        status: string;
        user: SessionUser | undefined;
    };
}
export {};
