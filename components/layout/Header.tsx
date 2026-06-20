'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const router = useRouter()

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
      <button className="btn btn-ghost btn-sm" onClick={signOut}>
        <i className="ti ti-logout" style={{ fontSize: 14, marginRight: 5, verticalAlign: '-2px' }} />
        Sign out
      </button>
    </div>
  )
}
