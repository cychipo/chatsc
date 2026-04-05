"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const chat_controller_1 = require("../src/modules/chat/chat.controller");
describe('Chat binary decode e2e', () => {
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
    it('decodes valid UTF-8 binary payload successfully', async () => {
        const controller = new chat_controller_1.ChatController(chatService);
        chatService.getActiveParticipant.mockResolvedValue({ userId: 'user-1', status: 'active' });
        chatService.sendMessage.mockResolvedValue({
            _id: 'msg-1',
            content: 'Xin chào 你好',
            deliveryStatus: 'sent',
        });
        const encoder = new TextEncoder();
        const binaryContent = encoder.encode('Xin chào 你好');
        const result = await controller.sendMessage({ user: { id: 'user-1' }, body: Buffer.from(binaryContent) }, 'conv-1');
        expect(chatService.sendMessage).toHaveBeenCalledWith('conv-1', 'user-1', 'Xin chào 你好');
        expect(result).toMatchObject({ success: true, data: { content: 'Xin chào 你好' } });
    });
    it('returns decode error for invalid UTF-8 binary payload', async () => {
        const controller = new chat_controller_1.ChatController(chatService);
        chatService.getActiveParticipant.mockResolvedValue({ userId: 'user-1', status: 'active' });
        const invalidUtf8 = Buffer.from([0x80, 0x81, 0x82]);
        await expect(controller.sendMessage({ user: { id: 'user-1' }, body: invalidUtf8 }, 'conv-1')).rejects.toBeInstanceOf(common_1.BadRequestException);
    });
    it('returns decode error for empty message', async () => {
        const controller = new chat_controller_1.ChatController(chatService);
        chatService.getActiveParticipant.mockResolvedValue({ userId: 'user-1', status: 'active' });
        const emptyBuffer = Buffer.from([]);
        await expect(controller.sendMessage({ user: { id: 'user-1' }, body: emptyBuffer }, 'conv-1')).rejects.toBeInstanceOf(common_1.BadRequestException);
    });
    it('returns decode error for whitespace-only message', async () => {
        const controller = new chat_controller_1.ChatController(chatService);
        chatService.getActiveParticipant.mockResolvedValue({ userId: 'user-1', status: 'active' });
        const encoder = new TextEncoder();
        const whitespaceBuffer = encoder.encode('   \n\t  ');
        await expect(controller.sendMessage({ user: { id: 'user-1' }, body: Buffer.from(whitespaceBuffer) }, 'conv-1')).rejects.toBeInstanceOf(common_1.BadRequestException);
    });
});
//# sourceMappingURL=chat-binary-decode.e2e-spec.js.map