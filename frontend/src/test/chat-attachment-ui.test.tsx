import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ChatComposer } from '../features/chat/components/chat-composer'
import { FileCard } from '../features/chat/components/file-card'
import { MessageBubble } from '../features/chat/components/message-bubble'

const { errorMock } = vi.hoisted(() => ({
  errorMock: vi.fn(),
}))

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')
  return {
    ...actual,
    message: {
      error: errorMock,
    },
  }
})

describe('Chat attachment UI', () => {
  beforeEach(() => {
    errorMock.mockReset()
  })

  it('renders file card and triggers download', () => {
    const onDownload = vi.fn()

    render(
      <FileCard
        attachment={{
          attachmentId: 'att-1',
          fileName: 'report.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 2048,
          isImage: false,
        }}
        onDownload={onDownload}
      />,
    )

    expect(screen.getByText('report.pdf')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /tải về report.pdf/i }))
    expect(onDownload).toHaveBeenCalledTimes(1)
  })

  it('renders inline image attachment and resolves preview url', async () => {
    const resolveAttachmentUrl = vi.fn().mockResolvedValue('https://example.com/image.png')

    render(
      <MessageBubble
        message={{
          _id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'user-1',
          content: '',
          sentAt: new Date().toISOString(),
          deliveryStatus: 'sent',
          attachment: {
            attachmentId: 'att-1',
            fileName: 'photo.png',
            mimeType: 'image/png',
            sizeBytes: 1024,
            isImage: true,
          },
        }}
        isMine
        authorName='Bạn'
        resolveAttachmentUrl={resolveAttachmentUrl}
        onAttachmentClick={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(resolveAttachmentUrl).toHaveBeenCalledWith('att-1')
    })
  })

  it('rejects oversized files before upload starts', async () => {
    const onSelectFile = vi.fn()
    const { container } = render(
      <ChatComposer
        value=''
        onChange={vi.fn()}
        onSend={vi.fn()}
        onSelectFile={onSelectFile}
      />,
    )

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['x'], 'big.zip', { type: 'application/zip' })
    Object.defineProperty(file, 'size', { value: 26 * 1024 * 1024 })

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(errorMock).toHaveBeenCalledWith('Chỉ hỗ trợ gửi tệp tối đa 25MB.')
    })
    expect(onSelectFile).not.toHaveBeenCalled()
  })

  it('rejects folder uploads before upload starts', async () => {
    const onSelectFile = vi.fn()
    const { container } = render(
      <ChatComposer
        value=''
        onChange={vi.fn()}
        onSend={vi.fn()}
        onSelectFile={onSelectFile}
      />,
    )

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['x'], 'nested.txt', { type: 'text/plain' }) as File & { webkitRelativePath?: string }
    Object.defineProperty(file, 'webkitRelativePath', { value: 'folder/nested.txt' })

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(errorMock).toHaveBeenCalledWith('Không hỗ trợ gửi thư mục.')
    })
    expect(onSelectFile).not.toHaveBeenCalled()
  })
})
