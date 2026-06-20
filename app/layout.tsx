import type { Metadata } from 'next'
import './globals.css'
import BottomNav from '@/components/layout/BottomNav'

export const metadata: Metadata = {
  title: 'Court Log',
  description: 'Match tracker for the regulars',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css"
        />
      </head>
      <body>
        <div id="app">{children}</div>
        <BottomNav />
      </body>
    </html>
  )
}
