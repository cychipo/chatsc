import { Button } from 'antd'
import { Plus, SendHorizontal } from 'lucide-react'

import type { ChatConnectionState } from '../../../types/chat'

type ChatComposerProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onLeave?: () => void
  disabled?: boolean
  loading?: boolean
  connectionState?: ChatConnectionState
}

export function ChatComposer({ value, onChange, onSend, disabled, loading, connectionState }: ChatComposerProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (value.trim() && !disabled && !loading) {
        onSend()
      }
    }
  }

  return (
    <div style={styles.wrapper}>
      <Button type="text" shape="circle" icon={<Plus size={16} />} disabled={disabled} style={styles.iconButton} />
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nhập tin nhắn..."
        disabled={disabled}
        rows={1}
        style={styles.input}
      />
      <Button
        type="text"
        shape="circle"
        icon={<SendHorizontal size={16} />}
        onClick={onSend}
        loading={loading}
        disabled={disabled || !value.trim() || connectionState === 'connecting'}
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
