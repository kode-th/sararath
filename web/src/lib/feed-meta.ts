import { useSyncExternalStore } from 'react'

let count: number | null = null
const listeners = new Set<() => void>()

export function setFeedCount(next: number | null) {
  count = next
  listeners.forEach((notify) => notify())
}

export function useFeedCount() {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify)
      return () => {
        listeners.delete(notify)
      }
    },
    () => count,
    () => null,
  )
}
