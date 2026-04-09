import { useEffect, useState } from 'react'
import { Avatar, Image, Tag, Typography } from 'antd'
import type { Message, MembershipEvent, ChatAttachment } from '../../../types/chat'
import { FileCard } from './file-card'
import { MessageModeration } from './message-moderation'

type MessageBubbleProps = {
  message: Message
  isMine: boolean
  authorName: string
  authorAvatarUrl?: string
  anchorId?: string
  highlighted?: boolean
  resolveAttachmentUrl?: (attachmentId: string) => Promise<string>
  onAttachmentClick?: (attachment: ChatAttachment) => void
  onAttachmentDownload?: (attachment: ChatAttachment) => void
}

function buildAvatarFallbackLabel(authorName: string) {
  return authorName.trim().charAt(0).toUpperCase() || 'U'
}

export function MessageBubble({
  message,
  isMine,
  authorName,
  authorAvatarUrl,
  anchorId,
  highlighted = false,
  resolveAttachmentUrl,
  onAttachmentClick,
  onAttachmentDownload,
}: MessageBubbleProps) {
  const attachment = message.attachment
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!attachment?.isImage || !attachment.attachmentId || !resolveAttachmentUrl) {
      setImageUrl(null)
      return
    }

    let active = true

    void resolveAttachmentUrl(attachment.attachmentId)
      .then((url) => {
        if (active) {
          setImageUrl(url)
        }
      })
      .catch(() => {
        if (active) {
          setImageUrl(null)
        }
      })

    return () => {
      active = false
    }
  }, [attachment?.attachmentId, attachment?.isImage, resolveAttachmentUrl])

  return (
    <article
      id={anchorId}
      style={{
        ...styles.wrapper,
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        ...(highlighted ? styles.wrapperHighlighted : null),
      }}
      data-testid={isMine ? 'message-bubble-mine' : 'message-bubble-theirs'}
    >
      <div style={{ ...styles.row, flexDirection: isMine ? 'row-reverse' : 'row' }}>
        {!isMine ? (
          <Avatar
            size={28}
            src={message.isAIBotMessage ? undefined : authorAvatarUrl}
            style={message.isAIBotMessage ? styles.aiAvatar : styles.theirAvatar}
          >
            {message.isAIBotMessage ? 'AI' : buildAvatarFallbackLabel(authorName)}
          </Avatar>
        ) : null}

        <div style={{ ...styles.contentWrap, alignItems: isMine ? 'flex-end' : 'flex-start' }}>
          {!isMine ? (
            <div style={styles.meta}>
              <strong style={styles.author}>{message.isAIBotMessage ? 'ChatAI' : authorName}</strong>
              <span style={styles.time}>{new Date(message.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ) : null}

          <div style={{ ...styles.bubble, ...(message.isAIBotMessage ? styles.aiBubble : isMine ? styles.outgoing : styles.incoming), ...(message.isAICommand ? styles.aiCommandBubble : null) }}>
            {message.isAICommand ? (
              <Tag color="gold" style={styles.commandTag}>
                Lệnh AI
              </Tag>
            ) : null}
            {message.content.trim().length > 0 ? (
              <Typography.Paragraph style={{ ...styles.content, ...(message.isAICommand ? styles.aiCommandContent : null) } as never}>{message.content}</Typography.Paragraph>
            ) : null}

            <MessageModeration moderationResult={message.moderationResult} />

            {attachment?.isImage ? (
              <button
                type="button"
                onClick={() => onAttachmentClick?.(attachment)}
                style={styles.imageButton}
              >
                {imageUrl ? (
                  <Image src={imageUrl} alt={attachment.fileName} preview={false} style={styles.imagePreview} />
                ) : (
                  <div style={styles.imageFallback}>
                    <Typography.Text style={styles.imageFallbackText as never}>
                      {attachment.fileName}
                    </Typography.Text>
                  </div>
                )}
              </button>
            ) : attachment ? (
              <FileCard attachment={attachment} onDownload={onAttachmentDownload} />
            ) : null}
          </div>
          {isMine && message.isTailOfSenderGroup ? (
            <Typography.Text style={styles.statusText as never}>
              {message.seenState === 'seen' ? 'Đã xem' : 'Đã gửi'}
            </Typography.Text>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function EventBubble({ event }: { event: MembershipEvent }) {
  const text =
    event.type === 'added'
      ? 'Một thành viên mới đã được thêm vào cuộc trò chuyện.'
      : event.type === 'left'
        ? 'Một thành viên đã rời cuộc trò chuyện.'
        : event.type === 'removed'
          ? 'Một thành viên đã bị quản trị viên xóa khỏi cuộc trò chuyện.'
          : 'Một người tham gia mới vừa tham gia đoạn hội thoại.'

  return (
    <div style={styles.eventWrap}>
      <div style={styles.eventBubble}>
        <Typography.Paragraph style={styles.eventText as never}>{text}</Typography.Paragraph>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    width: '100%',
    marginBottom: 4,
    scrollMarginTop: 16,
  },
  wrapperHighlighted: {
    borderRadius: 22,
    background: 'rgba(251, 191, 36, 0.18)',
    boxShadow: '0 0 0 1px rgba(245, 158, 11, 0.22)',
    transition: 'background 0.2s ease',
  },
  row: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-end',
    maxWidth: '78%',
  },
  contentWrap: {
    display: 'grid',
    gap: 4,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    color: '#8d7168',
  },
  author: {
    color: '#380c02',
    fontWeight: 700,
    fontFamily: 'Manrope, sans-serif',
  },
  time: {
    color: '#8d7168',
  },
  bubble: {
    width: 'fit-content',
    maxWidth: '100%',
    padding: '12px 14px',
    borderRadius: 18,
    display: 'grid',
    gap: 10,
  },
  incoming: {
    background: '#ffe2db',
    color: '#380c02',
  },
  outgoing: {
    background: '#c2410c',
    color: '#ffffff',
    borderBottomRightRadius: 8,
    boxShadow: '0 18px 38px rgba(194, 65, 12, 0.14)',
  },
  aiBubble: {
    background: '#fff7ed',
    color: '#7c2d12',
    border: '1px solid rgba(194, 65, 12, 0.16)',
    boxShadow: '0 12px 24px rgba(194, 65, 12, 0.08)',
  },
  aiCommandBubble: {
    border: '1px dashed rgba(245, 158, 11, 0.5)',
  },
  commandTag: {
    marginInlineEnd: 0,
    width: 'fit-content',
    fontSize: 11,
  },
  content: {
    margin: 0,
    color: 'inherit',
    lineHeight: 1.55,
    fontSize: 13,
  },
  aiCommandContent: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  imageButton: {
    border: 'none',
    background: 'transparent',
    padding: 0,
    cursor: 'pointer',
    display: 'block',
    textAlign: 'left',
  },
  imagePreview: {
    width: 240,
    maxWidth: '100%',
    borderRadius: 14,
    objectFit: 'cover',
  },
  imageFallback: {
    width: 240,
    maxWidth: '100%',
    minHeight: 140,
    display: 'grid',
    placeItems: 'center',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.24)',
    padding: 16,
  },
  imageFallbackText: {
    color: 'inherit',
  },
  statusText: {
    color: '#8d7168',
    fontSize: 11,
    lineHeight: 1.2,
  },
  eventWrap: {
    display: 'flex',
    justifyContent: 'center',
    margin: '8px 0 12px',
  },
  eventBubble: {
    maxWidth: '68%',
    background: 'rgba(251, 146, 60, 0.08)',
    padding: '10px 14px',
    borderRadius: 18,
    textAlign: 'center',
  },
  eventText: {
    margin: 0,
    color: '#8d7168',
    fontSize: 12,
    lineHeight: 1.45,
  },
  theirAvatar: {
    background: '#ffffff',
    color: '#9b2f00',
    flex: '0 0 28px',
    minWidth: 28,
    minHeight: 28,
    alignSelf: 'flex-start',
  },
  aiAvatar: {
    background: '#fff7ed',
    color: '#c2410c',
    border: '1px solid rgba(194, 65, 12, 0.18)',
    flex: '0 0 28px',
    minWidth: 28,
    minHeight: 28,
    alignSelf: 'flex-start',
  },
}
