export declare class ChatDecodeError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
export declare function decodeBinaryMessage(buffer: Buffer): string;
