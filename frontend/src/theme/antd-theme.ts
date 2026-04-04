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
    colorText: '#431407',
    colorTextSecondary: 'rgba(67, 20, 7, 0.76)',
    colorBgContainer: 'rgba(255, 252, 247, 0.96)',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    Layout: {
      bodyBg: 'transparent',
      headerBg: 'rgba(255, 252, 247, 0.96)',
      siderBg: 'rgba(255, 252, 247, 0.96)',
    },
    Card: {
      colorBgContainer: 'rgba(255, 252, 247, 0.96)',
    },
  },
}
