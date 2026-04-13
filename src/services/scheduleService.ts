import type { TvAppearance } from '../types'
import { parseJaDatetime } from '../utils/dateUtils'

/**
 * thetv.jp のHTMLをパースして TvAppearance[] を返す
 *
 * 実際の構造:
 * <li class="thumblist__item">
 *   <a href="/program/0001060543/47"></a>   ← 空のリンク (IDのみ)
 *   <div class="label__block">バラエティー</div>
 *   <p class="item-text">タイムレスマン</p>
 *   <div class="item-bottom">
 *     <p class="item-schedule">2026年4月14日(火) 深夜0:54／青森放送</p>
 *     <p class="item-sub">出演</p>
 *   </div>
 * </li>
 */
function parseThetvHtml(html: string): TvAppearance[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const items = doc.querySelectorAll('.program_info li.thumblist__item')
  const appearances: TvAppearance[] = []

  items.forEach((li) => {
    const title = li.querySelector('p.item-text')?.textContent?.trim() ?? ''
    const scheduleText = li.querySelector('p.item-schedule')?.textContent?.trim() ?? ''
    const role = li.querySelector('p.item-sub')?.textContent?.trim() ?? '出演'
    const category = li.querySelector('.label__block')?.textContent?.trim() ?? ''
    const href = li.querySelector('a[href^="/program/"]')?.getAttribute('href') ?? ''

    if (!title || !scheduleText) return

    // "2026年4月14日(火) 深夜0:54／青森放送" → 日時と放送局を分割
    const parts = scheduleText.split('／')
    const datepart = parts[0]?.trim() ?? ''
    const channel = parts[1]?.trim() ?? ''

    const date = parseJaDatetime(datepart)
    if (!date) return

    const id = `thetv-${href.replace(/\//g, '-').replace(/^-|-$/g, '')}-${date.getTime()}`

    appearances.push({
      id,
      title,
      channel,
      datetime: date.toISOString(),
      category,
      role,
      watched: false,
      isManual: false,
    })
  })

  return appearances
}

/**
 * Vite proxy 経由で thetv.jp から出演スケジュールを取得する (開発時)
 */
export async function fetchFromProxy(): Promise<TvAppearance[]> {
  const res = await fetch('/api/schedule')
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
  const html = await res.text()
  return parseThetvHtml(html)
}

/**
 * public/schedule.json から取得する (本番時 / npm run fetch 生成済みファイル)
 */
export async function fetchFromJson(): Promise<TvAppearance[]> {
  const res = await fetch('/schedule.json')
  if (!res.ok) throw new Error(`schedule.json not found: ${res.status}`)
  return res.json() as Promise<TvAppearance[]>
}

/**
 * proxy → JSON の順でフォールバックしながら取得する
 */
export async function fetchSchedule(): Promise<TvAppearance[]> {
  try {
    const data = await fetchFromProxy()
    if (data.length > 0) return data
    throw new Error('empty result from proxy')
  } catch {
    // 本番環境やCORSエラー時は schedule.json にフォールバック
    return fetchFromJson()
  }
}
