"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const chat_controller_1 = require("../src/modules/chat/chat.controller");
describe('Chat group remove member e2e', () => {
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
    it('allows owner to remove member from group', async () => {
        const controller = new chat_controller_1.ChatController(chatService);
        chatService.getParticipantRole.mockResolvedValue('owner');
        chatService.removeMember.mockResolvedValue(undefined);
        const result = await controller.removeMember({ user: { id: 'user-1' } }, 'group-1', 'user-2');
        expect(chatService.getParticipantRole).toHaveBeenCalledWith('group-1', 'user-1');
        expect(chatService.removeMember).toHaveBeenCalledWith('group-1', 'user-2', 'user-1');
        expect(result).toMatchObject({ success: true, data: { removed: true } });
    });
    it('allows admin to remove member from group', async () => {
        const controller = new chat_controller_1.ChatController(chatService);
        chatService.getParticipantRole.mockResolvedValue('admin');
        chatService.removeMember.mockResolvedValue(undefined);
        const result = await controller.removeMember({ user: { id: 'admin-user' } }, 'group-1', 'user-3');
        expect(chatService.removeMember).toHaveBeenCalledWith('group-1', 'user-3', 'admin-user');
        expect(result).toMatchObject({ success: true, data: { removed: true } });
    });
    it('rejects remove from regular member', async () => {
        const controller = new chat_controller_1.ChatController(chatService);
        chatService.getParticipantRole.mockResolvedValue('member');
        await expect(controller.removeMember({ user: { id: 'user-3' } }, 'group-1', 'user-2')).rejects.toBeInstanceOf(common_1.ForbiddenException);
    });
    it('rejects remove from non-participant', async () => {
        const controller = new chat_controller_1.ChatController(chatService);
        chatService.getParticipantRole.mockResolvedValue(null);
        await expect(controller.removeMember({ user: { id: 'outsider' } }, 'group-1', 'user-2')).rejects.toBeInstanceOf(common_1.ForbiddenException);
    });
    it('creates removed event when member is removed', async () => {
        const controller = new chat_controller_1.ChatController(chatService);
        chatService.getParticipantRole.mockResolvedValue('owner');
        chatService.removeMember.mockResolvedValue(undefined);
        chatService.getActiveParticipant.mockResolvedValue({ userId: 'user-1', status: 'active' });
        chatService.getMembershipEvents.mockResolvedValue([
            {
                _id: 'event-1',
                type: 'removed',
                targetUserId: 'user-2',
                actorUserId: 'user-1',
                occurredAt: new Date().toISOString(),
            },
        ]);
        await controller.removeMember({ user: { id: 'user-1' } }, 'group-1', 'user-2');
        const response = await controller.getMembershipEvents({ user: { id: 'user-1' } }, 'group-1');
        expect(response.success).toBe(true);
        if (response.success) {
            const removedEvent = response.data.find((e) => e.type === 'removed');
            expect(removedEvent).toBeDefined();
            expect(removedEvent?.actorUserId).toBe('user-1');
            expect(removedEvent?.targetUserId).toBe('user-2');
        }
    });
});
//# sourceMappingURL=chat-group-remove-member.e2e-spec.js.map