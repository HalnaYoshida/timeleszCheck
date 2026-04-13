import { useState } from 'react'
import type { TvAppearance } from '../types'

interface AddAppearanceFormProps {
  onAdd: (item: Omit<TvAppearance, 'id' | 'watched' | 'isManual'>) => void
  onClose: () => void
}

export function AddAppearanceForm({ onAdd, onClose }: AddAppearanceFormProps) {
  const [title, setTitle] = useState('')
  const [channel, setChannel] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [category, setCategory] = useState('バラエティー')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date || !time) return

    const datetime = new Date(`${date}T${time}:00`).toISOString()
    onAdd({ title: title.trim(), channel: channel.trim(), datetime, category, role: '出演' })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>番組を手動追加</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="title">番組名 *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: Mステ"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="channel">放送局</label>
            <input
              id="channel"
              type="text"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="例: テレビ朝日"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">日付 *</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="time">時刻 *</label>
              <input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">カテゴリー</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>バラエティー</option>
              <option>音楽</option>
              <option>ドラマ</option>
              <option>情報・ワイドショー</option>
              <option>その他</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary">
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
