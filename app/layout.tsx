import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Court Log',
  description: 'Match tracker for the regulars',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/tabler-icons/2.44.0/iconfont/tabler-icons.min.css"
        />
      </head>
      <body>
        <div id="app">{children}</div>
      </body>
    </html>
  )
}
