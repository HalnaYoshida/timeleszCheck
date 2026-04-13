import { useState } from 'react'

interface AuthFormProps {
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string) => Promise<void>
}

export function AuthForm({ onSignIn, onSignUp }: AuthFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signUpDone, setSignUpDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signin') {
        await onSignIn(email, password)
      } else {
        await onSignUp(email, password)
        setSignUpDone(true)
      }
    } catch (err) {
      setError(err instanceof Error ? translateError(err.message) : '予期しないエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (signUpDone) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1 className="auth-title">timelesz TV Tracker</h1>
          <div className="auth-success">
            <p>確認メールを送信しました。</p>
            <p>メール内のリンクをクリックしてアカウントを有効化してください。</p>
            <button className="btn btn-secondary" onClick={() => { setSignUpDone(false); setMode('signin') }}>
              ログイン画面へ
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">timelesz TV Tracker</h1>
        <p className="auth-subtitle">
          {mode === 'signin' ? 'ログイン' : '新規登録'}
        </p>

        <form onSubmit={handleSubmit} className="form">
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
              placeholder={mode === 'signup' ? '6文字以上' : ''}
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={mode === 'signup' ? 6 : undefined}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? '処理中...' : mode === 'signin' ? 'ログイン' : '登録する'}
          </button>
        </form>

        <p className="auth-toggle">
          {mode === 'signin' ? (
            <>アカウントをお持ちでない方は{' '}
              <button className="auth-toggle-btn" onClick={() => { setMode('signup'); setError(null) }}>
                新規登録
              </button>
            </>
          ) : (
            <>すでにアカウントをお持ちの方は{' '}
              <button className="auth-toggle-btn" onClick={() => { setMode('signin'); setError(null) }}>
                ログイン
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

/** Supabase のエラーメッセージを日本語に変換 */
function translateError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'メールアドレスまたはパスワードが正しくありません'
  if (message.includes('Email not confirmed')) return 'メールアドレスの確認が完了していません'
  if (message.includes('User already registered')) return 'このメールアドレスはすでに登録されています'
  if (message.includes('Password should be at least')) return 'パスワードは6文字以上で入力してください'
  if (message.includes('Unable to validate email address')) return '有効なメールアドレスを入力してください'
  return message
}
