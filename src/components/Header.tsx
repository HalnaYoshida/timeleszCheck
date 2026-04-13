interface HeaderProps {
  loading: boolean
  lastFetched: string | null
  userEmail: string
  filterKanto: boolean
  filterTerrestrial: boolean
  onFilterKantoChange: (v: boolean) => void
  onFilterTerrestrialChange: (v: boolean) => void
  onRefresh: () => void
  onAddClick: () => void
  onSignOut: () => Promise<void>
}

export function Header({
  loading,
  lastFetched,
  userEmail,
  filterKanto,
  filterTerrestrial,
  onFilterKantoChange,
  onFilterTerrestrialChange,
  onRefresh,
  onAddClick,
  onSignOut,
}: HeaderProps) {
  const lastFetchedText = lastFetched
    ? new Date(lastFetched).toLocaleString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <header className="header">
      <div className="header-title">
        <h1>timelesz TV Tracker</h1>
        {lastFetchedText && (
          <span className="last-fetched">最終更新: {lastFetchedText}</span>
        )}
      </div>

      <div className="header-filters">
        <label className={`filter-chip ${filterKanto ? 'filter-chip--active' : ''}`}>
          <input
            type="checkbox"
            checked={filterKanto}
            onChange={(e) => onFilterKantoChange(e.target.checked)}
          />
          関東
        </label>
        <label className={`filter-chip ${filterTerrestrial ? 'filter-chip--active' : ''}`}>
          <input
            type="checkbox"
            checked={filterTerrestrial}
            onChange={(e) => onFilterTerrestrialChange(e.target.checked)}
          />
          地上波
        </label>
      </div>

      <div className="header-actions">
        <button
          className="btn btn-secondary"
          onClick={onAddClick}
          disabled={loading}
        >
          + 手動追加
        </button>
        <button
          className="btn btn-primary"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? '取得中...' : '更新'}
        </button>
        <div className="user-menu">
          <span className="user-email">{userEmail}</span>
          <button className="btn btn-secondary" onClick={onSignOut}>
            ログアウト
          </button>
        </div>
      </div>
    </header>
  )
}
