import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { AppearanceList } from './components/AppearanceList'
import { AddAppearanceForm } from './components/AddAppearanceForm'
import { useAppearances } from './hooks/useAppearances'
import './styles/index.css'

export default function App() {
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
  } = useAppearances()

  const [showAddForm, setShowAddForm] = useState(false)

  // 初回起動時に自動取得
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
        filterKanto={filterKanto}
        filterTerrestrial={filterTerrestrial}
        onFilterKantoChange={setFilterKanto}
        onFilterTerrestrialChange={setFilterTerrestrial}
        onRefresh={refresh}
        onAddClick={() => setShowAddForm(true)}
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
