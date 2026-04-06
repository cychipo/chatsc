import { Avatar, Typography } from 'antd'
import { Shield, UserRound, Cpu, Sparkles } from 'lucide-react'
import type { Conversation } from '../../../types/chat'

const avatarMap = [UserRound, Shield, Cpu, Sparkles]

type ConversationListProps = {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (conversationId: string) => void
  onContextMenu: (conversation: Conversation, event: React.MouseEvent<HTMLButtonElement>) => void
}

function GroupAvatar() {
  return (
    <div style={styles.avatarGrid} aria-label="Group avatar">
      {avatarMap.map((Icon, index) => (
        <div key={index} style={styles.avatarMini}>
          <Icon size={9} />
        </div>
      ))}
    </div>
  )
}

function DirectAvatar({ conversation }: { conversation: Conversation }) {
  if (conversation.displayAvatarUrl) {
    return <Avatar src={conversation.displayAvatarUrl} size={34} />
  }

  return (
    <div style={styles.avatar}>
      {conversation.displayTitle?.charAt(0).toUpperCase() ?? <UserRound size={15} />}
    </div>
  )
}

function formatConversationTime(value?: string) {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ConversationList({ conversations, selectedId, onSelect, onContextMenu }: ConversationListProps) {
  return (
    <div style={styles.list}>
      {conversations.map((conversation) => {
        const active = conversation._id === selectedId
        const title = conversation.displayTitle ?? conversation.title ?? 'Đoạn chat mới'
        const preview = conversation.lastMessagePreview || (conversation.type === 'direct'
          ? `Chào ${title} ngay`
          : 'Bắt đầu cuộc trò chuyện ngay')
        const time = formatConversationTime(conversation.lastMessageAt)
        const unreadCount = conversation.unreadCount ?? 0

        return (
          <button
            key={conversation._id}
            type="button"
            onClick={() => onSelect(conversation._id)}
            onContextMenu={(event) => onContextMenu(conversation, event)}
            style={{
              ...styles.item,
              ...(active ? styles.itemActive : null),
            }}
          >
            {conversation.type === 'group' ? <GroupAvatar /> : <DirectAvatar conversation={conversation} />}
            <div style={styles.itemMain}>
              <div style={styles.nameRow}>
                <Typography.Text style={styles.nameText as never}>{title}</Typography.Text>
                <div style={styles.metaRight}>
                  {time ? <span style={styles.timeText}>{time}</span> : null}
                  {unreadCount > 0 ? <span style={styles.unreadBadge}>{unreadCount}</span> : null}
                </div>
              </div>
              <Typography.Paragraph ellipsis={{ rows: 2 }} style={styles.previewText as never}>
                {preview}
              </Typography.Paragraph>
            </div>
          </button>
        )
      })}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  list: {
    display: 'grid',
    gap: 10,
  },
  item: {
    border: 'none',
    background: 'rgba(255, 255, 255, 0.48)',
    borderRadius: 24,
    padding: '12px 12px',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: 12,
    textAlign: 'left',
    cursor: 'pointer',
    alignItems: 'start',
  },
  itemActive: {
    background: 'rgba(255, 255, 255, 0.82)',
    boxShadow: '0 10px 24px rgba(194, 65, 12, 0.08)',
  },
  itemMain: {
    minWidth: 0,
    display: 'grid',
    gap: 4,
    paddingTop: 2,
  },
  nameRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    alignItems: 'center',
  },
  metaRight: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  nameText: {
    fontSize: 13,
    fontWeight: 700,
    color: '#380c02',
    fontFamily: 'Manrope, sans-serif',
  },
  timeText: {
    fontSize: 11,
    color: '#8d7168',
    fontWeight: 600,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    padding: '0 6px',
    borderRadius: 999,
    display: 'inline-grid',
    placeItems: 'center',
    background: '#c2410c',
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 700,
  },
  previewText: {
    margin: 0,
    fontSize: 11,
    lineHeight: 1.4,
    color: '#8d7168',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    color: '#ffffff',
    background: 'linear-gradient(135deg, #9b2f00, #c2410c)',
    flex: '0 0 auto',
  },
  avatarGrid: {
    width: 34,
    height: 34,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: 2,
    padding: 2,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.9)',
    flex: '0 0 auto',
  },
  avatarMini: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    color: '#ffffff',
    background: 'linear-gradient(135deg, #9b2f00, #c2410c)',
  },
}
