import { useState } from 'react'

interface AuthFormProps {
  onSignInWithGoogle: () => Promise<void>
  onSignInWithTwitter: () => Promise<void>
  onSignIn: (email: string, password: string) => Promise<void>
}

export function AuthForm({ onSignInWithGoogle, onSignInWithTwitter, onSignIn }: AuthFormProps) {
  const [showEmail, setShowEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleOAuth = async (provider: 'google' | 'twitter') => {
    setError(null)
    setLoading(provider)
    try {
      if (provider === 'google') await onSignInWithGoogle()
      else await onSignInWithTwitter()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました')
      setLoading(null)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading('email')
    try {
      await onSignIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? translateError(err.message) : 'ログインに失敗しました')
      setLoading(null)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">timelesz TV Tracker</h1>
        <p className="auth-subtitle">ログインして視聴記録を同期する</p>

        {error && <p className="auth-error">{error}</p>}

        {/* SNS ログインボタン */}
        <div className="oauth-buttons">
          <button
            className="oauth-btn oauth-btn--google"
            onClick={() => handleOAuth('google')}
            disabled={loading !== null}
          >
            <GoogleIcon />
            {loading === 'google' ? '処理中...' : 'Googleでログイン'}
          </button>

          <button
            className="oauth-btn oauth-btn--twitter"
            onClick={() => handleOAuth('twitter')}
            disabled={loading !== null}
          >
            <TwitterIcon />
            {loading === 'twitter' ? '処理中...' : 'X（Twitter）でログイン'}
          </button>
        </div>

        {/* メール/パスワード（折りたたみ） */}
        <div className="auth-divider">
          <span>または</span>
        </div>

        {!showEmail ? (
          <button
            className="auth-toggle-btn auth-email-toggle"
            onClick={() => setShowEmail(true)}
          >
            メールアドレスでログイン
          </button>
        ) : (
          <form onSubmit={handleEmailSubmit} className="form">
            <div className="form-group">
              <label htmlFor="email">メールアドレス</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">パスワード</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading !== null}
            >
              {loading === 'email' ? '処理中...' : 'ログイン'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

function TwitterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

function translateError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'メールアドレスまたはパスワードが正しくありません'
  if (message.includes('Email not confirmed')) return 'メールアドレスの確認が完了していません'
  return message
}
