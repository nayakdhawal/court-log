'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/log',     label: 'Log',     icon: 'ti-edit' },
  { href: '/live',    label: 'Live',    icon: 'ti-circle-filled' },
  { href: '/history', label: 'History', icon: 'ti-list' },
  { href: '/stats',   label: 'Stats',   icon: 'ti-chart-bar' },
  { href: '/players', label: 'Players', icon: 'ti-users' },
]

export default function BottomNav() {
  const pathname = usePathname()
  if (pathname === '/login') return null

  return (
    <nav className="bottom-nav">
      {TABS.map(({ href, label, icon }) => {
        const active = pathname === href
        return (
          <Link key={href} href={href} className={`bottom-nav-item ${active ? 'active' : ''}`}>
            <i className={`ti ${icon}`} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
