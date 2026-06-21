import { useCallback, useEffect, useState } from 'react'

const WPM_KEY = 'velocity.wpm' // default reading speed for new sessions
const DEFAULT_WPM = 350
export const MIN_WPM = 100
export const MAX_WPM = 900

function loadWpm() {
  try {
    const n = parseInt(localStorage.getItem(WPM_KEY) || '', 10)
    if (!Number.isFinite(n)) return DEFAULT_WPM
    return Math.min(MAX_WPM, Math.max(MIN_WPM, n))
  } catch {
    return DEFAULT_WPM
  }
}

let listeners = []
let wpmCache = null

function getWpm() {
  if (wpmCache === null) wpmCache = loadWpm()
  return wpmCache
}

function notify() {
  listeners.forEach((l) => l())
}

function persistWpm(n) {
  wpmCache = n
  localStorage.setItem(WPM_KEY, String(n))
  notify()
}

export function useWpm() {
  const [, force] = useState(0)

  useEffect(() => {
    const l = () => force((x) => x + 1)
    listeners.push(l)
    return () => {
      listeners = listeners.filter((x) => x !== l)
    }
  }, [])

  const defaultWpm = getWpm()

  const setDefaultWpm = useCallback((n) => {
    const clamped = Math.min(MAX_WPM, Math.max(MIN_WPM, Math.round(n)))
    persistWpm(clamped)
  }, [])

  return { defaultWpm, setDefaultWpm }
}
