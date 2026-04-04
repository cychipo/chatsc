import { Card, Space, Typography } from 'antd'

const { Title, Paragraph } = Typography

export function HomePage() {
  return (
    <Card variant="borderless" style={{ maxWidth: 720, background: 'rgba(255, 247, 237, 0.1)' }}>
      <Space direction="vertical" size={12}>
        <Title level={2} style={{ margin: 0, color: '#fff7ed' }}>
          FE + BE Codebase Foundation
        </Title>
        <Paragraph style={{ margin: 0, color: 'rgba(255, 247, 237, 0.76)' }}>
          Frontend React/Vite và backend NestJS đã được tách rõ để tiếp tục phát triển auth và chat.
        </Paragraph>
      </Space>
    </Card>
  )
}
