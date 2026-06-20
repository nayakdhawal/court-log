import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--chalk)',
    }}>
      <div style={{ width: '100%', maxWidth: 380, padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="brand-mark" style={{ margin: '0 auto 16px', width: 52, height: 52 }}>
            <svg width="24" height="24" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="9" fill="none" stroke="#E8B14F" strokeWidth="1.4" />
            </svg>
          </div>
          <div className="brand-title" style={{ fontSize: 32 }}>COURT LOG</div>
          <div className="brand-sub">match tracker for the regulars</div>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
