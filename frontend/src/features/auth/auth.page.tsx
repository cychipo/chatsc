import { useState } from 'react'
import { BadgeCheck, LogIn, ShieldCheck, UserPlus } from 'lucide-react'
import { Alert, Button, Card, Form, Input, Space, Typography } from 'antd'
import { startGoogleLogin } from '../../services/auth.service'
import { useAuthStore } from '../../store/auth.store'
import { AuthFormMode, LoginLocalAuthRequest, RegisterLocalAuthRequest } from '../../types/auth'

const { Title, Paragraph, Text } = Typography

type LoginFormValues = LoginLocalAuthRequest

type RegisterFormValues = RegisterLocalAuthRequest

export function AuthPage() {
  const { errorMessage, clearError, registerLocalAccount, loginLocalAccount, setErrorMessage } = useAuthStore()
  const [loginForm] = Form.useForm<LoginFormValues>()
  const [registerForm] = Form.useForm<RegisterFormValues>()
  const [authMode, setAuthMode] = useState<AuthFormMode>('google')
  const [submitting, setSubmitting] = useState(false)

  const titleByMode: Record<AuthFormMode, string> = {
    google: 'Đăng nhập',
    login: 'Đăng nhập tài khoản thường',
    register: 'Đăng ký tài khoản thường',
  }

  const descriptionByMode: Record<AuthFormMode, string> = {
    google: 'Tiếp tục với tài khoản Google hoặc chọn tài khoản thường để vào website và khôi phục phiên làm việc của bạn.',
    login: 'Nhập email và mật khẩu để đăng nhập bằng tài khoản thường.',
    register: 'Tạo tài khoản thường mới để vào hệ thống mà không phụ thuộc vào Google login.',
  }

  const switchMode = (nextMode: AuthFormMode) => {
    clearError()
    setAuthMode(nextMode)
  }

  const handleRegister = async (values: RegisterFormValues) => {
    setSubmitting(true)
    clearError()

    try {
      await registerLocalAccount(values)
    } catch (error) {
      setErrorMessage(readSubmitErrorMessage(error, 'Không thể đăng ký tài khoản thường.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogin = async (values: LoginFormValues) => {
    setSubmitting(true)
    clearError()

    try {
      await loginLocalAccount(values)
    } catch (error) {
      setErrorMessage(readSubmitErrorMessage(error, 'Không thể đăng nhập bằng tài khoản thường.'))
    } finally {
      setSubmitting(false)
    }
  }

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
          maxWidth: 520,
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
            <Space size={8} align="center" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button type={authMode === 'google' ? 'primary' : 'default'} onClick={() => switchMode('google')}>
                Google
              </Button>
              <Button type={authMode === 'login' ? 'primary' : 'default'} onClick={() => switchMode('login')}>
                Đăng nhập thường
              </Button>
              <Button type={authMode === 'register' ? 'primary' : 'default'} onClick={() => switchMode('register')}>
                Đăng ký thường
              </Button>
            </Space>

            <Title level={2} style={{ margin: '12px 0 8px', color: '#431407' }}>
              {titleByMode[authMode]}
            </Title>

            <Paragraph style={{ margin: 0, color: 'rgba(67, 20, 7, 0.72)', lineHeight: 1.7 }}>
              {descriptionByMode[authMode]}
            </Paragraph>
          </div>

          {errorMessage ? (
            <Alert type="error" showIcon message={errorMessage} closable onClose={clearError} />
          ) : null}

          {authMode === 'google' ? (
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
          ) : null}

          {authMode === 'login' ? (
            <Form<LoginFormValues> form={loginForm} layout="vertical" onFinish={handleLogin}>
              <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Vui lòng nhập email' }]}>
                <Input size="large" placeholder="email@example.com" />
              </Form.Item>
              <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
                <Input.Password size="large" placeholder="Nhập mật khẩu" />
              </Form.Item>
              <Button type="primary" htmlType="submit" size="large" block loading={submitting} icon={<LogIn size={16} />}>
                Đăng nhập tài khoản thường
              </Button>
            </Form>
          ) : null}

          {authMode === 'register' ? (
            <Form<RegisterFormValues> form={registerForm} layout="vertical" onFinish={handleRegister}>
              <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Vui lòng nhập email' }]}>
                <Input size="large" placeholder="email@example.com" />
              </Form.Item>
              <Form.Item label="Username" name="username" rules={[{ required: true, message: 'Vui lòng nhập username' }]}>
                <Input size="large" placeholder="alice" />
              </Form.Item>
              <Form.Item label="Tên hiển thị" name="displayName" rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị' }]}>
                <Input size="large" placeholder="Alice" />
              </Form.Item>
              <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
                <Input.Password size="large" placeholder="Nhập mật khẩu" />
              </Form.Item>
              <Form.Item
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp'))
                    },
                  }),
                ]}
              >
                <Input.Password size="large" placeholder="Nhập lại mật khẩu" />
              </Form.Item>
              <Button type="primary" htmlType="submit" size="large" block loading={submitting} icon={<UserPlus size={16} />}>
                Đăng ký tài khoản thường
              </Button>
            </Form>
          ) : null}

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
              Tuỳ chọn xác thực
            </Text>
            <Paragraph style={{ margin: 0, color: 'rgba(67, 20, 7, 0.72)' }}>
              Google login vẫn hoạt động như cũ. Tài khoản thường phù hợp khi bạn muốn tự đăng ký bằng email, username và mật khẩu.
            </Paragraph>
          </div>
        </Space>
      </Card>
    </div>
  )
}

function readSubmitErrorMessage(error: unknown, fallbackMessage: string) {
  const candidate = error as {
    response?: {
      data?: {
        message?: string
      }
    }
  }

  return candidate.response?.data?.message ?? fallbackMessage
}
