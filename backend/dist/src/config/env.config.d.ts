export type BackendEnv = {
    PORT: number;
    MONGODB_URI: string;
    API_PREFIX: string;
    ACCESS_TOKEN_SECRET: string;
    ACCESS_TOKEN_TTL_SECONDS: number;
    REFRESH_TOKEN_SECRET: string;
    REFRESH_TOKEN_TTL_SECONDS: number;
    REFRESH_COOKIE_NAME: string;
};
export declare const backendEnv: () => BackendEnv;
