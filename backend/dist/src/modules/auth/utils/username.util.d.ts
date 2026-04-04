export declare const deriveBaseUsername: (email: string) => string;
export declare const resolveUsernameCollision: (baseUsername: string, exists: (username: string) => Promise<boolean>) => Promise<string>;
