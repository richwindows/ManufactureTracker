import './globals.css'

export const metadata = {
  title: '产品管理系统',
  description: 'Next.js扫码枪产品管理系统',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
