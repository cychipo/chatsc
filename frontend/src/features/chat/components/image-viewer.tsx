import { Button, Image, Modal, Spin, Typography } from 'antd'
import { Download, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import type { ChatAttachment } from '../../../types/chat'

type ImageViewerProps = {
  open: boolean
  attachment: ChatAttachment | null
  imageUrl?: string
  loading?: boolean
  scale: number
  onClose: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onDownload: () => void
}

export function ImageViewer({
  open,
  attachment,
  imageUrl,
  loading = false,
  scale,
  onClose,
  onZoomIn,
  onZoomOut,
  onReset,
  onDownload,
}: ImageViewerProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={960}
      maskClosable
      title={attachment?.fileName ?? 'Xem ảnh'}
    >
      <div style={styles.wrapper}>
        <div style={styles.toolbar}>
          <Typography.Text style={styles.scaleText as never}>{Math.round(scale * 100)}%</Typography.Text>
          <Button type="text" shape="circle" icon={<ZoomOut size={16} />} onClick={onZoomOut} aria-label="Thu nhỏ" />
          <Button type="text" shape="circle" icon={<ZoomIn size={16} />} onClick={onZoomIn} aria-label="Phóng to" />
          <Button type="text" shape="circle" icon={<RotateCcw size={16} />} onClick={onReset} aria-label="Đặt lại" />
          <Button type="text" shape="circle" icon={<Download size={16} />} onClick={onDownload} aria-label="Tải về" />
        </div>
        <div style={styles.canvas}>
          {loading || !imageUrl ? (
            <div style={styles.loadingWrap}>
              <Spin />
            </div>
          ) : (
            <Image
              src={imageUrl}
              alt={attachment?.fileName}
              preview={false}
              style={{
                ...styles.image,
                transform: `scale(${scale})`,
              }}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'grid',
    gap: 16,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  scaleText: {
    marginRight: 'auto',
    color: 'rgba(67, 20, 7, 0.55)',
    fontSize: 13,
  },
  canvas: {
    minHeight: 420,
    overflow: 'auto',
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(251, 244, 234, 0.65)',
    borderRadius: 18,
    padding: 24,
  },
  loadingWrap: {
    minHeight: 320,
    display: 'grid',
    placeItems: 'center',
    width: '100%',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '70vh',
    transition: 'transform 0.2s ease',
    transformOrigin: 'center center',
  },
}
