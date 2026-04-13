import { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { fetchSchedule } from '../services/scheduleService'
import {
  loadAppearances,
  upsertAppearances,
  updateWatched,
  insertAppearance,
  deleteAppearance,
} from '../services/appearanceDb'
import type { TvAppearance } from '../types'
import { isToday, isFuture, isPast } from '../utils/dateUtils'
import { isKantoTerrestrial } from '../utils/channelUtils'

export function useAppearances(userId: string) {
  const [appearances, setAppearances] = useState<TvAppearance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useLocalStorage<string | null>('timelesz-last-fetched', null)

  // フィルタ設定は localStorage に保存（UIの好み設定）
  const [filterKanto, setFilterKanto] = useLocalStorage('timelesz-filter-kanto', true)
  const [filterTerrestrial, setFilterTerrestrial] = useLocalStorage('timelesz-filter-terrestrial', true)

  /** ログイン時に Supabase からデータを読み込む */
  useEffect(() => {
    setLoading(true)
    loadAppearances(userId)
      .then(setAppearances)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : '読み込み失敗'))
      .finally(() => setLoading(false))
  }, [userId])

  /** thetv.jp からスケジュールを取得して DB に反映 */
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. thetv.jp から取得
      const fetched = await fetchSchedule()

      // 2. 現在の DB の状態を取得（watched 状態を保持するため）
      const existing = await loadAppearances(userId)
      const existingMap = new Map(existing.map((a) => [a.id, a]))

      // 3. スクレイプ分をマージ（watched は既存値を引き継ぐ）
      const merged = fetched.map((item) => {
        const ex = existingMap.get(item.id)
        return ex ? { ...item, watched: ex.watched } : item
      })

      // 4. 手動追加分を保持（スクレイプ結果に含まれないもの）
      const mergedIds = new Set(merged.map((a) => a.id))
      const keptManual = existing.filter((a) => a.isManual && !mergedIds.has(a.id))

      const final = [...merged, ...keptManual].sort(
        (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      )

      // 5. DB に upsert してローカル状態を更新
      await upsertAppearances(final, userId)
      setAppearances(final)
      setLastFetched(new Date().toISOString())
    } catch (e) {
      setError(e instanceof Error ? e.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [userId, setLastFetched])

  /** 視聴状態を切り替える */
  const toggleWatched = useCallback(
    async (id: string) => {
      const item = appearances.find((a) => a.id === id)
      if (!item) return
      const next = !item.watched
      // 楽観的更新（先にUIを更新してからDBに書く）
      setAppearances((prev) => prev.map((a) => (a.id === id ? { ...a, watched: next } : a)))
      try {
        await updateWatched(id, next, userId)
      } catch (e) {
        // 失敗したらロールバック
        setAppearances((prev) => prev.map((a) => (a.id === id ? { ...a, watched: !next } : a)))
        setError(e instanceof Error ? e.message : '更新に失敗しました')
      }
    },
    [appearances, userId]
  )

  /** 手動で番組を追加する */
  const addManual = useCallback(
    async (item: Omit<TvAppearance, 'id' | 'watched' | 'isManual'>) => {
      const newItem: TvAppearance = {
        ...item,
        id: `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        watched: false,
        isManual: true,
      }
      await insertAppearance(newItem, userId)
      setAppearances((prev) =>
        [...prev, newItem].sort(
          (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        )
      )
    },
    [userId]
  )

  /** 番組を削除する（手動追加分のみ） */
  const remove = useCallback(
    async (id: string) => {
      setAppearances((prev) => prev.filter((a) => a.id !== id))
      try {
        await deleteAppearance(id, userId)
      } catch (e) {
        // 失敗したらロールバック（再取得）
        loadAppearances(userId).then(setAppearances)
        setError(e instanceof Error ? e.message : '削除に失敗しました')
      }
    },
    [userId]
  )

  /** フィルタ適用（手動追加分はスルー） */
  const applyFilter = useCallback(
    (items: TvAppearance[]): TvAppearance[] => {
      if (!filterKanto && !filterTerrestrial) return items
      return items.filter((a) => a.isManual || isKantoTerrestrial(a.channel))
    },
    [filterKanto, filterTerrestrial]
  )

  // セクション別に分類（フィルタ適用済み）
  const todayItems = applyFilter(appearances.filter((a) => isToday(a.datetime)))
  const upcomingItems = applyFilter(appearances.filter((a) => isFuture(a.datetime)))
  const unwatchedPastItems = applyFilter(
    appearances.filter((a) => isPast(a.datetime) && !a.watched)
  )

  return {
    appearances,
    todayItems,
    upcomingItems,
    unwatchedPastItems,
    filterKanto,
    filterTerrestrial,
    setFilterKanto,
    setFilterTerrestrial,
    loading,
    error,
    lastFetched,
    refresh,
    toggleWatched,
    addManual,
    remove,
  }
}
