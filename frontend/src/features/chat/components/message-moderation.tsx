import { Tag } from 'antd'
import type { MessageModerationResult } from '../../../types/chat'

export function MessageModeration({ moderationResult }: { moderationResult?: MessageModerationResult }) {
  if (!moderationResult?.isToxic) {
    return null
  }

  return (
    <div style={styles.wrapper}>
      <Tag color="volcano" style={styles.tag}>
        {moderationResult.warningMessage || 'Nội dung nhạy cảm'}
      </Tag>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    marginInlineEnd: 0,
    fontSize: 11,
  },
}
