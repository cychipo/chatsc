import { ConfigProvider } from 'antd'
import { PropsWithChildren, useEffect } from 'react'
import { readAuthErrorFromLocation, toAuthErrorMessage } from '../services/auth.service'
import { useAuthStore } from '../store/auth.store'
import { antdTheme } from '../theme/antd-theme'

function AuthBootstrap({ children }: PropsWithChildren) {
  const hydrateSession = useAuthStore((state) => state.hydrateSession)
  const setErrorMessage = useAuthStore((state) => state.setErrorMessage)

  useEffect(() => {
    void hydrateSession()
  }, [hydrateSession])

  useEffect(() => {
    const authError = readAuthErrorFromLocation(window.location.search)
    const message = toAuthErrorMessage(authError)

    if (!message) {
      return
    }

    setErrorMessage(message)
    window.history.replaceState({}, document.title, window.location.pathname)
  }, [setErrorMessage])

  return <>{children}</>
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ConfigProvider theme={antdTheme}>
      <AuthBootstrap>{children}</AuthBootstrap>
    </ConfigProvider>
  )
}
