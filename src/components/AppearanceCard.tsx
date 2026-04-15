import type { TvAppearance } from '../types'
import { formatDatetime } from '../utils/dateUtils'

interface AppearanceCardProps {
  item: TvAppearance
  onToggle: (id: string) => void
  onRemove?: (id: string) => void
}

/** メンバーごとのチップカラー定義 */
const MEMBER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'timelesz': { bg: 'rgba(124, 106, 247, 0.15)', text: '#a090ff', border: 'rgba(124, 106, 247, 0.35)' },
  '佐藤勝利': { bg: 'rgba(255, 80,  80,  0.15)', text: '#ff6b6b', border: 'rgba(255, 80,  80,  0.35)' },
  '菊池風磨': { bg: 'rgba(160, 90,  240, 0.15)', text: '#b06af7', border: 'rgba(160, 90,  240, 0.35)' },
  '松島聡':   { bg: 'rgba(60,  200, 100, 0.15)', text: '#4dd87a', border: 'rgba(60,  200, 100, 0.35)' },
  '原嘉孝':   { bg: 'rgba(150, 230, 60,  0.15)', text: '#a0e040', border: 'rgba(150, 230, 60,  0.35)' },
  '寺西拓人': { bg: 'rgba(80,  190, 255, 0.15)', text: '#64beff', border: 'rgba(80,  190, 255, 0.35)' },
  '橋本将生': { bg: 'rgba(255, 100, 160, 0.15)', text: '#ff70b0', border: 'rgba(255, 100, 160, 0.35)' },
  '猪俣周杜': { bg: 'rgba(255, 215, 50,  0.15)', text: '#ffd700', border: 'rgba(255, 215, 50,  0.35)' },
  '篠塚大輝': { bg: 'rgba(220, 220, 220, 0.12)', text: '#d8d8d8', border: 'rgba(220, 220, 220, 0.35)' },
}

const DEFAULT_COLOR = { bg: 'rgba(136, 136, 160, 0.15)', text: '#8888a0', border: 'rgba(136, 136, 160, 0.3)' }

/** グループ出演なら 'timelesz' キーのまま、個人出演はフルネームで返す */
function resolveDisplayMembers(members: string[]): Array<{ label: string; colorKey: string }> {
  if (members.length === 0) return []
  if (members.includes('timelesz')) return [{ label: 'グループ', colorKey: 'timelesz' }]
  return members.map((m) => ({ label: m, colorKey: m }))
}

export function AppearanceCard({ item, onToggle, onRemove }: AppearanceCardProps) {
  const displayMembers = resolveDisplayMembers(item.members)

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
        {displayMembers.length > 0 && (
          <div className="card-members">
            {displayMembers.map(({ label, colorKey }) => {
              const c = MEMBER_COLORS[colorKey] ?? DEFAULT_COLOR
              return (
                <span
                  key={colorKey}
                  className="member-chip"
                  style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                >
                  {label}
                </span>
              )
            })}
          </div>
        )}
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
