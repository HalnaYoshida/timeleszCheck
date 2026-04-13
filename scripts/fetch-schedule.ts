/**
 * npm run fetch で実行する Node.js スクリプト
 * thetv.jp から timelesz の出演スケジュールを取得し public/schedule.json に保存する
 *
 * 使い方:
 *   npm run fetch
 */

import { parse as parseHtml } from 'node-html-parser'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'public', 'schedule.json')

interface TvAppearance {
  id: string
  title: string
  channel: string
  datetime: string
  category: string
  role: string
  watched: boolean
  isManual: boolean
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
  const hour = resolveHour(prefix, rawHour)

  return new Date(year, month, day, hour, minute)
}

async function fetchSchedule(): Promise<TvAppearance[]> {
  console.log('Fetching from thetv.jp...')
  const res = await fetch('https://thetv.jp/person/2000088701/tv/', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      'Accept-Language': 'ja,en;q=0.9',
    },
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

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
  }

  return appearances
}

async function main() {
  try {
    const appearances = await fetchSchedule()
    console.log(`Found ${appearances.length} appearances`)

    mkdirSync(join(__dirname, '..', 'public'), { recursive: true })
    writeFileSync(OUTPUT_PATH, JSON.stringify(appearances, null, 2), 'utf-8')
    console.log(`Saved to ${OUTPUT_PATH}`)
  } catch (e) {
    console.error('Error:', e)
    process.exit(1)
  }
}

main()
