import { BadgeCheck, LogIn, ShieldCheck } from 'lucide-react'
import { Alert, Button, Card, Space, Typography } from 'antd'
import { startGoogleLogin } from '../../services/auth.service'
import { useAuthStore } from '../../store/auth.store'

const { Title, Paragraph, Text } = Typography

export function AuthPage() {
  const { errorMessage, clearError } = useAuthStore()

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
          maxWidth: 480,
          borderRadius: 24,
          background: 'rgba(255, 252, 247, 0.96)',
          border: '1px solid rgba(154, 52, 18, 0.12)',
          boxShadow: '0 16px 36px rgba(194, 65, 12, 0.12)',
        }}
      >
        <Space direction="vertical" size={20} style={{ width: '100%', textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto',
              borderRadius: 18,
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.92), rgba(234, 88, 12, 0.92))',
              color: '#fff7ed',
            }}
          >
            <ShieldCheck size={24} />
          </div>

          <div>
            <Space size={8} align="center" style={{ justifyContent: 'center' }}>
              <LogIn size={18} color="#c2410c" />
              <Text strong style={{ color: '#9a3412', fontSize: 14 }}>
                Google OAuth
              </Text>
            </Space>

            <Title level={2} style={{ margin: '12px 0 8px', color: '#431407' }}>
              Đăng nhập
            </Title>

            <Paragraph style={{ margin: 0, color: 'rgba(67, 20, 7, 0.72)', lineHeight: 1.7 }}>
              Tiếp tục với tài khoản Google để vào website và khôi phục phiên làm việc của bạn.
            </Paragraph>
          </div>

          {errorMessage ? (
            <Alert type="error" showIcon message={errorMessage} closable onClose={clearError} />
          ) : null}

          <Button
            type="primary"
            size="large"
            block
            icon={<BadgeCheck size={16} />}
            onClick={startGoogleLogin}
            style={{ height: 50, fontWeight: 600 }}
          >
            Tiếp tục với Google
          </Button>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: 16,
              background: 'rgba(255, 247, 237, 0.9)',
              border: '1px solid rgba(154, 52, 18, 0.08)',
              textAlign: 'left',
            }}
          >
            <Text strong style={{ display: 'block', marginBottom: 6, color: '#431407' }}>
              Bạn sẽ nhận được
            </Text>
            <Paragraph style={{ margin: 0, color: 'rgba(67, 20, 7, 0.72)' }}>
              Một phiên đăng nhập an toàn, hồ sơ người dùng được tạo từ email Google và quyền truy cập vào khu vực chat đã bảo vệ.
            </Paragraph>
          </div>
        </Space>
      </Card>
    </div>
  )
}
