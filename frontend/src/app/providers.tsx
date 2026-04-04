import { ConfigProvider } from 'antd'
import { PropsWithChildren } from 'react'
import { antdTheme } from '../theme/antd-theme'

export function AppProviders({ children }: PropsWithChildren) {
  return <ConfigProvider theme={antdTheme}>{children}</ConfigProvider>
}
