"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chat_controller_1 = require("../src/modules/chat/chat.controller");
describe('Chat history pagination e2e', () => {
    const chatService = {
        listConversationsForUser: jest.fn(),
        createConversation: jest.fn(),
        getActiveParticipant: jest.fn(),
        sendMessage: jest.fn(),
        getMessages: jest.fn(),
        addMember: jest.fn(),
        removeMember: jest.fn(),
        leaveConversation: jest.fn(),
        getMembershipEvents: jest.fn(),
        getParticipantRole: jest.fn(),
        getActiveParticipants: jest.fn(),
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('returns default 10 most recent messages', async () => {
        const controller = new chat_controller_1.ChatController(chatService);
        chatService.getActiveParticipant.mockResolvedValue({ userId: 'user-1', status: 'active' });
        chatService.getMessages.mockResolvedValue(Array.from({ length: 10 }, (_, i) => ({
            _id: `msg-${i}`,
            content: `Message ${i}`,
            sentAt: new Date(Date.now() - i * 1000).toISOString(),
        })));
        const response = await controller.getMessages({ user: { id: 'user-1' } }, 'conv-1', {});
        expect(chatService.getMessages).toHaveBeenCalledWith('conv-1', undefined, 10);
        expect(response.success).toBe(true);
        if (response.success) {
            expect(response.data).toHaveLength(10);
        }
    });
    it('loads more messages using cursor-based pagination', async () => {
        const controller = new chat_controller_1.ChatController(chatService);
        chatService.getActiveParticipant.mockResolvedValue({ userId: 'user-1', status: 'active' });
        chatService.getMessages.mockResolvedValue(Array.from({ length: 10 }, (_, i) => ({
            _id: `msg-${i + 10}`,
            content: `Message ${i + 10}`,
            sentAt: new Date(Date.now() - (i + 10) * 1000).toISOString(),
        })));
        const cursor = new Date(Date.now() - 10000).toISOString();
        const response = await controller.getMessages({ user: { id: 'user-1' } }, 'conv-1', { before: cursor });
        expect(chatService.getMessages).toHaveBeenCalledWith('conv-1', cursor, 10);
        expect(response.success).toBe(true);
        if (response.success) {
            expect(response.data).toHaveLength(10);
        }
    });
    it('respects custom limit up to max 50', async () => {
        const controller = new chat_controller_1.ChatController(chatService);
        chatService.getActiveParticipant.mockResolvedValue({ userId: 'user-1', status: 'active' });
        chatService.getMessages.mockResolvedValue([]);
        await controller.getMessages({ user: { id: 'user-1' } }, 'conv-1', { limit: 25 });
        expect(chatService.getMessages).toHaveBeenCalledWith('conv-1', undefined, 25);
    });
    it('caps limit at 50 even if higher requested', async () => {
        const controller = new chat_controller_1.ChatController(chatService);
        chatService.getActiveParticipant.mockResolvedValue({ userId: 'user-1', status: 'active' });
        chatService.getMessages.mockResolvedValue([]);
        await controller.getMessages({ user: { id: 'user-1' } }, 'conv-1', { limit: 100 });
        expect(chatService.getMessages).toHaveBeenCalledWith('conv-1', undefined, 50);
    });
    it('returns empty array when no more messages available', async () => {
        const controller = new chat_controller_1.ChatController(chatService);
        chatService.getActiveParticipant.mockResolvedValue({ userId: 'user-1', status: 'active' });
        chatService.getMessages.mockResolvedValue([]);
        const response = await controller.getMessages({ user: { id: 'user-1' } }, 'conv-1', { before: new Date(0).toISOString() });
        expect(response.success).toBe(true);
        if (response.success) {
            expect(response.data).toHaveLength(0);
        }
    });
});
//# sourceMappingURL=chat-history-pagination.e2e-spec.js.map