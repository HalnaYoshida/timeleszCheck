import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { AppearanceList } from './components/AppearanceList'
import { AddAppearanceForm } from './components/AddAppearanceForm'
import { AuthForm } from './components/AuthForm'
import { useAppearances } from './hooks/useAppearances'
import { useAuth } from './hooks/useAuth'
import './styles/index.css'

export default function App() {
  const { user, authLoading, signUp, signIn, signInWithGoogle, signInWithTwitter, signOut } = useAuth()

  if (authLoading) {
    return <div className="auth-loading">読み込み中...</div>
  }

  if (!user) {
    return (
      <AuthForm
        onSignIn={signIn}
        onSignUp={signUp}
        onSignInWithGoogle={signInWithGoogle}
        onSignInWithTwitter={signInWithTwitter}
      />
    )
  }

  return <MainApp userId={user.id} userEmail={user.email ?? ''} onSignOut={signOut} />
}

/** 認証後のメイン画面（userId が確定してからマウントされる） */
function MainApp({
  userId,
  userEmail,
  onSignOut,
}: {
  userId: string
  userEmail: string
  onSignOut: () => Promise<void>
}) {
  const {
    todayItems,
    upcomingItems,
    unwatchedPastItems,
    filterKanto,
    filterTerrestrial,
    setFilterKanto,
    setFilterTerrestrial,
    loading,
    error,
    lastFetched,
    refresh,
    toggleWatched,
    addManual,
    remove,
  } = useAppearances(userId)

  const [showAddForm, setShowAddForm] = useState(false)

  // 初回ロード後、まだ一度もフェッチしていなければ自動取得
  useEffect(() => {
    if (!lastFetched) {
      refresh()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="app">
      <Header
        loading={loading}
        lastFetched={lastFetched}
        userEmail={userEmail}
        filterKanto={filterKanto}
        filterTerrestrial={filterTerrestrial}
        onFilterKantoChange={setFilterKanto}
        onFilterTerrestrialChange={setFilterTerrestrial}
        onRefresh={refresh}
        onAddClick={() => setShowAddForm(true)}
        onSignOut={onSignOut}
      />

      <main className="main">
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={refresh} className="btn btn-sm">再試行</button>
          </div>
        )}

        <AppearanceList
          title="今日の出演"
          icon="📺"
          items={todayItems}
          emptyMessage="今日の出演予定はありません"
          onToggle={toggleWatched}
          onRemove={remove}
        />

        <AppearanceList
          title="今後の出演予定"
          icon="📅"
          items={upcomingItems}
          emptyMessage="今後の出演予定はありません"
          onToggle={toggleWatched}
          onRemove={remove}
        />

        <AppearanceList
          title="未視聴の過去番組"
          icon="⏰"
          items={unwatchedPastItems}
          emptyMessage="未視聴の過去番組はありません"
          onToggle={toggleWatched}
          onRemove={remove}
        />
      </main>

      {showAddForm && (
        <AddAppearanceForm
          onAdd={addManual}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}
