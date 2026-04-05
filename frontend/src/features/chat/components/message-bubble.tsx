import { Avatar, Typography } from 'antd'
import { Shield, UserRound } from 'lucide-react'
import type { Message, MembershipEvent } from '../../../types/chat'

type MessageBubbleProps = {
  message: Message
  isMine: boolean
  authorName: string
}

export function MessageBubble({ message, isMine, authorName }: MessageBubbleProps) {
  return (
    <article style={{ ...styles.wrapper, flexDirection: isMine ? 'row-reverse' : 'row' }}>
      <Avatar size={28} style={isMine ? styles.myAvatar : styles.theirAvatar}>
        {isMine ? <Shield size={13} /> : <UserRound size={13} />}
      </Avatar>

      <div style={{ ...styles.contentWrap, alignItems: isMine ? 'flex-end' : 'flex-start' }}>
        <div style={styles.meta}>
          <strong style={styles.author}>{authorName}</strong>
          <span style={styles.time}>{new Date(message.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div style={{ ...styles.bubble, ...(isMine ? styles.outgoing : styles.incoming) }}>
          <Typography.Paragraph style={styles.content as never}>{message.content}</Typography.Paragraph>
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
    gap: 10,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  contentWrap: {
    display: 'grid',
    gap: 6,
    flex: 1,
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
    maxWidth: '82%',
    padding: '14px 16px',
    borderRadius: 24,
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
