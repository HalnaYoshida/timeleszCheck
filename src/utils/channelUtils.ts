/**
 * 関東エリアの地上波チャンネル一覧
 * thetv.jp で表示される表記に合わせたホワイトリスト
 */
const KANTO_TERRESTRIAL_CHANNELS = new Set([
  // NHK
  'NHK', 'NHK総合', 'NHKEテレ', 'NHK Eテレ', 'NHKEテレ1東京',
  'NHK総合・東京', 'NHK教育', 'NHKEテレ東京', 'NHK-G', 'NHK-E',
  // 日本テレビ
  '日本テレビ', '日テレ', 'NTV', '日本テレビ系列',
  // TBS
  'TBS', 'TBSテレビ', 'TBS系列',
  // フジテレビ
  'フジテレビ', 'CX', 'フジテレビ系列',
  // テレビ朝日
  'テレビ朝日', 'テレ朝', 'EX', 'テレビ朝日系列',
  // テレビ東京
  'テレビ東京', 'テレ東', 'TX', 'テレビ東京系列',
  // 独立局
  'TOKYO MX', '東京MX', 'ＴＯＫＹＯ ＭＸ', 'MX', 'MXテレビ',
  'tvk', 'テレビ神奈川',
  'チバテレ', '千葉テレビ', 'CTC',
  'テレ玉', 'テレビ埼玉',
  '群馬テレビ', 'GTV',
  'とちぎテレビ', 'GYT',
])

/** 関東地上波チャンネルかどうかを判定する */
export function isKantoTerrestrial(channel: string): boolean {
  // 完全一致
  if (KANTO_TERRESTRIAL_CHANNELS.has(channel)) return true
  // 部分一致：channel がホワイトリストのキーワードを含む場合のみ許可
  // （逆方向 ch.includes(channel) は短い文字列が非関東局にマッチするため除外）
  for (const ch of KANTO_TERRESTRIAL_CHANNELS) {
    if (channel.includes(ch)) return true
  }
  return false
}
