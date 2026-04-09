import { Button, Skeleton } from 'antd'

export type SmartReplySuggestionsProps = {
  suggestions: string[]
  loading?: boolean
  disabled?: boolean
  onSelect: (value: string) => void
}

export function SmartReplySuggestions({ suggestions, loading = false, disabled = false, onSelect }: SmartReplySuggestionsProps) {
  if (loading) {
    return <Skeleton.Button active block size="small" style={{ height: 36, borderRadius: 18 }} />
  }

  if (disabled || suggestions.length === 0) {
    return null
  }

  return (
    <div style={styles.wrapper}>
      {suggestions.map((suggestion) => (
        <Button key={suggestion} size="small" shape="round" style={styles.chip} onClick={() => onSelect(suggestion)}>
          {suggestion}
        </Button>
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '0 4px 8px',
  },
  chip: {
    borderColor: 'rgba(194, 65, 12, 0.18)',
    color: '#9a3412',
    background: '#fff7ed',
  },
}
