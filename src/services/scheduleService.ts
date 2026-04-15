import type { TvAppearance } from '../types'
import { parseJaDatetime } from '../utils/dateUtils'

/**
 * timeleszグループ + 全メンバーの thetv.jp person ID
 * グループを先頭に置くことで、グループ出演が dedup 時に優先される
 */
export const FETCH_TARGETS = [
  { personId: '2000088701', label: 'timelesz' },
  { personId: '1000082993', label: '佐藤勝利' },
  { personId: '1000066863', label: '菊池風磨' },
  { personId: '1000082989', label: '松島聡' },
  { personId: '1000090863', label: '寺西拓人' },
  { personId: '2000002191', label: '原嘉孝' },
  { personId: '2000044633', label: '橋本将生' },
  { personId: '2000093936', label: '猪俣周杜' },
  { personId: '2000093937', label: '篠塚大輝' },
] as const

/**
 * thetv.jp のHTMLをパースして TvAppearance[] を返す
 *
 * <li class="thumblist__item">
 *   <a href="/program/0001060543/47"></a>
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
    // "今日放送バラエティー" → "バラエティー" のように時制プレフィックスを除去
    const rawCategory = li.querySelector('.label__block')?.textContent?.trim() ?? ''
    const category = rawCategory.replace(/^(今日|明日|昨日|今週|来週|再来週)放送/, '').trim()
    const href = li.querySelector('a[href^="/program/"]')?.getAttribute('href') ?? ''

    // href が取れない場合は ID が衝突するのでスキップ
    if (!title || !scheduleText || !href) return

    const parts = scheduleText.split('／')
    const datepart = parts[0]?.trim() ?? ''
    const channel = parts[1]?.trim() ?? ''

    const date = parseJaDatetime(datepart)
    if (!date) return

    const id = `thetv-${href.replace(/\//g, '-').replace(/^-|-$/g, '')}-${date.getTime()}`
    appearances.push({ id, title, channel, datetime: date.toISOString(), category, role, watched: false, isManual: false, members: [] })
  })

  return appearances
}

/**
 * Vite proxy 経由で1人分を取得する
 * /api/person/:personId → https://thetv.jp/person/:personId/tv/
 */
async function fetchPersonFromProxy(personId: string): Promise<TvAppearance[]> {
  const res = await fetch(`/api/person/${personId}`)
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
  const html = await res.text()
  return parseThetvHtml(html)
}

/**
 * 全ソース（グループ + 全メンバー）を並列フェッチして ID でデデュープする
 * - 失敗したソースはスキップ（他のソースは継続）
 * - グループが先頭なのでグループ出演が優先される
 */
async function fetchAllFromProxy(): Promise<TvAppearance[]> {
  const results = await Promise.allSettled(
    FETCH_TARGETS.map(({ personId }) => fetchPersonFromProxy(personId))
  )

  // ID ごとに item を保持しつつ members を蓄積する
  const accumulator = new Map<string, { item: TvAppearance; members: Set<string> }>()

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.status === 'rejected') continue
    const label = FETCH_TARGETS[i].label

    for (const item of result.value) {
      const existing = accumulator.get(item.id)
      if (!existing) {
        accumulator.set(item.id, { item, members: new Set([label]) })
      } else {
        existing.members.add(label)
      }
    }
  }

  return [...accumulator.values()]
    .map(({ item, members }) => ({ ...item, members: [...members] }))
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
}

/**
 * public/schedule.json から取得する（本番 / npm run fetch 生成済み）
 * 旧バージョンとの互換性のため members フィールドを補完する
 */
async function fetchFromJson(): Promise<TvAppearance[]> {
  const res = await fetch('/schedule.json')
  if (!res.ok) throw new Error(`schedule.json not found: ${res.status}`)
  const data = await res.json() as TvAppearance[]
  return data.map((item) => ({ ...item, members: item.members ?? [] }))
}

/**
 * proxy → JSON の順でフォールバックしながら全ソースを取得する
 */
export async function fetchSchedule(): Promise<TvAppearance[]> {
  try {
    const data = await fetchAllFromProxy()
    if (data.length > 0) return data
    throw new Error('empty result from proxy')
  } catch {
    return fetchFromJson()
  }
}
