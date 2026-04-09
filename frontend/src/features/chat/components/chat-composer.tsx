import { useRef } from 'react'
import { Button, Progress, Typography, message as antdMessage } from 'antd'
import { Paperclip, SendHorizontal, X } from 'lucide-react'

import type { ChatConnectionState, DraftAttachment } from '../../../types/chat'

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024

type ChatComposerProps = {
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  onSend: () => void
  onLeave?: () => void
  onSelectFile?: (file: File) => Promise<void> | void
  onRemoveDraftAttachment?: () => void
  draftAttachment?: DraftAttachment | null
  disabled?: boolean
  loading?: boolean
  connectionState?: ChatConnectionState
}

export function ChatComposer({
  value,
  onChange,
  onFocus,
  onSend,
  onSelectFile,
  onRemoveDraftAttachment,
  draftAttachment,
  disabled,
  loading,
  connectionState,
}: ChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (value.trim() && !disabled && !loading) {
        onSend()
      }
    }
  }

  const handleAttachmentClick = () => {
    if (!disabled && !loading) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath
    if (relativePath && relativePath.includes('/')) {
      antdMessage.error('Không hỗ trợ gửi thư mục.')
      return
    }

    if (file.size <= 0) {
      antdMessage.error('Tệp không hợp lệ hoặc rỗng.')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      antdMessage.error('Chỉ hỗ trợ gửi tệp tối đa 25MB.')
      return
    }

    try {
      await onSelectFile?.(file)
    } catch {
      antdMessage.error('Không thể gửi tệp lúc này.')
    }
  }

  return (
    <div style={styles.wrapper} data-testid="chat-composer">
      <input
        ref={fileInputRef}
        type="file"
        style={styles.hiddenInput}
        onChange={(event) => void handleFileChange(event)}
        disabled={disabled || loading}
      />
      {draftAttachment ? (
        <div style={styles.draftWrap}>
          <div style={styles.draftInfo}>
            <div>
              <Typography.Text strong>{draftAttachment.file.name}</Typography.Text>
              <div>
                <Typography.Text style={styles.draftStatusText as never}>
                  {draftAttachment.status === 'pending'
                    ? 'Đang chờ gửi'
                    : draftAttachment.status === 'uploading'
                      ? `Đang upload ${draftAttachment.progress}%`
                      : draftAttachment.status === 'uploaded'
                        ? 'Đã upload, đang gửi tin nhắn'
                        : draftAttachment.error || 'Upload thất bại'}
                </Typography.Text>
              </div>
            </div>
            {draftAttachment.status === 'pending' || draftAttachment.status === 'failed' ? (
              <Button
                type="text"
                shape="circle"
                icon={<X size={16} />}
                onClick={onRemoveDraftAttachment}
              />
            ) : null}
          </div>
          {draftAttachment.status === 'uploading' ? (
            <Progress percent={draftAttachment.progress} size="small" showInfo={false} />
          ) : null}
        </div>
      ) : null}
      <Button type="text" shape="circle" icon={<Paperclip size={16} />} disabled={disabled || loading || !!draftAttachment} style={styles.iconButton} onClick={handleAttachmentClick} />
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        placeholder="Nhập tin nhắn..."
        disabled={disabled || loading}
        rows={1}
        style={styles.input}
      />
      <Button
        type="text"
        shape="circle"
        icon={<SendHorizontal size={16} />}
        onClick={onSend}
        loading={loading}
        disabled={disabled || loading || (!value.trim() && !draftAttachment) || connectionState === 'connecting'}
        style={styles.iconButton}
      />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    borderRadius: 24,
    background: '#ffffff',
    border: '1px solid rgba(154, 52, 18, 0.12)',
  },
  draftWrap: {
    gridColumn: '1 / -1',
    display: 'grid',
    gap: 6,
    padding: '10px 12px',
    borderRadius: 16,
    background: '#fff7ed',
    border: '1px solid rgba(194, 65, 12, 0.14)',
  },
  draftInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  draftStatusText: {
    color: '#8d7168',
    fontSize: 12,
  },
  hiddenInput: {
    display: 'none',
  },
  input: {
    width: '100%',
    minHeight: 24,
    maxHeight: 88,
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
    background: 'transparent',
    color: '#431407',
    padding: '6px 4px',
    lineHeight: 1.45,
    resize: 'none',
    overflowY: 'auto',
    font: 'inherit',
  },
  iconButton: {
    color: '#8d7168',
  },
}
