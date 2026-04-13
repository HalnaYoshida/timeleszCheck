import { useState, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { fetchSchedule } from '../services/scheduleService'
import type { TvAppearance } from '../types'
import { isToday, isFuture, isPast } from '../utils/dateUtils'
import { isKantoTerrestrial } from '../utils/channelUtils'

const STORAGE_KEY = 'timelesz-appearances'

export function useAppearances() {
  const [appearances, setAppearances] = useLocalStorage<TvAppearance[]>(STORAGE_KEY, [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useLocalStorage<string | null>('timelesz-last-fetched', null)

  /** 取得データと既存データをマージ（watched 状態を保持する） */
  const mergeAppearances = useCallback(
    (fetched: TvAppearance[]): TvAppearance[] => {
      const existingMap = new Map(appearances.map((a) => [a.id, a]))

      const merged = fetched.map((item) => {
        const existing = existingMap.get(item.id)
        return existing
          ? { ...item, watched: existing.watched }  // watched 状態を引き継ぐ
          : item
      })

      // 手動追加分を保持
      const manualItems = appearances.filter((a) => a.isManual)
      const mergedIds = new Set(merged.map((a) => a.id))
      const newManual = manualItems.filter((a) => !mergedIds.has(a.id))

      return [...merged, ...newManual].sort(
        (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      )
    },
    [appearances]
  )

  /** thetv.jp からスケジュールを取得して更新 */
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fetched = await fetchSchedule()
      setAppearances(mergeAppearances(fetched))
      setLastFetched(new Date().toISOString())
    } catch (e) {
      setError(e instanceof Error ? e.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [mergeAppearances, setAppearances, setLastFetched])

  /** 視聴状態を切り替える */
  const toggleWatched = useCallback(
    (id: string) => {
      setAppearances((prev) =>
        prev.map((a) => (a.id === id ? { ...a, watched: !a.watched } : a))
      )
    },
    [setAppearances]
  )

  /** 手動で番組を追加する */
  const addManual = useCallback(
    (item: Omit<TvAppearance, 'id' | 'watched' | 'isManual'>) => {
      const newItem: TvAppearance = {
        ...item,
        id: `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        watched: false,
        isManual: true,
      }
      setAppearances((prev) =>
        [...prev, newItem].sort(
          (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        )
      )
    },
    [setAppearances]
  )

  /** 番組を削除する（手動追加分のみ） */
  const remove = useCallback(
    (id: string) => {
      setAppearances((prev) => prev.filter((a) => a.id !== id))
    },
    [setAppearances]
  )

  // フィルタ設定（localStorage に保存）
  const [filterKanto, setFilterKanto] = useLocalStorage('timelesz-filter-kanto', true)
  const [filterTerrestrial, setFilterTerrestrial] = useLocalStorage('timelesz-filter-terrestrial', true)

  /** 手動追加分はフィルタをスルーし、スクレイプ分のみに適用する */
  const applyFilter = useCallback(
    (items: TvAppearance[]): TvAppearance[] => {
      if (!filterKanto && !filterTerrestrial) return items
      return items.filter((a) => {
        if (a.isManual) return true  // 手動追加は常に表示
        if (filterKanto && filterTerrestrial) return isKantoTerrestrial(a.channel)
        // 地上波のみ or 関東のみは単独では判定不可のため同じ扱い
        if (filterKanto || filterTerrestrial) return isKantoTerrestrial(a.channel)
        return true
      })
    },
    [filterKanto, filterTerrestrial]
  )

  // セクション別に分類（フィルタ適用済み）
  const todayItems = applyFilter(appearances.filter((a) => isToday(a.datetime)))
  const upcomingItems = applyFilter(appearances.filter((a) => isFuture(a.datetime)))
  const unwatchedPastItems = applyFilter(appearances.filter((a) => isPast(a.datetime) && !a.watched))

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
