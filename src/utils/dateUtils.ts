/**
 * thetv.jp の時刻プレフィックスを考慮して時間を補正する
 * 例: "夜7:00" → 19, "深夜0:54" → 0, "朝8:00" → 8
 */
function resolveHour(prefix: string, hour: number): number {
  // 夜・午後・夕方は PM なので 1〜11 時に +12
  if ((prefix.includes('夜') || prefix.includes('午後') || prefix.includes('夕方')) &&
      hour >= 1 && hour <= 11) {
    return hour + 12
  }
  return hour
}

/**
 * thetv.jp の日時文字列をパースして Date を返す
 * 例: "2026年4月14日(火) 深夜0:54" → Date(0:54)
 *     "2026年4月16日(木) 夜7:00"   → Date(19:00)
 *     "2026年4月20日(月) 20:00"    → Date(20:00)
 */
export function parseJaDatetime(text: string): Date | null {
  // 年月日を抽出
  const dateMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (!dateMatch) return null

  const year = parseInt(dateMatch[1], 10)
  const month = parseInt(dateMatch[2], 10) - 1
  const day = parseInt(dateMatch[3], 10)

  // 時刻とプレフィックスを抽出
  const timeMatch = text.match(/(深夜|早朝|朝|午前|昼|午後|夕方|夜)?(\d{1,2}):(\d{2})/)
  const prefix = timeMatch?.[1] ?? ''
  const rawHour = timeMatch ? parseInt(timeMatch[2], 10) : 0
  const minute = timeMatch ? parseInt(timeMatch[3], 10) : 0
  const hour = resolveHour(prefix, rawHour)

  return new Date(year, month, day, hour, minute)
}

/** 今日の開始・終了時刻を返す */
function getTodayRange(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  return { start, end }
}

export function isToday(isoString: string): boolean {
  const date = new Date(isoString)
  const { start, end } = getTodayRange()
  return date >= start && date <= end
}

export function isFuture(isoString: string): boolean {
  const date = new Date(isoString)
  const { end } = getTodayRange()
  return date > end
}

export function isPast(isoString: string): boolean {
  const date = new Date(isoString)
  const { start } = getTodayRange()
  return date < start
}

/** 表示用フォーマット: "4月14日(火) 深夜0:54" */
export function formatDatetime(isoString: string): string {
  const date = new Date(isoString)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']
  const weekday = weekdays[date.getDay()]
  const hour = date.getHours()
  const minute = String(date.getMinutes()).padStart(2, '0')

  let timeLabel = ''
  if (hour >= 0 && hour < 5) {
    timeLabel = `深夜${hour}:${minute}`
  } else if (hour >= 5 && hour < 8) {
    timeLabel = `早朝${hour}:${minute}`
  } else {
    timeLabel = `${hour}:${minute}`
  }

  return `${month}月${day}日(${weekday}) ${timeLabel}`
}

/** 日付のみ表示: "4月14日(火)" */
export function formatDate(isoString: string): string {
  const date = new Date(isoString)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']
  const weekday = weekdays[date.getDay()]
  return `${month}月${day}日(${weekday})`
}
