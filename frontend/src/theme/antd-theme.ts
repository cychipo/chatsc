import { ThemeConfig } from 'antd'
import { glassTheme } from './theme'

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: glassTheme.colorPrimary,
    colorBgBase: glassTheme.colorBgBase,
    colorTextBase: glassTheme.colorTextBase,
    colorBorderSecondary: glassTheme.colorBorderSecondary,
    borderRadius: glassTheme.borderRadius,
    boxShadowSecondary: glassTheme.boxShadowSecondary,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    Layout: {
      bodyBg: 'transparent',
      headerBg: 'rgba(255, 247, 237, 0.1)',
      siderBg: 'rgba(255, 247, 237, 0.1)',
    },
    Card: {
      colorBgContainer: 'rgba(255, 247, 237, 0.1)',
    },
  },
}
