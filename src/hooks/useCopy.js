import { useState, useCallback } from 'react'

export function useCopy(resetMs = 2000) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async (text) => {
    if (!text) return false
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), resetMs)
    return true
  }, [resetMs])

  return { copied, copy }
}