/**
 * npm run fetch で実行する Node.js スクリプト
 * timeleszグループ + 全メンバーの thetv.jp 出演スケジュールを取得し
 * public/schedule.json に保存する
 */

import { parse as parseHtml } from 'node-html-parser'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'public', 'schedule.json')

const FETCH_TARGETS = [
  { personId: '2000088701', label: 'timelesz' },
  { personId: '1000082993', label: '佐藤勝利' },
  { personId: '1000066863', label: '菊池風磨' },
  { personId: '1000082989', label: '松島聡' },
  { personId: '1000090863', label: '寺西拓人' },
  { personId: '2000002191', label: '原嘉孝' },
  { personId: '2000044633', label: '橋本将生' },
  { personId: '2000093936', label: '猪俣周杜' },
  { personId: '2000093937', label: '篠塚大輝' },
]

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  'Accept-Language': 'ja,en;q=0.9',
}

interface TvAppearance {
  id: string
  title: string
  channel: string
  datetime: string
  category: string
  role: string
  watched: boolean
  isManual: boolean
  members: string[]
}

function resolveHour(prefix: string, hour: number): number {
  if ((prefix.includes('夜') || prefix.includes('午後') || prefix.includes('夕方')) &&
      hour >= 1 && hour <= 11) {
    return hour + 12
  }
  return hour
}

function parseJaDatetime(text: string): Date | null {
  const dateMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (!dateMatch) return null
  const year = parseInt(dateMatch[1], 10)
  const month = parseInt(dateMatch[2], 10) - 1
  const day = parseInt(dateMatch[3], 10)
  const timeMatch = text.match(/(深夜|早朝|朝|午前|昼|午後|夕方|夜)?(\d{1,2}):(\d{2})/)
  const prefix = timeMatch?.[1] ?? ''
  const rawHour = timeMatch ? parseInt(timeMatch[2], 10) : 0
  const minute = timeMatch ? parseInt(timeMatch[3], 10) : 0
  return new Date(year, month, day, resolveHour(prefix, rawHour), minute)
}

function parseHtmlToAppearances(html: string): TvAppearance[] {
  const root = parseHtml(html)
  const items = root.querySelectorAll('.program_info li.thumblist__item')
  const appearances: TvAppearance[] = []

  for (const li of items) {
    const title = li.querySelector('p.item-text')?.text.trim() ?? ''
    const scheduleText = li.querySelector('p.item-schedule')?.text.trim() ?? ''
    const role = li.querySelector('p.item-sub')?.text.trim() ?? '出演'
    const category = li.querySelector('.label__block')?.text.trim() ?? ''
    const href = li.querySelector('a[href^="/program/"]')?.getAttribute('href') ?? ''

    if (!title || !scheduleText) continue
    const parts = scheduleText.split('／')
    const datepart = parts[0]?.trim() ?? ''
    const channel = parts[1]?.trim() ?? ''
    const date = parseJaDatetime(datepart)
    if (!date) continue

    const id = `thetv-${href.replace(/\//g, '-').replace(/^-|-$/g, '')}-${date.getTime()}`
    appearances.push({ id, title, channel, datetime: date.toISOString(), category, role, watched: false, isManual: false, members: [] })
  }
  return appearances
}

async function fetchPerson(personId: string, label: string): Promise<TvAppearance[]> {
  const url = `https://thetv.jp/person/${personId}/tv/`
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${label}`)
  const html = await res.text()
  const items = parseHtmlToAppearances(html)
  console.log(`  ${label}: ${items.length}件`)
  return items
}

async function main() {
  console.log('Fetching from thetv.jp...')

  const results = await Promise.allSettled(
    FETCH_TARGETS.map(({ personId, label }) => fetchPerson(personId, label))
  )

  // ID ごとに members を蓄積しながらデデュープ
  const accumulator = new Map<string, { item: TvAppearance; members: Set<string> }>()

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.status === 'rejected') {
      console.warn('  スキップ:', (result as PromiseRejectedResult).reason)
      continue
    }
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

  const merged = [...accumulator.values()]
    .map(({ item, members }) => ({ ...item, members: [...members] }))
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())

  console.log(`合計 ${merged.length} 件（重複除去後）`)
  mkdirSync(join(__dirname, '..', 'public'), { recursive: true })
  writeFileSync(OUTPUT_PATH, JSON.stringify(merged, null, 2), 'utf-8')
  console.log(`Saved to ${OUTPUT_PATH}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
