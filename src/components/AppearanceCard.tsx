import type { TvAppearance } from '../types'
import { formatDatetime } from '../utils/dateUtils'

interface AppearanceCardProps {
  item: TvAppearance
  onToggle: (id: string) => void
  onRemove?: (id: string) => void
}

export function AppearanceCard({ item, onToggle, onRemove }: AppearanceCardProps) {
  return (
    <div className={`card ${item.watched ? 'card--watched' : ''}`}>
      <label className="card-checkbox-label">
        <input
          type="checkbox"
          checked={item.watched}
          onChange={() => onToggle(item.id)}
          className="card-checkbox"
        />
        <span className="card-check-icon">{item.watched ? '✅' : '⬜'}</span>
      </label>

      <div className="card-body">
        <div className="card-title">{item.title}</div>
        <div className="card-meta">
          <span className="card-datetime">{formatDatetime(item.datetime)}</span>
          <span className="card-channel">{item.channel}</span>
          {item.category && (
            <span className="card-category">{item.category}</span>
          )}
          {item.isManual && <span className="card-badge-manual">手動</span>}
        </div>
      </div>

      {item.isManual && onRemove && (
        <button
          className="card-remove"
          onClick={() => onRemove(item.id)}
          title="削除"
        >
          ✕
        </button>
      )}
    </div>
  )
}
