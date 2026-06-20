'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const TABS = [
  { href: '/log',     label: 'Log match' },
  { href: '/live',    label: 'Live' },
  { href: '/history', label: 'History' },
  { href: '/stats',   label: 'Stats' },
  { href: '/players', label: 'Players' },
]

interface HeaderProps {
  hasLiveMatch?: boolean
}

export default function Header({ hasLiveMatch }: HeaderProps) {
  const pathname = usePathname()
  const router   = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="header">
      <div className="brand">
        <div className="brand-mark">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="9" fill="none" stroke="#E8B14F" strokeWidth="1.4" />
          </svg>
        </div>
        <div>
          <div className="brand-title">COURT LOG</div>
          <div className="brand-sub">match tracker for the regulars</div>
        </div>
      </div>

      <nav className="tab-row">
        {TABS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`tab-btn ${pathname === href ? 'active' : ''}`}
          >
            {label}
            {href === '/live' && hasLiveMatch ? ' •' : ''}
          </Link>
        ))}
        <button className="tab-btn" onClick={signOut} style={{ marginLeft: 8 }}>
          Sign out
        </button>
      </nav>
    </div>
  )
}
