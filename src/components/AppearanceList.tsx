import type { TvAppearance } from '../types'
import { AppearanceCard } from './AppearanceCard'

interface AppearanceListProps {
  title: string
  icon: string
  items: TvAppearance[]
  emptyMessage: string
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export function AppearanceList({
  title,
  icon,
  items,
  emptyMessage,
  onToggle,
  onRemove,
}: AppearanceListProps) {
  return (
    <section className="section">
      <h2 className="section-title">
        <span className="section-icon">{icon}</span>
        {title}
        <span className="section-count">{items.length}</span>
      </h2>
      {items.length === 0 ? (
        <p className="empty-message">{emptyMessage}</p>
      ) : (
        <ul className="card-list">
          {items.map((item) => (
            <li key={item.id}>
              <AppearanceCard item={item} onToggle={onToggle} onRemove={onRemove} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
