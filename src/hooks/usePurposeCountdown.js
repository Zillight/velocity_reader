import { useCallback, useEffect, useState } from 'react'

const KEY = 'velocity.purposeCountdown'
const DEFAULT = 30
export const MIN_COUNTDOWN = 5
export const MAX_COUNTDOWN = 120

function load() {
  try {
    const n = parseInt(localStorage.getItem(KEY) || '', 10)
    if (!Number.isFinite(n)) return DEFAULT
    return Math.min(MAX_COUNTDOWN, Math.max(MIN_COUNTDOWN, n))
  } catch {
    return DEFAULT
  }
}

let listeners = []
let cache = null

function get() {
  if (cache === null) cache = load()
  return cache
}

function notify() {
  listeners.forEach((l) => l())
}

function persist(n) {
  cache = n
  localStorage.setItem(KEY, String(n))
  notify()
}

export function usePurposeCountdown() {
  const [, force] = useState(0)

  useEffect(() => {
    const l = () => force((x) => x + 1)
    listeners.push(l)
    return () => {
      listeners = listeners.filter((x) => x !== l)
    }
  }, [])

  const countdownSeconds = get()

  const setCountdownSeconds = useCallback((n) => {
    const clamped = Math.min(MAX_COUNTDOWN, Math.max(MIN_COUNTDOWN, Math.round(n)))
    persist(clamped)
  }, [])

  return { countdownSeconds, setCountdownSeconds }
}
