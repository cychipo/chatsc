"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const chat_controller_1 = require("../src/modules/chat/chat.controller");
describe('Chat group forbidden send e2e', () => {
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
    it('rejects message from user who left the group', async () => {
        const controller = new chat_controller_1.ChatController(chatService);
        chatService.getActiveParticipant.mockResolvedValue(null);
        const encoder = new TextEncoder();
        const binaryContent = encoder.encode('Hello');
        await expect(controller.sendMessage({ user: { id: 'left-user' }, body: Buffer.from(binaryContent) }, 'group-1')).rejects.toBeInstanceOf(common_1.ForbiddenException);
        expect(chatService.sendMessage).not.toHaveBeenCalled();
    });
    it('rejects message from user who was removed', async () => {
        const controller = new chat_controller_1.ChatController(chatService);
        chatService.getActiveParticipant.mockResolvedValue(null);
        const encoder = new TextEncoder();
        const binaryContent = encoder.encode('I was removed');
        await expect(controller.sendMessage({ user: { id: 'removed-user' }, body: Buffer.from(binaryContent) }, 'group-1')).rejects.toBeInstanceOf(common_1.ForbiddenException);
    });
    it('allows message from active participant', async () => {
        const controller = new chat_controller_1.ChatController(chatService);
        chatService.getActiveParticipant.mockResolvedValue({ userId: 'active-user', status: 'active' });
        chatService.sendMessage.mockResolvedValue({
            _id: 'msg-1',
            content: 'Active message',
            deliveryStatus: 'sent',
        });
        const encoder = new TextEncoder();
        const binaryContent = encoder.encode('Active message');
        const result = await controller.sendMessage({ user: { id: 'active-user' }, body: Buffer.from(binaryContent) }, 'group-1');
        expect(chatService.sendMessage).toHaveBeenCalledWith('group-1', 'active-user', 'Active message');
        expect(result).toMatchObject({ success: true, data: { deliveryStatus: 'sent' } });
    });
    it('rejects read messages from non-active participant', async () => {
        const controller = new chat_controller_1.ChatController(chatService);
        chatService.getActiveParticipant.mockResolvedValue(null);
        await expect(controller.getMessages({ user: { id: 'non-member' } }, 'group-1', {})).rejects.toBeInstanceOf(common_1.ForbiddenException);
    });
});
//# sourceMappingURL=chat-group-forbidden-send.e2e-spec.js.map