import type { TvAppearance } from '../types'
import { formatDatetime } from '../utils/dateUtils'

interface AppearanceCardProps {
  item: TvAppearance
  onToggle: (id: string) => void
  onRemove?: (id: string) => void
}

/** 表示名の略称マッピング */
const MEMBER_SHORT: Record<string, string> = {
  'timelesz': 'グループ',
  '佐藤勝利': '勝利',
  '菊池風磨': '風磨',
  '松島聡':   '聡',
  '寺西拓人': '拓人',
  '原嘉孝':   '嘉孝',
  '橋本将生': '将生',
  '猪俣周杜': '周杜',
  '篠塚大輝': '大輝',
}

/** グループ出演なら ['グループ'] のみ、個人出演ならメンバー名一覧を返す */
function resolveDisplayMembers(members: string[]): string[] {
  if (members.length === 0) return []
  if (members.includes('timelesz')) return ['グループ']
  return members.map((m) => MEMBER_SHORT[m] ?? m)
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
            {displayMembers.map((name) => (
              <span
                key={name}
                className={`member-chip ${name === 'グループ' ? 'member-chip--group' : 'member-chip--solo'}`}
              >
                {name}
              </span>
            ))}
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
