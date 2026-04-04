export type BackendEnv = {
    PORT: number;
    MONGODB_URI: string;
    API_PREFIX: string;
};
export declare const backendEnv: () => BackendEnv;
