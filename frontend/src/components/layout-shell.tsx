import { PropsWithChildren } from 'react'
import { Layout, Space, Typography } from 'antd'
import { AppIcon } from './icon'
import { appShellStyle } from '../theme/theme'

const { Header, Content } = Layout
const { Title, Paragraph } = Typography

export function LayoutShell({ children }: PropsWithChildren) {
  return (
    <Layout style={appShellStyle}>
      <Header
        style={{
          background: 'rgba(255, 247, 237, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Space align="center" size={12}>
          <AppIcon />
          <div>
            <Title level={4} style={{ margin: 0, color: '#fff7ed' }}>
              Chatsc Workspace
            </Title>
            <Paragraph style={{ margin: 0, color: 'rgba(255, 247, 237, 0.76)' }}>
              Frontend và backend được tổ chức nhất quán cho auth và chat.
            </Paragraph>
          </div>
        </Space>
      </Header>
      <Content>{children}</Content>
    </Layout>
  )
}
