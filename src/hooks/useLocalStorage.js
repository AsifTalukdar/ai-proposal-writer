import { useState, useCallback } from 'react'

function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    localStorage.removeItem(key)
    return fallback
  }
}

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => safeParse(key, initial))

  const set = useCallback((next) => {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next
      try {
        localStorage.setItem(key, JSON.stringify(resolved))
      } catch {
        console.warn('localStorage write failed')
      }
      return resolved
    })
  }, [key])

  return [value, set]
}