import { Button, Input } from 'antd'
import { Plus, SendHorizontal } from 'lucide-react'

type ChatComposerProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onLeave?: () => void
  disabled?: boolean
  loading?: boolean
}

export function ChatComposer({ value, onChange, onSend, disabled, loading }: ChatComposerProps) {
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
      <Input.TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nhập tin nhắn..."
        disabled={disabled}
        autoSize={{ minRows: 1, maxRows: 4 }}
        style={styles.input}
      />
      <Button type="text" shape="circle" icon={<SendHorizontal size={16} />} onClick={onSend} loading={loading} disabled={disabled || !value.trim()} style={styles.iconButton} />
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
    borderRadius: 999,
    background: '#ffffff',
    border: '1px solid rgba(154, 52, 18, 0.12)',
  },
  input: {
    border: 'none',
    boxShadow: 'none',
    background: 'transparent',
    color: '#431407',
    paddingInline: 4,
  },
  iconButton: {
    color: '#8d7168',
  },
}
