import { PropsWithChildren } from "react";
import { Layout } from "antd";
import { appShellStyle } from "../theme/theme";

const { Header, Content } = Layout;

export function LayoutShell({ children }: PropsWithChildren) {
  return (
    <Layout style={appShellStyle}>
      <Content>{children}</Content>
    </Layout>
  );
}
