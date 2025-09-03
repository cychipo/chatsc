export declare class CreateConversationDto {
    type: 'direct' | 'group';
    title?: string;
    participantIds: string[];
}
export declare class AddMemberDto {
    userId: string;
}
export declare class GetMessagesQueryDto {
    before?: string;
    limit?: number;
}
