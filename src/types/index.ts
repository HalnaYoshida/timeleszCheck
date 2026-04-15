export interface TvAppearance {
  id: string
  title: string
  channel: string
  datetime: string   // ISO 8601 文字列
  category: string
  role: string
  watched: boolean
  isManual: boolean  // 手動追加かスクレイプ取得か
  members: string[]  // 出演メンバー名 (例: ['timelesz'] or ['佐藤勝利', '菊池風磨'])
}

export type SectionType = 'today' | 'upcoming' | 'unwatched-past'
