import { LogOut, ShieldCheck } from 'lucide-react'
import { Avatar, Button, Card, Space, Typography } from 'antd'
import { useAuthStore } from '../store/auth.store'

const { Title, Paragraph, Text } = Typography

export function HomePage() {
  const { currentUser, logout } = useAuthStore()

  return (
    <div
      style={{
        width: '100%',
        minHeight: 'calc(100vh - 48px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Card
        variant="borderless"
        style={{
          width: '100%',
          maxWidth: 720,
          background: 'rgba(255, 252, 247, 0.96)',
          border: '1px solid rgba(154, 52, 18, 0.12)',
          boxShadow: '0 16px 36px rgba(194, 65, 12, 0.12)',
        }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space align="center" size={12}>
            <ShieldCheck size={28} color="#c2410c" />
            <Title level={2} style={{ margin: 0, color: '#431407' }}>
              Welcome back
            </Title>
          </Space>

          <Paragraph style={{ margin: 0, color: 'rgba(67, 20, 7, 0.72)' }}>
            Your Google session is active and the protected workspace is ready.
          </Paragraph>

          {currentUser ? (
            <Space align="center" size={16}>
              <Avatar src={currentUser.avatarUrl} size={52}>
                {currentUser.displayName.charAt(0)}
              </Avatar>
              <Space direction="vertical" size={0}>
                <Text strong style={{ color: '#431407' }}>
                  {currentUser.displayName}
                </Text>
                <Text style={{ color: 'rgba(67, 20, 7, 0.72)' }}>{currentUser.email}</Text>
                <Text style={{ color: '#c2410c' }}>@{currentUser.username}</Text>
              </Space>
            </Space>
          ) : null}

          <Button icon={<LogOut size={16} />} onClick={() => void logout()}>
            Logout
          </Button>
        </Space>
      </Card>
    </div>
  )
}
