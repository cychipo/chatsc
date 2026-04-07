import { Avatar, Typography } from 'antd'
import type { Message, MembershipEvent } from '../../../types/chat'

type MessageBubbleProps = {
  message: Message
  isMine: boolean
  authorName: string
  authorAvatarUrl?: string
  anchorId?: string
  highlighted?: boolean
}

function buildAvatarFallbackLabel(authorName: string) {
  return authorName.trim().charAt(0).toUpperCase() || 'U'
}

export function MessageBubble({ message, isMine, authorName, authorAvatarUrl, anchorId, highlighted = false }: MessageBubbleProps) {
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
          <Avatar size={28} src={authorAvatarUrl} style={styles.theirAvatar}>
            {buildAvatarFallbackLabel(authorName)}
          </Avatar>
        ) : null}

        <div style={{ ...styles.contentWrap, alignItems: isMine ? 'flex-end' : 'flex-start' }}>
          {!isMine ? (
            <div style={styles.meta}>
              <strong style={styles.author}>{authorName}</strong>
              <span style={styles.time}>{new Date(message.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ) : null}

          <div style={{ ...styles.bubble, ...(isMine ? styles.outgoing : styles.incoming) }}>
            <Typography.Paragraph style={styles.content as never}>{message.content}</Typography.Paragraph>
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
  content: {
    margin: 0,
    color: 'inherit',
    lineHeight: 1.55,
    fontSize: 13,
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
  myAvatar: {
    background: 'linear-gradient(135deg, #9b2f00, #c2410c)',
    color: '#ffffff',
  },
  theirAvatar: {
    background: '#ffffff',
    color: '#9b2f00',
  },
}
