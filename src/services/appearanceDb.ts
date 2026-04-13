import { supabase } from '../lib/supabase'
import type { TvAppearance } from '../types'

/** DB の行型 */
interface DbRow {
  pk: number
  appearance_id: string
  user_id: string
  title: string
  channel: string
  datetime: string
  category: string
  role: string
  watched: boolean
  is_manual: boolean
}

/** DB行 → アプリ型 */
function fromDb(row: DbRow): TvAppearance {
  return {
    id: row.appearance_id,
    title: row.title,
    channel: row.channel,
    datetime: row.datetime,
    category: row.category,
    role: row.role,
    watched: row.watched,
    isManual: row.is_manual,
  }
}

/** アプリ型 → DB行（pk は GENERATED ALWAYS なので含めない） */
function toDb(item: TvAppearance, userId: string) {
  return {
    appearance_id: item.id,
    user_id: userId,
    title: item.title,
    channel: item.channel,
    datetime: item.datetime,
    category: item.category,
    role: item.role,
    watched: item.watched,
    is_manual: item.isManual,
  }
}

/** ユーザーの全番組を取得 */
export async function loadAppearances(userId: string): Promise<TvAppearance[]> {
  const { data, error } = await supabase
    .from('tv_appearances')
    .select('*')
    .eq('user_id', userId)
    .order('datetime', { ascending: true })

  if (error) throw error
  return (data as DbRow[]).map(fromDb)
}

/**
 * 複数番組を upsert（appearance_id + user_id の複合ユニーク制約で判定）
 * watched は既存行の値を保持するため、呼び出し元でマージ済みの値を渡すこと
 */
export async function upsertAppearances(
  items: TvAppearance[],
  userId: string
): Promise<void> {
  if (items.length === 0) return
  const rows = items.map((item) => toDb(item, userId))
  const { error } = await supabase
    .from('tv_appearances')
    .upsert(rows, { onConflict: 'appearance_id,user_id' })

  if (error) throw error
}

/** watched の ON/OFF を更新 */
export async function updateWatched(
  appearanceId: string,
  watched: boolean,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('tv_appearances')
    .update({ watched })
    .eq('appearance_id', appearanceId)
    .eq('user_id', userId)

  if (error) throw error
}

/** 手動追加番組を1件 insert */
export async function insertAppearance(
  item: TvAppearance,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('tv_appearances')
    .insert(toDb(item, userId))

  if (error) throw error
}

/** 番組を削除（手動追加のみ想定） */
export async function deleteAppearance(
  appearanceId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('tv_appearances')
    .delete()
    .eq('appearance_id', appearanceId)
    .eq('user_id', userId)

  if (error) throw error
}
