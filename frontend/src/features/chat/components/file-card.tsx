import { Button, Typography } from 'antd'
import { Download, File, FileArchive, FileImage, FileText } from 'lucide-react'
import type { ChatAttachment } from '../../../types/chat'

type FileCardProps = {
  attachment: ChatAttachment
  onDownload?: (attachment: ChatAttachment) => void
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
}

function renderFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return <FileImage size={18} />
  }

  if (mimeType.includes('pdf') || mimeType.includes('text') || mimeType.includes('word')) {
    return <FileText size={18} />
  }

  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
    return <FileArchive size={18} />
  }

  return <File size={18} />
}

export function FileCard({ attachment, onDownload }: FileCardProps) {
  return (
    <div style={styles.card}>
      <div style={styles.leadingIcon}>{renderFileIcon(attachment.mimeType)}</div>
      <div style={styles.meta}>
        <Typography.Text ellipsis style={styles.fileName as never}>
          {attachment.fileName}
        </Typography.Text>
        <Typography.Text style={styles.fileInfo as never}>
          {attachment.mimeType || 'Tệp'} · {formatFileSize(attachment.sizeBytes)}
        </Typography.Text>
      </div>
      <Button
        type="text"
        shape="circle"
        icon={<Download size={16} />}
        onClick={() => onDownload?.(attachment)}
        aria-label={`Tải về ${attachment.fileName}`}
      />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    minWidth: 260,
    maxWidth: '100%',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 16,
    background: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(154, 52, 18, 0.12)',
  },
  leadingIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(194, 65, 12, 0.12)',
    color: '#9b2f00',
    flexShrink: 0,
  },
  meta: {
    display: 'grid',
    minWidth: 0,
    gap: 2,
  },
  fileName: {
    color: '#431407',
    fontWeight: 700,
  },
  fileInfo: {
    color: 'rgba(67, 20, 7, 0.55)',
    fontSize: 12,
  },
}
